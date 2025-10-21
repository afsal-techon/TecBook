import express from 'express';
import { createAdmin, getUser, loginUser } from '../controller/UserCntrl/UserAuth';
import { verifyUser } from '../middleware/auth';
import { createBranch, deleteBranch, getAllBranches, updateBranch } from '../controller/branchCntrl/branch';
import { createDepartment, createEmployee, createPosition, deleteDepartment, deleteEmployee, deletePosition, getAllDepartment, getALLPosition, getEmployees, updateDepartment, updateEmployee, updatePosition } from '../controller/EmployeeCntrl/Employee';
import { upload } from '../middleware/imgUpload';
const router = express.Router();


router.post('/create-admin',createAdmin)
router.post('/login',loginUser);
router.get('/user',verifyUser,getUser);


//branch
router.post("/branch",verifyUser,upload.single('logo'),createBranch);
router.get("/branch",verifyUser,getAllBranches);
router.put("/branch",verifyUser,upload.single('logo'),updateBranch);
router.delete('/branch/:branchId',verifyUser,deleteBranch)


//departemnt
router.post("/department",verifyUser,createDepartment);
router.get("/department/:branchId",verifyUser,getAllDepartment);
router.put('/department',verifyUser,updateDepartment);

router.delete('/department/:departmentId',verifyUser,deleteDepartment);

//position
router.post('/position',verifyUser,createPosition);
router.get('/position/:branchId',verifyUser,getALLPosition);
router.put('/position',verifyUser,updatePosition)
router.delete('/position/:positionId',verifyUser,deletePosition);


//employee
router.post('/employee',verifyUser,upload.array('documents',10),createEmployee)
router.put('/employee',verifyUser,upload.array('documents',10),updateEmployee);
router.get('/employees',verifyUser,getEmployees);
router.delete('/employee/:employeeId',verifyUser,deleteEmployee)




  








export default router;