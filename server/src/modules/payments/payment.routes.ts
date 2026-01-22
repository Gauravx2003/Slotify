import { Router } from "express";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post("/order", PaymentController.createOrder);
router.post("/verify", PaymentController.verifyPayment);
router.get("/config", PaymentController.getConfig);

export default router;
