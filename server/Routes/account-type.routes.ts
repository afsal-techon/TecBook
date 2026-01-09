import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { accountTypeController } from "../controller/accountTypeController/account-types.controller";

const router = Router()

router.get("/", verifyUser, checkPermission('admin','AccountType','can_read') ,accountTypeController.listAllAccountTypes);



export default router;