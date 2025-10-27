import express from 'express';
import { createAdmin, createUser, deleteUser, getAllUsers, getUser, loginUser, updateUser } from '../controller/UserCntrl/UserAuth';
import { verifyUser } from '../middleware/auth';
import { createBranch, deleteBranch, getAllBranches, updateBranch } from '../controller/branchCntrl/branch';
import { createDepartment, createDocumentType, createEmployee, createPosition, deleteDepartment, deleteDocumentType, deleteEmployee, deletePosition, getAllDepartment, getAllDocumentTypes, getALLPosition, getEmployees, updateDepartment, updateDocument, updateEmployee, updatePosition } from '../controller/EmployeeCntrl/Employee';
import { upload } from '../middleware/imgUpload';
import { createUserGroup, deletePermission, getAlluserGroups, getOneUserGroups, getSingleUserUserGroup, updateUserGroup } from '../controller/UserCntrl/userGroup';
import checkPermission from '../middleware/checkPermission';
import { createAccounts, deleteAcccount, getAccounts, updateAccount } from '../controller/AccountsControle/accountCntrl';
const router = express.Router();


router.post('/create-admin',createAdmin)
router.post('/login',loginUser);
router.get('/user',verifyUser,getUser);


//branch
router.post("/branch",verifyUser,checkPermission('admin','Branch','can_create'),upload.single('logo'),createBranch);
router.get("/branch",verifyUser,checkPermission('admin','Branch','can_read'),getAllBranches);
router.put("/branch",verifyUser,checkPermission('admin','Branch','can_update'),upload.single('logo'),updateBranch);
router.delete('/branch/:branchId',verifyUser,checkPermission('admin','Branch','can_delete'),deleteBranch)


//departemnt
router.post("/department",verifyUser,checkPermission('admin','Department','can_create'),createDepartment);
router.get("/department/:branchId",verifyUser,checkPermission('admin','Department','can_read'),getAllDepartment);
router.put('/department',verifyUser,checkPermission('admin','Department','can_update'),updateDepartment);
router.delete('/department/:departmentId',verifyUser,checkPermission('admin','Department','can_delete'),deleteDepartment);

//position
router.post('/position',verifyUser,checkPermission('admin','Position','can_create'),createPosition);
router.get('/position/:branchId',verifyUser,checkPermission('admin','Position','can_read'),getALLPosition);
router.put('/position',verifyUser,checkPermission('admin','Position','can_update'),updatePosition)
router.delete('/position/:positionId',verifyUser,checkPermission('admin','Position','can_delete'),deletePosition);


//employee
router.post('/employee',verifyUser,checkPermission('admin','Employee','can_create'),upload.array('documents',10),createEmployee)
router.put('/employee',verifyUser,checkPermission('admin','Employee','can_update'),upload.array('documents',10),updateEmployee);
router.get('/employees',verifyUser,checkPermission('admin','Employee','can_read'),getEmployees);
router.delete('/employee/:employeeId',verifyUser,checkPermission('admin','Employee','can_delete'),deleteEmployee);


//user group 
router.post('/permission',verifyUser,checkPermission('admin','UserGroup','can_create'),createUserGroup);
router.get('/permission',verifyUser,checkPermission('admin','UserGroup','can_read'),getAlluserGroups);
router.get('/permission/one/:permissionId',verifyUser,checkPermission('admin','UserGroup','can_read'),getOneUserGroups);
router.put('/permission',verifyUser,checkPermission('admin','UserGroup','can_update'),updateUserGroup)
router.delete('/permission',verifyUser,checkPermission('admin','UserGroup','can_delete'),deletePermission)
router.get('/permission/user',verifyUser,checkPermission('admin','UserGroup','can_read'),getSingleUserUserGroup)


router.post("/document-type",verifyUser,checkPermission('admin','DocumentType','can_create'),createDocumentType);
router.get("/document-type",verifyUser,checkPermission('admin','DocumentType','can_read'),getAllDocumentTypes);
router.put('/document-type',verifyUser,checkPermission('admin','DocumentType','can_update'),updateDocument);
router.delete('/document-type/:documentId',verifyUser,checkPermission('admin','DocumentType','can_delete'),deleteDocumentType);


router.post('/user',verifyUser,checkPermission('admin','User','can_create'),createUser)
router.get('/users',verifyUser,checkPermission('admin','User','can_read'),getAllUsers);
router.put('/user',verifyUser,checkPermission('admin','User','can_update'),updateUser);
router.delete('/user/:userId',verifyUser,checkPermission('admin','User','can_delete'),deleteUser)



router.post('/account',verifyUser,checkPermission('admin','Accounts','can_create'),createAccounts)
router.get('/account',verifyUser,checkPermission('admin','Accounts','can_read'),getAccounts)
router.put('/account',verifyUser,checkPermission('admin','Accounts','can_update'),updateAccount)
router.delete('/account/:accountId',verifyUser,checkPermission('admin','Accounts','can_delete'),deleteAcccount)






export default router;