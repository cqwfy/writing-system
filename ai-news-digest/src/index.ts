import { XMLParser } from "fast-xml-parser";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ---- 配置 ----

const SOURCES = [
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
  {
    name: "Hacker News",
    url: "https://hnrss.org/newest?q=AI&count=30",
  },
] as const;

const OUTPUT_DIR = join(import.meta.dirname, "..", "output");
const HOURS_WINDOW = 24;
const SUMMARY_MAX_LEN = 100;

// ---- 类型 ----

interface Article {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  summary: string;
  titleZh: string;
  summaryZh: string;
}

// ---- 工具函数 ----

/** 解析 RFC 2822 格式的日期字符串（RSS pubDate 标准格式） */
function parseRSSDate(raw: unknown): Date {
  if (raw instanceof Date) return raw;
  const str = String(raw ?? "");
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/** 清理 HTML 实体 */
function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(Number.parseInt(n, 16)),
    );
}

/** 清理标题 */
function cleanTitle(raw: unknown): string {
  // Atom: <title type="html">text</title> → { type, "#text" }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    raw = (raw as Record<string, unknown>)["#text"] ?? "";
  }
  return decodeEntities(String(raw ?? "").trim()) || "(无标题)";
}

/** 提取摘要：从 description/summary 中去掉 HTML 标签，取前 N 字 */
function extractSummary(item: Record<string, unknown>): string {
  let raw = item.description ?? item.summary ?? item.content ?? "";

  // Atom 嵌套对象
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    raw = (raw as Record<string, unknown>)["#text"] ?? "";
  }

  let text = decodeEntities(
    String(raw ?? "")
      .replace(/<[^>]*>/g, "")   // 去 HTML 标签
      .replace(/\s+/g, " ")       // 合并空白
      .trim(),
  );

  if (!text) return "";

  // HNRSS description 是 "Article URL: ... Comments URL: ..." 格式，非摘要
  if (/^Article URL:/.test(text)) return "";

  // 截取前 N 字符然后在最后一个句/空格处断句
  if (text.length <= SUMMARY_MAX_LEN) return text;
  const slice = text.slice(0, SUMMARY_MAX_LEN);
  const cut = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("。"), slice.lastIndexOf(" "));
  return (cut > SUMMARY_MAX_LEN * 0.5 ? slice.slice(0, cut + 1) : slice) + "…";
}

/** 规范化链接 */
function extractLink(item: Record<string, unknown>): string {
  const link = item.link;
  if (typeof link === "string") return link.trim();
  if (typeof link === "object" && link !== null) {
    const href = (link as Record<string, unknown>).href;
    if (typeof href === "string") return href.trim();
    const arr = link as Array<Record<string, unknown>>;
    if (arr[0]?.href) return String(arr[0].href).trim();
  }
  return "";
}

// ---- 翻译 ----

/** 翻译单段文本（英文 → 中文） */
async function translateOne(text: string): Promise<string> {
  if (!text.trim()) return "";
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const data = (await res.json()) as Array<unknown>;
  // [[["译文","原文",...]],null,"en",...]
  const segments = (data[0] as Array<Array<unknown>>) ?? [];
  return segments.map((s) => String(s[0] ?? "")).join("");
}

/** 并发翻译，最多 N 个并行请求 */
async function batchTranslate(
  texts: string[],
  concurrency = 5,
): Promise<string[]> {
  const results: string[] = new Array(texts.length);
  let idx = 0;

  async function worker() {
    while (idx < texts.length) {
      const i = idx++;
      results[i] = await translateOne(texts[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, texts.length) }, () => worker()),
  );

  return results;
}

// ---- 抓取 & 解析 ----

async function fetchFeed(
  name: string,
  url: string,
): Promise<Article[]> {
  console.log(`  正在抓取 ${name}...`);
  const res = await fetch(url, {
    headers: { "User-Agent": "ai-news-digest/1.0" },
  });
  if (!res.ok) {
    console.error(`    ✗ ${name} HTTP ${res.status}`);
    return [];
  }
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
  });

  const parsed = parser.parse(xml);
  let rawItems: Record<string, unknown>[] = [];

  // RSS 2.0
  if (parsed.rss?.channel?.item) {
    const item = parsed.rss.channel.item;
    rawItems = Array.isArray(item) ? item : [item];
  }
  // Atom
  else if (parsed.feed?.entry) {
    const entry = parsed.feed.entry;
    rawItems = Array.isArray(entry) ? entry : [entry];
  }

  const articles: Article[] = [];
  for (const item of rawItems) {
    const pubDate = parseRSSDate(
      item.pubDate ?? item["dc:date"] ?? item.published ?? item.updated,
    );
    articles.push({
      title: cleanTitle(item.title),
      link: extractLink(item),
      pubDate,
      source: name,
      summary: extractSummary(item),
      titleZh: "",
      summaryZh: "",
    });
  }

  console.log(`    ✓ ${name}: ${articles.length} 篇`);
  return articles;
}

// ---- 主流程 ----

async function main() {
  console.log("AI 新闻聚合 · 抓取中...\n");

  const now = new Date();
  const since = new Date(now.getTime() - HOURS_WINDOW * 3600_000);

  // 并行抓取所有源
  const results = await Promise.all(
    SOURCES.map((s) => fetchFeed(s.name, s.url)),
  );
  let all = results.flat();

  // 过滤最近 24 小时
  all = all.filter((a) => a.pubDate >= since);

  // 按发布时间倒序
  all.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  const sourceCount = new Set(all.map((a) => a.source)).size;
  console.log(
    `\n共 ${all.length} 篇文章（最近 ${HOURS_WINDOW} 小时），来自 ${sourceCount} 个源`,
  );

  // 翻译标题和摘要
  if (all.length > 0) {
    console.log("正在翻译...");
    const textsToTranslate: string[] = [];
    const slots: { article: Article; field: "titleZh" | "summaryZh" }[] = [];

    for (const a of all) {
      textsToTranslate.push(a.title);
      slots.push({ article: a, field: "titleZh" });
      if (a.summary) {
        textsToTranslate.push(a.summary);
        slots.push({ article: a, field: "summaryZh" });
      }
    }

    try {
      const translations = await batchTranslate(textsToTranslate);
      for (let i = 0; i < slots.length; i++) {
        slots[i].article[slots[i].field] = translations[i] ?? "";
      }
      console.log(`  翻译完成，共 ${textsToTranslate.length} 段`);
    } catch (err) {
      console.warn("  翻译失败，将跳过中文部分:", String(err));
    }
  }

  // ---- 生成 Markdown ----

  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const lines: string[] = [
    `# AI 新闻日报 · ${dateStr}`,
    "",
    `> 自动生成于 ${timeStr} | 最近 ${HOURS_WINDOW} 小时 | 共收录 **${all.length}** 篇，来自 **${sourceCount}** 个源`,
    "",
    "---",
    "",
  ];

  // 按来源分组
  const groupMap = new Map<string, Article[]>();
  for (const a of all) {
    const list = groupMap.get(a.source) ?? [];
    list.push(a);
    groupMap.set(a.source, list);
  }

  const fmtDate = (d: Date) =>
    d.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });

  for (const [source, articles] of groupMap) {
    lines.push(`## ${source}（${articles.length} 篇）`, "");
    for (const a of articles) {
      // 标题行（中英双语）
      lines.push(
        `- [${a.title}](${a.link})`,
        `  <small>${fmtDate(a.pubDate)}</small>`,
      );
      // 摘要（英文 + 中文翻译）
      if (a.summary) {
        lines.push(`  > ${a.summary}`);
        if (a.summaryZh)
          lines.push(`  > ${a.summaryZh}`);
      }
      // 中文标题
      if (a.titleZh)
        lines.push(`  > 📌 ${a.titleZh}`);
      lines.push("");
    }
  }

  lines.push("---", "", `共 **${all.length}** 篇文章`);

  // 写入 output 目录
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `${dateStr}-ai-news.md`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, lines.join("\n"), "utf-8");

  console.log(`日报已生成: ${filepath}`);
}

main().catch((err) => {
  console.error("运行出错:", err);
  process.exit(1);
});
