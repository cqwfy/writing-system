import { Router } from "express";
import { feeController } from "../controllers/fee.controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { Role } from "@sms/shared";

export const feeRouter = Router();

feeRouter.use(authMiddleware);
feeRouter.get("/items", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => feeController.listItems(req, res, next));
feeRouter.post("/items", rbacMiddleware(Role.ADMIN), (req, res, next) => feeController.createItem(req, res, next));
feeRouter.post("/items/:feeItemId/generate", rbacMiddleware(Role.ADMIN), (req, res, next) => feeController.generatePayments(req, res, next));

feeRouter.get("/payments", rbacMiddleware(Role.ADMIN, Role.TEACHER), (req, res, next) => feeController.listPayments(req, res, next));
feeRouter.get("/payments/my", (req, res, next) => feeController.getMyPayments(req, res, next));
feeRouter.post("/payments/:paymentId/paid", rbacMiddleware(Role.ADMIN), (req, res, next) => feeController.markAsPaid(req, res, next));
