import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreatePaymentMadeDto, UpdatePaymentMadeDto } from "../dto/paymentMade.dto";
import { paymentMadeController } from "../controller/paymentMadeController/paymentMadeController";
import { upload } from "../middleware/imgUpload";

const router = Router()

router.post("/", verifyUser,checkPermission('admin','PurchaseOrder','can_create'),upload.array('documents',10),validateDto(CreatePaymentMadeDto),paymentMadeController.createPaymentMade);
router.post("/:id", verifyUser,checkPermission('admin','PurchaseOrder','can_update'),upload.array('documents',10),validateDto(UpdatePaymentMadeDto),paymentMadeController.updatePaymentMadeByID);
router.get("/", verifyUser, checkPermission('admin','PurchaseOrder','can_read') ,paymentMadeController.getAllPaymentMadeData);
router.get("/:id", verifyUser, checkPermission('admin','PurchaseOrder','can_read') ,paymentMadeController.getSinglePaymentMadeDataById);
router.delete("/:id",verifyUser,checkPermission('admin','PurchaseOrder','can_delete') , paymentMadeController.deletePaymentMadeById);



export default router;