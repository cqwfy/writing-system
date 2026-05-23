interface PageHeaderProps {
  title: string;
  desc: string;
}

export function PageHeader({ title, desc }: PageHeaderProps) {
  return (
    <div>
      <span style={{ fontWeight: 600 }}>{title}</span>
      <br />
      <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}>{desc}</span>
    </div>
  );
}
