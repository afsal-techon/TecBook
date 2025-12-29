import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateDto } from "../middleware/validate-dto.middleware";
import { CreateExpenseDto, UpdateExpenseDto } from "../dto/create-expense.dto";
import { expenseController } from "../controller/expenseController/expenseController";

const router = Router()

router.post("/", verifyUser,checkPermission('admin','ExpenseModel','can_create'),validateDto(CreateExpenseDto),expenseController.createExpense);
router.put("/:id",verifyUser, checkPermission('admin','ExpenseModel','can_update'), validateDto(UpdateExpenseDto), expenseController.updateExpense);
router.get("/", verifyUser, checkPermission('admin','ExpenseModel','can_read') ,expenseController.getAllExpenses);
router.get("/:id",verifyUser, checkPermission('admin','ExpenseModel','can_read') ,expenseController.getExpenseById);
router.delete("/:id",verifyUser,checkPermission('admin','ExpenseModel','can_delete') , expenseController.genericDeleteOneById);



export default router;