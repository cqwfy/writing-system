import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始插入种子数据...");

  // 1. 创建管理员
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminHash,
      role: "admin",
      name: "系统管理员",
      phone: "13800000000",
    },
  });
  console.log(`  管理员: admin / Admin@123`);

  // 2. 创建教师
  const teacherData = [
    { username: "teacher1", name: "张老师", subject: "语文", phone: "13800000001" },
    { username: "teacher2", name: "李老师", subject: "数学", phone: "13800000002" },
    { username: "teacher3", name: "王老师", subject: "英语", phone: "13800000003" },
  ];

  const teachers: any[] = [];
  for (const t of teacherData) {
    const hash = await bcrypt.hash("Teacher@123", 10);
    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: {},
      create: {
        username: t.username,
        passwordHash: hash,
        role: "teacher",
        name: t.name,
        phone: t.phone,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        teacherNo: `T${String(teachers.length + 1).padStart(4, "0")}`,
        name: t.name,
        subject: t.subject,
        phone: t.phone,
      },
    });
    teachers.push(teacher);
  }
  console.log(`  教师: ${teacherData.map((t) => t.name).join(", ")} （密码: Teacher@123）`);

  // 3. 创建班级
  const classData = [
    { name: "七年级(1)班", gradeLevel: "7", homeroomTeacherId: teachers[0].id },
    { name: "七年级(2)班", gradeLevel: "7", homeroomTeacherId: teachers[1].id },
    { name: "八年级(1)班", gradeLevel: "8", homeroomTeacherId: teachers[2].id },
  ];

  const classes: any[] = [];
  for (const c of classData) {
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        gradeLevel: c.gradeLevel,
        homeroomTeacherId: c.homeroomTeacherId,
        academicYear: "2026-2027",
      },
    });
    classes.push(cls);
  }
  console.log(`  班级: ${classData.map((c) => c.name).join(", ")}`);

  // 4. 创建示例学生（七年级(1)班 10 名）
  const studentNames = [
    { name: "赵小明", gender: "male", age: 13 },
    { name: "钱小红", gender: "female", age: 13 },
    { name: "孙小刚", gender: "male", age: 12 },
    { name: "李小丽", gender: "female", age: 13 },
    { name: "周小强", gender: "male", age: 13 },
    { name: "吴小美", gender: "female", age: 12 },
    { name: "郑小文", gender: "male", age: 13 },
    { name: "王小华", gender: "female", age: 13 },
    { name: "陈小龙", gender: "male", age: 12 },
    { name: "林小芳", gender: "female", age: 13 },
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const studentNo = `2026${String(i + 1).padStart(4, "0")}`;

    // 创建学生用户
    const studentHash = await bcrypt.hash("Student@123", 10);
    const user = await prisma.user.create({
      data: {
        username: `student${i + 1}`,
        passwordHash: studentHash,
        role: "student",
        name: s.name,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentNo,
        name: s.name,
        gender: s.gender,
        classId: classes[0].id,
        enrollmentDate: new Date("2026-09-01"),
        hobbies: ["阅读", "篮球", "绘画", "音乐", "编程"][i % 5],
        address: `北京市朝阳区示例路${i + 1}号`,
      },
    });

    // 创建家长
    const fatherHash = await bcrypt.hash("Parent@123", 10);
    const motherHash = await bcrypt.hash("Parent@123", 10);

    const fatherUser = await prisma.user.create({
      data: {
        username: `parent_f_${studentNo}`,
        passwordHash: fatherHash,
        role: "parent",
        name: `${s.name.split("")[0]}爸爸`,
        phone: `13800000${String(1000 + i).slice(1)}`,
      },
    });

    const motherUser = await prisma.user.create({
      data: {
        username: `parent_m_${studentNo}`,
        passwordHash: motherHash,
        role: "parent",
        name: `${s.name.split("")[0]}妈妈`,
        phone: `13900000${String(1000 + i).slice(1)}`,
      },
    });

    await prisma.parent.createMany({
      data: [
        { userId: fatherUser.id, studentId: student.id, relation: "father", name: fatherUser.name, phone: fatherUser.phone || "", isPrimary: true },
        { userId: motherUser.id, studentId: student.id, relation: "mother", name: motherUser.name, phone: motherUser.phone || "", isPrimary: false },
      ],
    });

    // 更新班级人数
    await prisma.class.update({
      where: { id: classes[0].id },
      data: { studentCount: { increment: 1 } },
    });
  }
  console.log(`  学生: 10 名（密码: Student@123）`);
  console.log(`  家长: 20 名（密码: Parent@123）`);

  console.log("\n✅ 种子数据插入完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
