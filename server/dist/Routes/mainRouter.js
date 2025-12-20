"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserAuth_1 = require("../controller/UserCntrl/UserAuth");
const auth_1 = require("../middleware/auth");
const branch_1 = require("../controller/branchCntrl/branch");
const Employee_1 = require("../controller/EmployeeCntrl/Employee");
const imgUpload_1 = require("../middleware/imgUpload");
const userGroup_1 = require("../controller/UserCntrl/userGroup");
const checkPermission_1 = __importDefault(require("../middleware/checkPermission"));
const accountCntrl_1 = require("../controller/AccountsControle/accountCntrl");
const customerCntrl_1 = require("../controller/saleController/customerCntrl");
const Inventory_1 = require("../controller/InventoryController/Inventory");
const vendorCntrl_1 = require("../controller/purchaseController/vendorCntrl");
const quoteStting_1 = require("../settings/quoteStting");
const quotationCntrl_1 = require("../controller/saleController/quotationCntrl");
const taxCntrol_1 = require("../controller/commonCntroller/taxCntrol");
const paymentTerms_1 = require("../controller/commonCntroller/paymentTerms");
const saleOrderCntls_1 = require("../controller/saleController/saleOrderCntls");
const projectCntrl_1 = require("../controller/projectController/projectCntrl");
const salesPerson_1 = require("../controller/commonCntroller/salesPerson");
const invoiceCntrl_1 = require("../controller/saleController/invoiceCntrl");
const router = express_1.default.Router();
router.post('/create-admin', UserAuth_1.createAdmin);
router.post('/login', UserAuth_1.loginUser);
router.get('/user', auth_1.verifyUser, UserAuth_1.getUser);
router.post('/logout', auth_1.verifyUser, UserAuth_1.logoutHandle);
//branch
router.post("/branch", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Branch', 'can_create'), imgUpload_1.upload.single('logo'), branch_1.createBranch);
router.get("/branch", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Branch', 'can_read'), branch_1.getAllBranches);
router.get("/branch/common", auth_1.verifyUser, branch_1.getAllBranchesForDropdown);
router.put("/branch", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Branch', 'can_update'), imgUpload_1.upload.single('logo'), branch_1.updateBranch);
router.delete('/branch/:branchId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Branch', 'can_delete'), branch_1.deleteBranch);
//departemnt
router.post("/department", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Department', 'can_create'), Employee_1.createDepartment);
router.get("/department", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Department', 'can_read'), Employee_1.getAllDepartment);
router.put('/department', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Department', 'can_update'), Employee_1.updateDepartment);
router.delete('/department/:departmentId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Department', 'can_delete'), Employee_1.deleteDepartment);
//position
router.post('/position', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Position', 'can_create'), Employee_1.createPosition);
router.get('/position', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Position', 'can_read'), Employee_1.getALLPosition);
router.put('/position', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Position', 'can_update'), Employee_1.updatePosition);
router.delete('/position/:positionId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Position', 'can_delete'), Employee_1.deletePosition);
//employee
router.post('/employee', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Employee', 'can_create'), imgUpload_1.upload.array('documents', 10), Employee_1.createEmployee);
router.put('/employee', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Employee', 'can_update'), imgUpload_1.upload.array('documents', 10), Employee_1.updateEmployee);
router.get('/employees', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Employee', 'can_read'), Employee_1.getEmployees);
router.delete('/employee/:employeeId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Employee', 'can_delete'), Employee_1.deleteEmployee);
//user group 
router.post('/permission', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'UserGroup', 'can_create'), userGroup_1.createUserGroup);
router.get('/permission', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'UserGroup', 'can_read'), userGroup_1.getAlluserGroups);
router.get('/permission/one/:permissionId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'UserGroup', 'can_read'), userGroup_1.getOneUserGroups);
router.put('/permission', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'UserGroup', 'can_update'), userGroup_1.updateUserGroup);
router.delete('/permission', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'UserGroup', 'can_delete'), userGroup_1.deletePermission);
router.get('/permission/user', auth_1.verifyUser, userGroup_1.getSingleUserUserGroup);
router.post("/document-type", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'DocumentType', 'can_create'), Employee_1.createDocumentType);
router.get("/document-type", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'DocumentType', 'can_read'), Employee_1.getAllDocumentTypes);
router.put('/document-type', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'DocumentType', 'can_update'), Employee_1.updateDocument);
router.delete('/document-type/:documentId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'DocumentType', 'can_delete'), Employee_1.deleteDocumentType);
router.post('/users', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'User', 'can_create'), UserAuth_1.createUser);
router.get('/users', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'User', 'can_read'), UserAuth_1.getAllUsers);
router.put('/users', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'User', 'can_update'), UserAuth_1.updateUser);
router.delete('/user/:userId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'User', 'can_delete'), UserAuth_1.deleteUser);
router.post('/account', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Accounts', 'can_create'), accountCntrl_1.createAccounts);
router.get('/account', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Accounts', 'can_read'), accountCntrl_1.getAccounts);
router.put('/account', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Accounts', 'can_update'), accountCntrl_1.updateAccount);
router.delete('/account/:accountId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Accounts', 'can_delete'), accountCntrl_1.deleteAcccount);
router.post('/customer', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Customer', 'can_create'), imgUpload_1.upload.array('documents', 10), customerCntrl_1.createCustomer);
router.get('/customer', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Customer', 'can_read'), customerCntrl_1.getCustomers);
router.get('/customers/:branchId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Customer', 'can_read'), customerCntrl_1.getCustomersDetails);
router.put('/customer', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Customer', 'can_update'), imgUpload_1.upload.array('documents', 10), customerCntrl_1.updateCustomer);
router.delete('/customer/:customerId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Customer', 'can_delete'), customerCntrl_1.deleteCustomer);
//inventory
//category
router.post('/category', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Category', 'can_create'), Inventory_1.createCategory);
router.get('/category', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Category', 'can_read'), Inventory_1.getAllCategories);
router.put('/category', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Category', 'can_update'), Inventory_1.updateCategory);
router.delete('/category/:categoryId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Category', 'can_delete'), Inventory_1.deleteCategory);
//units
router.post('/unit', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Unit', 'can_create'), Inventory_1.createUnit);
router.get('/unit', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Unit', 'can_read'), Inventory_1.getAllUnits);
router.put('/unit', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Unit', 'can_update'), Inventory_1.updateUnit);
router.delete('/unit/:unitId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Unit', 'can_delete'), Inventory_1.deleteUnit);
//Items
router.post('/item', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Item', 'can_create'), Inventory_1.createItem);
router.get('/item', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Item', 'can_read'), Inventory_1.getAllItems);
router.get('/items/sale/:branchId', auth_1.verifyUser, Inventory_1.getItemsList);
router.get('/item/one/:itemId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Item', 'can_read'), Inventory_1.getOneItem);
router.put('/item', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Item', 'can_update'), Inventory_1.updateItem);
router.delete('/item/:itemId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Item', 'can_delete'), Inventory_1.deleteItems);
//vendor
router.post('/vendor', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Vendor', 'can_create'), vendorCntrl_1.CreateVendor);
router.get('/vendor', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Vendor', 'can_read'), vendorCntrl_1.getVendors);
router.put('/vendor', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Vendor', 'can_update'), vendorCntrl_1.updateVendor);
router.delete('/vendor/:vendorId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Vendor', 'can_delete'), vendorCntrl_1.deleteVendor);
//create quotesetting number
router.post('/number-setting', auth_1.verifyUser, quoteStting_1.upsertDocumentNumberSetting);
router.get('/number/next', auth_1.verifyUser, quoteStting_1.getNextQuotePreview);
//tax
router.post('/tax', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Tax', 'can_create'), taxCntrol_1.createTax);
router.get('/tax/list', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Tax', 'can_read'), taxCntrol_1.getTaxes);
router.put('/tax/:taxId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Tax', 'can_update'), taxCntrol_1.updateTax);
router.get('/tax', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Tax', 'can_update'), taxCntrol_1.getALLTaxes);
router.delete('/tax/:taxId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Tax', 'can_delete'), taxCntrol_1.deleteTax);
//create quotation 
router.post('/quotation', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Quotation', 'can_create'), imgUpload_1.upload.array('documents', 10), quotationCntrl_1.createQuotes);
router.put('/quotation/:quoteId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Quotation', 'can_update'), imgUpload_1.upload.array('documents', 10), quotationCntrl_1.updateQuotes);
router.get('/quotation', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Quotation', 'can_read'), quotationCntrl_1.getAllQuotes);
router.get('/quotation/:quoteId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Quotation', 'can_read'), quotationCntrl_1.getOneQuotation);
router.delete('/quotation/:quoteId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Quotation', 'can_delete'), quotationCntrl_1.deleteQuotation);
router.post('/quotation/status', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Quotation', 'can_update'), quotationCntrl_1.markAcceptOrReject);
//payment terms
router.post('/payment-terms', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PaymentTerms', 'can_create'), paymentTerms_1.upsertPaymentTerms);
router.get('/payment-terms/:branchId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PaymentTerms', 'can_read'), paymentTerms_1.getAllPaymentTerms);
//create saleorder 
router.post('/sale-order', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SaleOrder', 'can_create'), imgUpload_1.upload.array('documents', 10), saleOrderCntls_1.createSaleOrder);
router.put('/sale-order/:saleOrderId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SaleOrder', 'can_update'), imgUpload_1.upload.array('documents', 10), saleOrderCntls_1.updateSaleOrder);
router.get('/sale-order', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SaleOrder', 'can_read'), saleOrderCntls_1.getAllSaleOrder);
router.get('/sale-order/:saleOrderId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SaleOrder', 'can_read'), saleOrderCntls_1.getOneSaleOrder);
router.delete('/sale-order/:saleOrderId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SaleOrder', 'can_delete'), saleOrderCntls_1.deleteSaleOrder);
router.post('/project', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Project', 'can_create'), projectCntrl_1.createProject);
router.put('/project/:projectIid', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Project', 'can_update'), projectCntrl_1.updateProject);
router.get('/project', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Project', 'can_read'), projectCntrl_1.getAllProjects);
router.get('/project/:projectId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Project', 'can_read'), projectCntrl_1.getOneProject);
router.get('/projects/:branchId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Project', 'can_read'), projectCntrl_1.getProjects);
router.post('/sales-person', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SalesPerson', 'can_create'), salesPerson_1.createSalesPerson);
router.get('/sales-person/:branchId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SalesPerson', 'can_read'), salesPerson_1.getSalesPerson);
router.put('/sales-person/:salesPersonId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SalesPerson', 'can_update'), salesPerson_1.updateSalesPerson);
router.delete('/sales-person/:salesPersonId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'SalesPerson', 'can_delete'), salesPerson_1.deleteSalesPerson);
//invoice 
router.post('/invoice', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Invoice', 'can_create'), imgUpload_1.upload.array('documents', 10), invoiceCntrl_1.createInvoice);
router.put('/invoice/:invoiceId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Invoice', 'can_update'), imgUpload_1.upload.array('documents', 10), invoiceCntrl_1.updateInvoice);
router.get('/invoice', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Invoice', 'can_read'), invoiceCntrl_1.getALLInvoices);
router.get('/invoice/:invoiceId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Invoice', 'can_read'), invoiceCntrl_1.getOneInvoice);
router.delete('/invoice/:invoiceId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'Invoice', 'can_delete'), invoiceCntrl_1.deleteInvoice);
//tune log entry
router.post('/log-entry', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'LogEntry', 'can_create'), projectCntrl_1.createLogEntry);
router.get('/log-entry', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'LogEntry', 'can_read'), projectCntrl_1.getAllLogEntries);
router.put('/log-entry/:timeLogId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'LogEntry', 'can_update'), projectCntrl_1.updateLogEntry);
router.delete('/log-entry/:timeLogId', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'LogEntry', 'can_delete'), projectCntrl_1.deleteLogEntry);
router.get('/timesheets', auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'LogEntry', 'can_read'), projectCntrl_1.getTimesheetsByDate);
exports.default = router;
