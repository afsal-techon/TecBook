import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreatePaymentMadeDto } from "../dto/paymentMade.dto";
import { paymentMadeController } from "../controller/paymentMadeController/paymentMadeController";

const router = Router()

router.post("/", verifyUser,checkPermission('admin','PurchaseOrder','can_create'),validateDto(CreatePaymentMadeDto),paymentMadeController.createPaymentMade);

export default router;