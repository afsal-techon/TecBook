import { Router } from "express";
import purchaseOrderController from "../controller/PurchaseOrderController/purchase-order.controller";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "../dto/create-purchase-order.dto";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { upload } from "../middleware/imgUpload";


const router = Router();

router.post("/", verifyUser,checkPermission('admin','PurchaseOrder','can_create'),upload.array('documents',10),validateDto(CreatePurchaseOrderDto),purchaseOrderController.createPurchaseOrder);
router.put("/:id",verifyUser, checkPermission('admin','PurchaseOrder','can_update'),upload.array('documents',10), validateDto(UpdatePurchaseOrderDto),purchaseOrderController.updatePurchaseOrder);
router.get("/", verifyUser, checkPermission('admin','PurchaseOrder','can_read') ,purchaseOrderController.getAllPurchaseOrders);
router.get("/:id",verifyUser, checkPermission('admin','PurchaseOrder','can_read') ,purchaseOrderController.getPurchaseOrderById);
router.delete("/:id",verifyUser,checkPermission('admin','PurchaseOrder','can_delete') , purchaseOrderController.genericDeleteOneById);




export default router;
