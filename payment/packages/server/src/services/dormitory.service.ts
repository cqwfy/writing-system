import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/error-handler";

const prisma = new PrismaClient();

export class DormitoryService {
  async listBuildings() {
    return prisma.dormitoryBuilding.findMany({
      include: { rooms: { include: { students: { where: { deletedAt: null }, select: { id: true, studentNo: true, name: true } } } } },
    });
  }

  async createBuilding(data: { name: string; buildingType: string; floorCount: number; description?: string }) {
    return prisma.dormitoryBuilding.create({ data });
  }

  async listRooms(buildingId?: number) {
    return prisma.dormitoryRoom.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: {
        building: { select: { id: true, name: true } },
        students: { where: { deletedAt: null }, select: { id: true, studentNo: true, name: true, gender: true } },
      },
    });
  }

  async createRoom(data: { buildingId: number; roomNumber: string; capacity?: number }) {
    return prisma.dormitoryRoom.create({ data: { ...data, capacity: data.capacity || 4 } });
  }

  async assignStudent(roomId: number, studentId: number) {
    const room = await prisma.dormitoryRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError(404, "宿舍房间不存在");
    if (room.occupied >= room.capacity) throw new AppError(400, "房间已满");

    const student = await prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
    if (!student) throw new AppError(404, "学生不存在");
    if (student.dormitoryId) throw new AppError(400, "该学生已分配宿舍");

    await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { dormitoryId: roomId },
      }),
      prisma.dormitoryRoom.update({
        where: { id: roomId },
        data: { occupied: { increment: 1 } },
      }),
    ]);
  }

  async assignStudents(roomId: number, studentIds: number[]) {
    if (!studentIds || studentIds.length === 0) throw new AppError(400, "请选择至少一名学生");
    const room = await prisma.dormitoryRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError(404, "宿舍房间不存在");
    if (room.occupied + studentIds.length > room.capacity) throw new AppError(400, `房间容量不足，剩余 ${room.capacity - room.occupied} 个床位`);

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, deletedAt: null },
    });
    if (students.length !== studentIds.length) throw new AppError(404, "部分学生不存在");
    const alreadyAssigned = students.find((s) => s.dormitoryId);
    if (alreadyAssigned) throw new AppError(400, `学生 ${alreadyAssigned.name} 已分配宿舍`);

    await prisma.$transaction([
      prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: { dormitoryId: roomId },
      }),
      prisma.dormitoryRoom.update({
        where: { id: roomId },
        data: { occupied: { increment: studentIds.length } },
      }),
    ]);

    return { assigned: studentIds.length };
  }

  async removeStudent(roomId: number, studentId: number) {
    await prisma.$transaction([
      prisma.student.update({ where: { id: studentId }, data: { dormitoryId: null } }),
      prisma.dormitoryRoom.update({ where: { id: roomId }, data: { occupied: { increment: -1 } } }),
    ]);
  }

  async getMyDormitory(studentId: number) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        dormitory: { include: { building: { select: { id: true, name: true, buildingType: true } } } },
      },
    });
    if (!student) throw new AppError(404, "学生不存在");
    return student.dormitory || null;
  }
}

export const dormitoryService = new DormitoryService();
