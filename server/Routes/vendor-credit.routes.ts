import { Router } from "express";
import { validateDto } from "../middleware/validate-dto.middleware";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { upload } from "../middleware/imgUpload";
import { CreateVendorCreditDto, UpdateVendorCreditDto } from "../dto/vendor-credit.dto";
import { vendorCreditController } from "../controller/vendorCreditController/vendor-credit.controller";


const router = Router();

router.post("/", verifyUser,checkPermission('admin','vendorCredit','can_create'),upload.array('documents',10),validateDto(CreateVendorCreditDto),vendorCreditController.createVendorCredit);
router.put("/:id",verifyUser, checkPermission('admin','vendorCredit','can_update'),upload.array('documents',10), validateDto(UpdateVendorCreditDto),vendorCreditController.updateVendorCredit);
router.get("/", verifyUser, checkPermission('admin','vendorCredit','can_read') ,vendorCreditController.getAllVendorCredits);
router.get("/:id",verifyUser, checkPermission('admin','vendorCredit','can_read') ,vendorCreditController.getVendorCreditById);
router.delete("/:id",verifyUser,checkPermission('admin','vendorCredit','can_delete') , vendorCreditController.deleteVendorCredit);




export default router;
