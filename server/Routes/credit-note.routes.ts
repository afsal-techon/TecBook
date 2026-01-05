import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateDto } from "../middleware/validate-dto.middleware";
import { upload } from "../middleware/imgUpload";
import { CreateCreditNoteDto } from "../dto/credit-note.dto";
import { creditNoteController } from "../controller/creditNoterController/credit-note.controller";

const router = Router()

router.post("/", verifyUser,checkPermission('admin','CreditNote','can_create'),upload.array('documents',10),validateDto(CreateCreditNoteDto),creditNoteController.createCreditNote);



export default router;