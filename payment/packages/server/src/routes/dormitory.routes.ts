import { Router } from "express";
import { dormitoryController } from "../controllers/dormitory.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const dormitoryRouter = Router();

dormitoryRouter.use(authMiddleware);
dormitoryRouter.get("/buildings", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => dormitoryController.listBuildings(req, res, next));
dormitoryRouter.post("/buildings", rbacMiddleware(Role.ADMIN), (req, res, next) => dormitoryController.createBuilding(req, res, next));
dormitoryRouter.get("/rooms", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => dormitoryController.listRooms(req, res, next));
dormitoryRouter.post("/rooms", rbacMiddleware(Role.ADMIN), (req, res, next) => dormitoryController.createRoom(req, res, next));
dormitoryRouter.put("/rooms/:roomId/assign", rbacMiddleware(Role.ADMIN), (req, res, next) => dormitoryController.assignStudent(req, res, next));
dormitoryRouter.put("/rooms/:roomId/remove", rbacMiddleware(Role.ADMIN), (req, res, next) => dormitoryController.removeStudent(req, res, next));
