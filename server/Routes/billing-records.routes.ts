import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreateBillingRecordsDTO, updateBillingRecordsDTO } from "../dto/billing-records.dto";
import billingRecordsController from "../controller/billingController/billing-records.controller";

const router = Router()

router.post("/", verifyUser,checkPermission('admin','PurchaseOrder','can_create'),validateDto(CreateBillingRecordsDTO),billingRecordsController.createBillingRecords);
router.put("/:id",verifyUser, checkPermission('admin','PurchaseOrder','can_update'), validateDto(updateBillingRecordsDTO), billingRecordsController.updateBillingRecords);
router.get("/", verifyUser, checkPermission('admin','PurchaseOrder','can_read') ,billingRecordsController.getAllBillingRecords);


export default router;