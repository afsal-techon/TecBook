import express from 'express';
import { createAdmin, getUser, loginUser } from '../controller/UserCntrl/UserAuth';
import { verifyUser } from '../middleware/auth';
import { createBranch, getAllBranches } from '../controller/branchCntrl/branch';
import { createDepartment, createPosition, deleteDepartment, deletePosition, getAllDepartment, getALLPosition, updateDepartment, updatePosition } from '../controller/EmployeeCntrl/Employee';
const router = express.Router();


router.post('/create-admin',createAdmin)
router.post('/login',loginUser);
router.get('/user',verifyUser,getUser);


//branch
router.post("/create-branch",verifyUser,createBranch);
router.get("/branch",verifyUser,getAllBranches);


//departemnt
router.post("/department",verifyUser,createDepartment);
router.get("/department/:branchId",verifyUser,getAllDepartment);
router.put('/department',verifyUser,updateDepartment);
router.delete('/department/:departmentId',verifyUser,deleteDepartment);

//position
router.post('/position',verifyUser,createPosition);
router.get('/position/:branchId',verifyUser,getALLPosition);
router.put('/position',verifyUser,updatePosition)
router.delete('/position/:branchId',verifyUser,deletePosition);


//customer











export default router;