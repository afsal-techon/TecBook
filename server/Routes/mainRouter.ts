import express from 'express';
import { createAdmin, createUser, deleteUser, getAllUsers, getUser, loginUser, logoutHandle, updateUser } from '../controller/UserCntrl/UserAuth';
import { verifyUser } from '../middleware/auth';
import { createBranch, deleteBranch, getAllBranches, getAllBranchesForDropdown, updateBranch } from '../controller/branchCntrl/branch';
import { createDepartment, createDocumentType, createEmployee, createPosition, deleteDepartment, deleteDocumentType, deleteEmployee, deletePosition, getAllDepartment, getAllDocumentTypes, getALLPosition, getEmployees, updateDepartment, updateDocument, updateEmployee, updatePosition } from '../controller/EmployeeCntrl/Employee';
import { upload } from '../middleware/imgUpload';
import { createUserGroup, deletePermission, getAlluserGroups, getOneUserGroups, getSingleUserUserGroup, updateUserGroup } from '../controller/UserCntrl/userGroup';
import checkPermission from '../middleware/checkPermission';
import { createAccounts, deleteAcccount, getAccounts, updateAccount } from '../controller/AccountsControle/accountCntrl';
import { createCustomer, deleteCustomer, getCustomers, getCustomersDetails, updateCustomer } from '../controller/saleController/customerCntrl';
import { createCategory, createItem, createUnit, deleteCategory, deleteItems, deleteUnit, getAllCategories, getAllItems, getAllUnits, getItemsList, getOneItem, updateCategory, updateItem, updateUnit } from '../controller/InventoryController/Inventory';
import { CreateVendor, deleteVendor, getVendors, updateVendor } from '../controller/purchaseController/vendorCntrl';
import { getNextQuotePreview, upsertDocumentNumberSetting } from '../settings/quoteStting';
import { createQuotes, deleteQuotation, getAllQuotes, getOneQuotation, markAcceptOrReject, updateQuotes } from '../controller/saleController/quotationCntrl';
import { createTax, deleteTax, getALLTaxes, getTaxes, updateTax } from '../controller/commonCntroller/taxCntrol';
import { getAllPaymentTerms, upsertPaymentTerms } from '../controller/commonCntroller/paymentTerms';
import { createSaleOrder, deleteSaleOrder, getAllSaleOrder, getOneSaleOrder, updateSaleOrder } from '../controller/saleController/saleOrderCntls';
import { createLogEntry, createProject, deleteLogEntry, getAllLogEntries, getAllProjects, getOneProject, getProjects, getTimesheetsByDate, updateLogEntry, updateProject } from '../controller/projectController/projectCntrl';
import { createSalesPerson, deleteSalesPerson, getSalesPerson, updateSalesPerson } from '../controller/commonCntroller/salesPerson';
import { createInvoice, deleteInvoice, getALLInvoices, getOneInvoice, updateInvoice } from '../controller/saleController/invoiceCntrl';
const router = express.Router();



router.post('/create-admin',createAdmin)
router.post('/login',loginUser);
router.get('/user',verifyUser,getUser);
router.post('/logout',verifyUser,logoutHandle)


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


router.post('/users',verifyUser,checkPermission('admin','User','can_create'),createUser)
router.get('/users',verifyUser,checkPermission('admin','User','can_read'),getAllUsers);
router.put('/users',verifyUser,checkPermission('admin','User','can_update'),updateUser);
router.delete('/user/:userId',verifyUser,checkPermission('admin','User','can_delete'),deleteUser)



router.post('/account',verifyUser,checkPermission('admin','Accounts','can_create'),createAccounts)
router.get('/account',verifyUser,checkPermission('admin','Accounts','can_read'),getAccounts)
router.put('/account',verifyUser,checkPermission('admin','Accounts','can_update'),updateAccount)
router.delete('/account/:accountId',verifyUser,checkPermission('admin','Accounts','can_delete'),deleteAcccount)


router.post('/customer',verifyUser,checkPermission('admin','Customer','can_create'),upload.array('documents',10),createCustomer)
router.get('/customer',verifyUser,checkPermission('admin','Customer','can_read'),getCustomers)
router.get('/customers/:branchId',verifyUser,checkPermission('admin','Customer','can_read'),getCustomersDetails)
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
router.get('/items/sale/:branchId',verifyUser,getItemsList)
router.get('/item/one/:itemId',verifyUser,checkPermission('admin','Item','can_read'),getOneItem)
router.put('/item',verifyUser,checkPermission('admin','Item','can_update'),updateItem)
router.delete('/item/:itemId',verifyUser,checkPermission('admin','Item','can_delete'),deleteItems)


//vendor
router.post('/vendor',verifyUser,checkPermission('admin','Vendor','can_create'),CreateVendor)
router.get('/vendor',verifyUser,checkPermission('admin','Vendor','can_read'),getVendors)
router.put('/vendor',verifyUser,checkPermission('admin','Vendor','can_update'),updateVendor)
router.delete('/vendor/:vendorId',verifyUser,checkPermission('admin','Vendor','can_delete'),deleteVendor)


//create quotesetting number
router.post('/number-setting',verifyUser,upsertDocumentNumberSetting);
router.get('/number/next',verifyUser,getNextQuotePreview)


//tax
router.post('/tax',verifyUser,checkPermission('admin','Tax','can_create'),createTax)
router.get('/tax/list',verifyUser,checkPermission('admin','Tax','can_read'),getTaxes);
router.put('/tax/:taxId',verifyUser,checkPermission('admin','Tax','can_update'),updateTax);
router.get('/tax',verifyUser,checkPermission('admin','Tax','can_update'),getALLTaxes);
router.delete('/tax/:taxId',verifyUser,checkPermission('admin','Tax','can_delete'),deleteTax);


//create quotation 
router.post('/quotation',verifyUser,checkPermission('admin','Quotation','can_create'),upload.array('documents',10),createQuotes);
router.put('/quotation/:quoteId',verifyUser,checkPermission('admin','Quotation','can_update'),upload.array('documents',10),updateQuotes);
router.get('/quotation',verifyUser,checkPermission('admin','Quotation','can_read'),getAllQuotes)
router.get('/quotation/:quoteId',verifyUser,checkPermission('admin','Quotation','can_read'),getOneQuotation)
router.delete('/quotation/:quoteId',verifyUser,checkPermission('admin','Quotation','can_delete'),deleteQuotation)


router.post('/quotation/status',verifyUser,checkPermission('admin','Quotation','can_update'),markAcceptOrReject)

//payment terms
router.post('/payment-terms',verifyUser,checkPermission('admin','PaymentTerms','can_create'),upsertPaymentTerms)
router.get('/payment-terms/:branchId',verifyUser,checkPermission('admin','PaymentTerms','can_read'),getAllPaymentTerms)


//create saleorder 
router.post('/sale-order',verifyUser,checkPermission('admin','SaleOrder','can_create'),upload.array('documents',10),createSaleOrder);
router.put('/sale-order/:saleOrderId',verifyUser,checkPermission('admin','SaleOrder','can_update'),upload.array('documents',10),updateSaleOrder);
router.get('/sale-order',verifyUser,checkPermission('admin','SaleOrder','can_read'),getAllSaleOrder)
router.get('/sale-order/:saleOrderId',verifyUser,checkPermission('admin','SaleOrder','can_read'),getOneSaleOrder) 
router.delete('/sale-order/:saleOrderId',verifyUser,checkPermission('admin','SaleOrder','can_delete'),deleteSaleOrder);


router.post('/project',verifyUser,checkPermission('admin','Project','can_create'),createProject)
router.put('/project/:projectIid',verifyUser,checkPermission('admin','Project','can_update'),updateProject)
router.get('/project',verifyUser,checkPermission('admin','Project','can_read'),getAllProjects)
router.get('/project/:projectId',verifyUser,checkPermission('admin','Project','can_read'),getOneProject)
router.get('/projects/:branchId',verifyUser,checkPermission('admin','Project','can_read'),getProjects)

router.post('/sales-person',verifyUser,checkPermission('admin','SalesPerson','can_create'),createSalesPerson)
router.get('/sales-person/:branchId',verifyUser,checkPermission('admin','SalesPerson','can_read'),getSalesPerson)
router.put('/sales-person/:salesPersonId',verifyUser,checkPermission('admin','SalesPerson','can_update'),updateSalesPerson)
router.delete('/sales-person/:salesPersonId',verifyUser,checkPermission('admin','SalesPerson','can_delete'),deleteSalesPerson)


//invoice 
router.post('/invoice',verifyUser,checkPermission('admin','Invoice','can_create'),upload.array('documents',10),createInvoice);
router.put('/invoice/:invoiceId',verifyUser,checkPermission('admin','Invoice','can_update'),upload.array('documents',10),updateInvoice);
router.get('/invoice',verifyUser,checkPermission('admin','Invoice','can_read'),getALLInvoices)
router.get('/invoice/:invoiceId',verifyUser,checkPermission('admin','Invoice','can_read'),getOneInvoice)
router.delete('/invoice/:invoiceId',verifyUser,checkPermission('admin','Invoice','can_delete'),deleteInvoice);

//tune log entry
router.post('/log-entry',verifyUser,checkPermission('admin','LogEntry','can_create'),createLogEntry)
router.get('/log-entry',verifyUser,checkPermission('admin','LogEntry','can_read'),getAllLogEntries)
router.put('/log-entry/:timeLogId',verifyUser,checkPermission('admin','LogEntry','can_update'),updateLogEntry)
router.delete('/log-entry/:timeLogId',verifyUser,checkPermission('admin','LogEntry','can_delete'),deleteLogEntry);


router.get('/timesheets',verifyUser,checkPermission('admin','LogEntry','can_read'),getTimesheetsByDate)
export default router;