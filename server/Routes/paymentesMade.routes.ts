import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreatePaymentMadeDto, UpdatePaymentMadeDto } from "../dto/paymentMade.dto";
import { paymentMadeController } from "../controller/paymentMadeController/paymentMadeController";

const router = Router()

router.post("/", verifyUser,checkPermission('admin','PurchaseOrder','can_create'),validateDto(CreatePaymentMadeDto),paymentMadeController.createPaymentMade);
router.post("/:id", verifyUser,checkPermission('admin','PurchaseOrder','can_update'),validateDto(UpdatePaymentMadeDto),paymentMadeController.updatePaymentMadeByID);
router.get("/", verifyUser, checkPermission('admin','PurchaseOrder','can_read') ,paymentMadeController.getAllPaymentMadeData);
router.get("/:id", verifyUser, checkPermission('admin','PurchaseOrder','can_read') ,paymentMadeController.getSinglePaymentMadeDataById);


export default router;