import express from 'express';
import { createAdmin, createUser, deleteUser, getAllUsers, getUser, loginUser, updateUser } from '../controller/UserCntrl/UserAuth';
import { verifyUser } from '../middleware/auth';
import { createBranch, deleteBranch, getAllBranches, updateBranch } from '../controller/branchCntrl/branch';
import { createDepartment, createDocumentType, createEmployee, createPosition, deleteDepartment, deleteDocumentType, deleteEmployee, deletePosition, getAllDepartment, getAllDocumentTypes, getALLPosition, getEmployees, updateDepartment, updateDocument, updateEmployee, updatePosition } from '../controller/EmployeeCntrl/Employee';
import { upload } from '../middleware/imgUpload';
import { createUserGroup, deletePermission, getAlluserGroups, getOneUserGroups, updateUserGroup } from '../controller/UserCntrl/userGroup';
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
router.delete('/employee/:employeeId',verifyUser,deleteEmployee);


//user group 
router.post('/permission',verifyUser,createUserGroup);
router.get('/permission',verifyUser,getAlluserGroups);
router.get('/permission/one/:permissionId',verifyUser,getOneUserGroups);
router.put('/permission',verifyUser,updateUserGroup)
router.delete('/permission',verifyUser,deletePermission)



router.post("/document-type",verifyUser,createDocumentType);
router.get("/document-type",verifyUser,getAllDocumentTypes);
router.put('/document-type',verifyUser,updateDocument);
router.delete('/document-type/:documentId',verifyUser,deleteDocumentType);


router.post('/user',verifyUser,createUser)
router.get('/user',verifyUser,getAllUsers);
router.put('/user',verifyUser,updateUser);
router.delete('/user/:userId',verifyUser,deleteUser)






export default router;