import { Router } from "express";
import purchaseOrderController from "../controller/PurchaseOrderController/purchase-order.controller";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreatePurchaseOrderDto } from "../dto/create-purchase-order.dto";
import { verifyUser } from "../middleware/auth";

const router = Router();

router.post("/", verifyUser,validateDto(CreatePurchaseOrderDto),purchaseOrderController.createPurchaseOrder);
router.get("/", purchaseOrderController.genericFindAll);
router.put("/:id", purchaseOrderController.updatePurchaseOrder);
router.delete("/:id", purchaseOrderController.genericDeleteOneById);


export default router;
