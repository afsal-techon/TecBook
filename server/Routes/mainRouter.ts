import express from 'express';
import { createAdmin, createUser, deleteUser, getAllUsers, getUser, loginUser, updateUser } from '../controller/UserCntrl/UserAuth';
import { verifyUser } from '../middleware/auth';
import { createBranch, deleteBranch, getAllBranches, getAllBranchesForDropdown, updateBranch } from '../controller/branchCntrl/branch';
import { createDepartment, createDocumentType, createEmployee, createPosition, deleteDepartment, deleteDocumentType, deleteEmployee, deletePosition, getAllDepartment, getAllDocumentTypes, getALLPosition, getEmployees, updateDepartment, updateDocument, updateEmployee, updatePosition } from '../controller/EmployeeCntrl/Employee';
import { upload } from '../middleware/imgUpload';
import { createUserGroup, deletePermission, getAlluserGroups, getOneUserGroups, getSingleUserUserGroup, updateUserGroup } from '../controller/UserCntrl/userGroup';
import checkPermission from '../middleware/checkPermission';
import { createAccounts, deleteAcccount, getAccounts, updateAccount } from '../controller/AccountsControle/accountCntrl';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../controller/saleController/customerCntrl';
import { createCategory, createItem, createUnit, deleteCategory, deleteItems, deleteUnit, getAllCategories, getAllItems, getAllUnits, getOneItem, updateCategory, updateItem, updateUnit } from '../controller/InventoryController/Inventory';
import { CreateVendor, deleteVendor, getVendors, updateVendor } from '../controller/purchaseController/vendorCntrl';
import { getNextQuotePreview, upsertQuoteNumberSetting } from '../settings/quoteStting';
import { createQuotes } from '../controller/saleController/quotationCntrl';
import { createTax, deleteTax, getALLTaxes, getTaxes, updateTax } from '../controller/saleController/taxCntrol';
const router = express.Router();


router.post('/create-admin',createAdmin)
router.post('/login',loginUser);
router.get('/user',verifyUser,getUser);


//branch
router.post("/branch",verifyUser,checkPermission('admin','Branch','can_create'),upload.single('logo'),createBranch);
router.get("/branch",verifyUser,checkPermission('admin','Branch','can_read'),getAllBranches);
router.get("/branch/common",verifyUser,getAllBranchesForDropdown);
router.put("/branch",verifyUser,checkPermission('admin','Branch','can_update'),upload.single('logo'),updateBranch);
router.delete('/branch/:branchId',verifyUser,checkPermission('admin','Branch','can_delete'),deleteBranch)


//departemnt
router.post("/department",verifyUser,checkPermission('admin','Department','can_create'),createDepartment);
router.get("/department",verifyUser,checkPermission('admin','Department','can_read'),getAllDepartment);
router.put('/department',verifyUser,checkPermission('admin','Department','can_update'),updateDepartment);
router.delete('/department/:departmentId',verifyUser,checkPermission('admin','Department','can_delete'),deleteDepartment);

//position
router.post('/position',verifyUser,checkPermission('admin','Position','can_create'),createPosition);
router.get('/position',verifyUser,checkPermission('admin','Position','can_read'),getALLPosition);
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
router.get('/permission/user',verifyUser,getSingleUserUserGroup)


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


router.post('/customer',verifyUser,checkPermission('admin','Customer','can_create'),upload.array('documents',10),createCustomer)
router.get('/customer',verifyUser,checkPermission('admin','Customer','can_read'),getCustomers)
router.put('/customer',verifyUser,checkPermission('admin','Customer','can_update'),upload.array('documents',10),updateCustomer)
router.delete('/customer/:customerId',verifyUser,checkPermission('admin','Customer','can_delete'),deleteCustomer)


//inventory
//category
router.post('/category',verifyUser,checkPermission('admin','Category','can_create'),createCategory)
router.get('/category',verifyUser,checkPermission('admin','Category','can_read'),getAllCategories)
router.put('/category',verifyUser,checkPermission('admin','Category','can_update'),updateCategory)
router.delete('/category/:categoryId',verifyUser,checkPermission('admin','Category','can_delete'),deleteCategory)

//units
router.post('/unit',verifyUser,checkPermission('admin','Unit','can_create'),createUnit)
router.get('/unit',verifyUser,checkPermission('admin','Unit','can_read'),getAllUnits)
router.put('/unit',verifyUser,checkPermission('admin','Unit','can_update'),updateUnit)
router.delete('/unit/:unitId',verifyUser,checkPermission('admin','Unit','can_delete'),deleteUnit)

//Items
router.post('/item',verifyUser,checkPermission('admin','Item','can_create'),createItem)
router.get('/item',verifyUser,checkPermission('admin','Item','can_read'),getAllItems)
router.get('/item/one/:itemId',verifyUser,checkPermission('admin','Item','can_read'),getOneItem)
router.put('/item',verifyUser,checkPermission('admin','Item','can_update'),updateItem)
router.delete('/item/:itemId',verifyUser,checkPermission('admin','Item','can_delete'),deleteItems)


//vendor
router.post('/vendor',verifyUser,checkPermission('admin','Vendor','can_create'),CreateVendor)
router.get('/vendor',verifyUser,checkPermission('admin','Vendor','can_read'),getVendors)
router.put('/vendor',verifyUser,checkPermission('admin','Vendor','can_update'),updateVendor)
router.delete('/vendor/:vendorId',verifyUser,checkPermission('admin','Vendor','can_delete'),deleteVendor)


//create quotesetting number
router.post('/quote-setting',verifyUser,upsertQuoteNumberSetting);
router.get('/quotes/next/:branchId',verifyUser,getNextQuotePreview)


//tax
router.post('/tax',verifyUser,checkPermission('admin','Tax','can_create'),createTax)
router.get('/tax/list',verifyUser,checkPermission('admin','Tax','can_read'),getTaxes);
router.put('/tax/:taxId',verifyUser,checkPermission('admin','Tax','can_update'),updateTax);
router.get('/tax',verifyUser,checkPermission('admin','Tax','can_update'),getALLTaxes);
router.delete('/tax/:taxId',verifyUser,checkPermission('admin','Tax','can_delete'),deleteTax);


//create quotation 
router.post('/quotation',verifyUser,checkPermission('admin','Quotation','can_create'),createQuotes)







export default router;