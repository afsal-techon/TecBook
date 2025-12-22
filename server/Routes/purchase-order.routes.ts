import { Router } from "express";
import purchaseOrderController from "../controller/PurchaseOrderController/purchase-order.controller";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "../dto/create-purchase-order.dto";
import { verifyUser } from "../middleware/auth";

const router = Router();

router.post("/", verifyUser,validateDto(CreatePurchaseOrderDto),purchaseOrderController.createPurchaseOrder);
router.put("/:id",verifyUser, validateDto(UpdatePurchaseOrderDto), purchaseOrderController.updatePurchaseOrder);
router.get("/", verifyUser,purchaseOrderController.getAllPurchaseOrders);
router.get("/:id",verifyUser,  purchaseOrderController.getPurchaseOrderById);
router.delete("/:id",verifyUser,  purchaseOrderController.genericDeleteOneById);


export default router;
