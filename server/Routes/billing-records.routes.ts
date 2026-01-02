import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreateBillingRecordsDTO, updateBillingRecordsDTO } from "../dto/billing-records.dto";
import billingRecordsController from "../controller/billingController/billing-records.controller";
import { upload } from "../middleware/imgUpload";

const router = Router()

router.post("/", verifyUser,checkPermission('admin','BillingRecords','can_create'),upload.array('documents',10),validateDto(CreateBillingRecordsDTO),billingRecordsController.createBillingRecords);
router.put("/:id",verifyUser, checkPermission('admin','BillingRecords','can_update'),upload.array('documents',10), validateDto(updateBillingRecordsDTO), billingRecordsController.updateBillingRecords);
router.get("/", verifyUser, checkPermission('admin','BillingRecords','can_read') ,billingRecordsController.getAllBillingRecords);
router.get("/:id",verifyUser, checkPermission('admin','BillingRecords','can_read') ,billingRecordsController.getBillingRecordById);
router.delete("/:id",verifyUser,checkPermission('admin','BillingRecords','can_delete') , billingRecordsController.deleteBillingRecordById);



export default router;