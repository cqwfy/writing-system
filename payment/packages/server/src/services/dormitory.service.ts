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

  async removeStudent(roomId: number, studentId: number) {
    await prisma.$transaction([
      prisma.student.update({ where: { id: studentId }, data: { dormitoryId: null } }),
      prisma.dormitoryRoom.update({ where: { id: roomId }, data: { occupied: { increment: -1 } } }),
    ]);
  }
}

export const dormitoryService = new DormitoryService();
