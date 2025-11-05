"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocumentType = exports.updateDocument = exports.getAllDocumentTypes = exports.createDocumentType = exports.deleteEmployee = exports.getEmployees = exports.updateEmployee = exports.createEmployee = exports.generateUniqueEmployeeId = exports.deletePosition = exports.updatePosition = exports.getALLPosition = exports.createPosition = exports.deleteDepartment = exports.updateDepartment = exports.getAllDepartment = exports.createDepartment = void 0;
const department_1 = __importDefault(require("../../models/department"));
const position_1 = __importDefault(require("../../models/position"));
const user_1 = __importDefault(require("../../models/user"));
const branch_1 = __importDefault(require("../../models/branch"));
const employee_1 = __importDefault(require("../../models/employee"));
const mongoose_1 = __importDefault(require("mongoose"));
const imageKit_1 = require("../../config/imageKit");
const documentType_1 = __importDefault(require("../../models/documentType"));
const mongoose_2 = require("mongoose");
const createDepartment = async (req, res, next) => {
    try {
        const { branchIds, departments } = req.body;
        const userId = req.user?.id; //  assuming req.user is populated from auth middleware
        // 1️ Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // 2️ Validate branchIds
        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({ message: "Branch IDs are required!" });
        }
        // 3️ Validate departments array
        if (!departments ||
            !Array.isArray(departments) ||
            departments.length === 0) {
            return res.status(400).json({ message: "Departments are required!" });
        }
        for (const department of departments) {
            if (!department) {
                return res
                    .status(400)
                    .json({ message: "Department name is required!" });
            }
        }
        // 4️ Check duplicates in DB
        const departmentNames = departments.map((dept) => dept);
        const existingDepartments = await department_1.default.find({
            branchId: { $in: branchIds },
            dept_name: { $in: departmentNames },
            isDeleted: false,
        }).collation({ locale: "en", strength: 2 });
        if (existingDepartments.length > 0) {
            existingDepartments.map((d) => d);
            return res.status(400).json({
                message: `The following departments already exist in one or more branches`,
            });
        }
        // 5️ Prepare bulk insert data
        const departmentData = [];
        for (const branchId of branchIds) {
            for (const department of departments) {
                departmentData.push({
                    branchId,
                    dept_name: department.trim(),
                    //   createdById: userId,
                    isDeleted: false,
                });
            }
        }
        // 6️ Insert all at once
        await department_1.default.insertMany(departmentData);
        return res.status(201).json({
            message: "Departments created successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createDepartment = createDepartment;
const getAllDepartment = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // validate branchId
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        // pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search term
        const search = (req.query.search || "").trim();
        // build query
        const query = {
            branchId: new mongoose_1.default.Types.ObjectId(branchId),
            isDeleted: false,
        };
        //  only add dept_name when search has content
        if (search.length > 0) {
            query.dept_name = { $regex: search, $options: "i" };
        }
        const totalCount = await department_1.default.countDocuments(query);
        const departments = await department_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return res.status(200).json({ data: departments, totalCount, page, limit });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllDepartment = getAllDepartment;
const updateDepartment = async (req, res, next) => {
    try {
        const { departmentId, branchId, dept_name } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!departmentId) {
            return res.status(400).json({ message: "Department ID is required!" });
        }
        if (!dept_name ||
            typeof dept_name !== "string" ||
            dept_name.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "New department name is required!" });
        }
        const branch = await branch_1.default.findById(branchId);
        if (!branch)
            return res.status(400).json({ message: "Branch not found!" });
        const department = await department_1.default.findOne({
            _id: departmentId,
            branchId,
        });
        if (!department) {
            return res.status(404).json({ message: "Department not found!" });
        }
        const existDepartment = await department_1.default.findOne({
            branchId,
            dept_name: dept_name.trim(),
            isDeleted: false,
            _id: { $ne: departmentId }, // Exclude the current department
        });
        if (existDepartment) {
            return res.status(400).json({
                message: `The department already exists in the specified branch!`,
            });
        }
        if (department.dept_name === dept_name.trim()) {
            return res.status(400).json({
                message: "New department name is the same as the current name!",
            });
        }
        department.dept_name = dept_name.trim();
        await department.save();
        return res.status(200).json({
            message: "Department updated successfully!",
            data: department,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res, next) => {
    try {
        const { departmentId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!departmentId) {
            return res.status(400).json({ message: "Department ID is required!" });
        }
        const department = await department_1.default.findOne({ _id: departmentId });
        if (!department) {
            return res.status(404).json({ message: "Department not found!" });
        }
        await department_1.default.findByIdAndUpdate(departmentId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            deletedBy: user.username,
        });
        return res.status(200).json({
            message: "Department deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteDepartment = deleteDepartment;
//positino
const createPosition = async (req, res, next) => {
    try {
        const { branchId, departmentId, positions } = req.body;
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!departmentId) {
            return res.status(400).json({ message: "Department ID is required!" });
        }
        if (!positions || !Array.isArray(positions) || positions.length === 0) {
            return res.status(400).json({ message: "Positions are required!" });
        }
        for (const position of positions) {
            if (!position ||
                typeof position !== "string" ||
                position.trim().length === 0) {
                return res
                    .status(400)
                    .json({ message: "Position name is required for each position!" });
            }
        }
        const positionNames = positions.map((position) => position.trim().toLowerCase());
        const existingPositions = await position_1.default.find({
            departmentId,
            branchId,
            isDeleted: false,
            pos_name: { $in: positionNames }, // Case-insensitive match
        }).collation({ locale: "en", strength: 2 });
        if (existingPositions.length > 0) {
            return res.status(400).json({
                message: `The following position already exist in one or more branches!`,
            });
        }
        const positionData = positions.map((position) => ({
            pos_name: position.trim(),
            departmentId,
            branchId,
            createdById: user._id,
            // createdBy: user.name,
        }));
        const createdPositions = await position_1.default.insertMany(positionData);
        return res.status(200).json({
            message: "Positions added successfully!",
            data: createdPositions,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createPosition = createPosition;
const getALLPosition = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // Validate branch
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // Search
        const search = req.query.search || "";
        // Build aggregation pipeline
        const pipeline = [
            {
                $match: {
                    branchId: new mongoose_1.default.Types.ObjectId(branchId),
                    isDeleted: false,
                    ...(search ? { pos_name: { $regex: search, $options: "i" } } : {}),
                },
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "department",
                },
            },
            {
                $unwind: {
                    path: "$department",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    pos_name: "$pos_name",
                    branchId: 1,
                    departmentId: 1,
                    departmentName: {
                        $ifNull: ["$department.dept_name", "No Department"],
                    },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: "count" }],
                },
            },
            {
                $project: {
                    data: 1,
                    totalCount: {
                        $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
                    },
                },
            },
        ];
        // Run aggregation
        const result = await position_1.default.aggregate(pipeline);
        // Format response
        const response = {
            data: result[0]?.data || [],
            totalCount: result[0]?.totalCount || 0,
            page,
            limit,
        };
        return res.status(200).json(response);
    }
    catch (err) {
        next(err);
    }
};
exports.getALLPosition = getALLPosition;
const updatePosition = async (req, res, next) => {
    try {
        const { branchId, positionId, pos_name } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!positionId) {
            return res.status(400).json({ message: "Position ID is required!" });
        }
        if (!pos_name ||
            typeof pos_name !== "string" ||
            pos_name.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "New Position name is required!" });
        }
        const position = await position_1.default.findOne({ _id: positionId, branchId });
        if (!position) {
            return res.status(404).json({ message: "Position not found!" });
        }
        const existPosition = await position_1.default.findOne({
            branchId,
            pos_name: pos_name.trim(),
            isDeleted: false,
            _id: { $ne: positionId },
        });
        if (existPosition) {
            return res.status(400).json({
                message: `The position already exists in the specified branch!`,
            });
        }
        if (position.pos_name === pos_name.trim()) {
            return res.status(400).json({
                message: "New position name is the same as the current name!",
            });
        }
        position.pos_name = pos_name.trim();
        await position.save();
        return res.status(200).json({
            message: "Position updated successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updatePosition = updatePosition;
const deletePosition = async (req, res, next) => {
    try {
        const { positionId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!positionId) {
            return res.status(400).json({ message: "Position ID is required!" });
        }
        const position = await position_1.default.findOne({ _id: positionId });
        if (!position) {
            return res.status(404).json({ message: "Position not found!" });
        }
        await position_1.default.findByIdAndUpdate(positionId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "Position deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deletePosition = deletePosition;
const generateUniqueEmployeeId = async () => {
    let uniqueId = 0;
    let exists = true;
    while (exists) {
        uniqueId = Math.floor(100000 + Math.random() * 900000); // 6-digit number
        const existing = await employee_1.default.findOne({ empId: uniqueId }).lean();
        exists = !!existing; // convert to boolean
    }
    return uniqueId;
};
exports.generateUniqueEmployeeId = generateUniqueEmployeeId;
//employee
const createEmployee = async (req, res, next) => {
    try {
        const { branchId, positionId, departmentId, salary, dateOfJoining, firstName, lastName, contactNo, contactNo2, email, nationality, fatherName, motherName, dateOfBirth, qualification, fieldOfStudy, residentialAddress, gender, maritalStatus, } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!positionId) {
            return res.status(400).json({ message: "Position is required!" });
        }
        if (!departmentId) {
            return res.status(400).json({ message: "Department is required!" });
        }
        if (!firstName) {
            return res.status(400).json({ message: "First name is required!" });
        }
        if (!dateOfJoining) {
            return res.status(400).json({ message: "Date of joining is required!" });
        }
        if (!contactNo) {
            return res.status(400).json({ message: "Contact number is required!" });
        }
        if (!gender) {
            return res.status(400).json({ message: "Gender is required!" });
        }
        if (!dateOfBirth) {
            return res.status(400).json({ message: "dob is required!" });
        }
        if (email) {
            const exist = await employee_1.default.findOne({ email, branchId, isDeleted: false });
            if (exist) {
                return res.status(400).json({ message: "Email already exists!" });
            }
        }
        const existContact = await employee_1.default.findOne({ contactNo, branchId, isDeleted: false });
        if (existContact)
            return res
                .status(400)
                .json({ message: "Phone number is already exists!" });
        const employeeId = await (0, exports.generateUniqueEmployeeId)();
        let uploadedDocuments = [];
        const documentsMetadata = req.body.metadata
            ? JSON.parse(req.body.metadata)
            : [];
        if (req.files && Array.isArray(req.files)) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const meta = documentsMetadata[i] || {}; // fallback in case metadata missing
                const uploadResponse = await imageKit_1.imagekit.upload({
                    file: file.buffer.toString("base64"),
                    fileName: file.originalname,
                    folder: "/images",
                });
                uploadedDocuments.push({
                    doc_name: meta.doc_name || file.originalname,
                    doc_file: uploadResponse.url,
                    doc_typeId: meta.doc_typeId ? new mongoose_2.Types.ObjectId(meta.doc_typeId) : null,
                    startDate: meta.startDate,
                    endDate: meta.endDate,
                });
            }
        }
        await employee_1.default.create({
            branchId,
            positionId,
            departmentId,
            empId: employeeId,
            salary,
            dateOfJoining,
            firstName,
            lastName,
            contactNo,
            contactNo2,
            email,
            nationality,
            fatherName,
            motherName,
            dateOfBirth,
            qualification,
            fieldOfStudy,
            residentialAddress,
            gender,
            maritalStatus,
            documents: uploadedDocuments,
        });
        return res.status(200).json({ message: "Employee created successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res, next) => {
    try {
        const { employeeId, branchId, positionId, departmentId, salary, dateOfJoining, firstName, lastName, contactNo, contactNo2, email, nationality, dateOfBirth, fatherName, motherName, qualification, fieldOfStudy, residentialAddress, gender, maritalStatus, existingDocuments, } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required!" });
        }
        const employee = await employee_1.default.findById(employeeId);
        if (!employee)
            return res.status(400).json({ message: "Employee not found!" });
        //  Validate required fields
        if (!branchId)
            return res.status(400).json({ message: "Branch ID is required!" });
        if (!positionId)
            return res.status(400).json({ message: "Position is required!" });
        if (!departmentId)
            return res.status(400).json({ message: "Department is required!" });
        if (!firstName)
            return res.status(400).json({ message: "First name is required!" });
        if (!dateOfJoining)
            return res.status(400).json({ message: "Date of joining is required!" });
        if (!contactNo)
            return res.status(400).json({ message: "Contact number is required!" });
        if (!gender)
            return res.status(400).json({ message: "Gender is required!" });
        //  Check unique email/contact
        if (email && email !== employee.email) {
            const exist = await employee_1.default.findOne({ email, isDeleted: false, branchId });
            if (exist)
                return res.status(400).json({ message: "Email already exists!" });
        }
        if (contactNo && contactNo !== employee.contactNo) {
            const existContact = await employee_1.default.findOne({ contactNo, branchId, isDeleted: false });
            if (existContact)
                return res
                    .status(400)
                    .json({ message: "Phone number already exists!" });
        }
        let finalDocuments = [];
        if (existingDocuments) {
            // front-end sends existingDocuments as JSON string
            const parsedExistingDocs = Array.isArray(existingDocuments)
                ? existingDocuments
                : JSON.parse(existingDocuments);
            finalDocuments = parsedExistingDocs.map((doc) => ({
                doc_name: doc.doc_name,
                doc_file: doc.doc_file,
                doc_typeId: doc.doc_typeId ? new mongoose_2.Types.ObjectId(doc.doc_typeId) : null,
                startDate: doc.startDate,
                endDate: doc.endDate,
            }));
        }
        const documentsMetadata = req.body.metadata
            ? JSON.parse(req.body.metadata)
            : [];
        if (req.files && Array.isArray(req.files)) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const meta = documentsMetadata[i] || {};
                const uploadResponse = await imageKit_1.imagekit.upload({
                    file: file.buffer.toString("base64"),
                    fileName: file.originalname,
                    folder: "/images",
                });
                finalDocuments.push({
                    doc_name: meta.doc_name || file.originalname || "",
                    doc_file: uploadResponse.url || "",
                    doc_typeId: meta.doc_typeId ? new mongoose_2.Types.ObjectId(meta.doc_typeId) : null,
                    startDate: meta.startDate,
                    endDate: meta.endDate,
                });
            }
        }
        //  Update employee
        employee.branchId = branchId;
        employee.positionId = positionId;
        employee.departmentId = departmentId;
        employee.salary = salary;
        employee.dateOfJoining = dateOfJoining;
        employee.firstName = firstName;
        employee.lastName = lastName;
        employee.contactNo = contactNo;
        employee.contactNo2 = contactNo2;
        employee.email = email;
        employee.nationality = nationality;
        employee.fatherName = fatherName;
        employee.motherName = motherName;
        employee.qualification = qualification;
        employee.fieldOfStudy = fieldOfStudy;
        employee.residentialAddress = residentialAddress;
        employee.gender = gender;
        employee.dateOfBirth = dateOfBirth;
        employee.maritalStatus = maritalStatus;
        employee.documents = finalDocuments;
        await employee.save();
        return res.status(200).json({ message: "Employee updated successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.updateEmployee = updateEmployee;
const getEmployees = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // Validate branchId
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // Search & filters
        const search = (req.query.search || "").trim();
        const branchId = req.query.branchId;
        const filterDepartmentName = req.query.departmentId; // dept_name from frontend
        const filterPositionName = req.query.positionId;
        const filterGender = (req.query.gender || "").trim();
        if (!branchId)
            return res.status(400).json({ message: "Branch Id is required!" });
        // Build aggregation pipeline
        const pipeline = [
            {
                $match: {
                    branchId: new mongoose_1.default.Types.ObjectId(branchId),
                    isDeleted: false,
                },
            },
            // Join Department
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "department",
                },
            },
            { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
            // Join Position
            {
                $lookup: {
                    from: "positions",
                    localField: "positionId",
                    foreignField: "_id",
                    as: "position",
                },
            },
            { $unwind: { path: "$position", preserveNullAndEmptyArrays: true } },
            // 👇 Join DocumentType for each document in documents array
            {
                $lookup: {
                    from: "documenttypes", // collection name (check your MongoDB)
                    localField: "documents.doc_typeId",
                    foreignField: "_id",
                    as: "docTypeDetails",
                },
            },
            {
                $addFields: {
                    documents: {
                        $map: {
                            input: "$documents",
                            as: "doc",
                            in: {
                                doc_name: "$$doc.doc_name",
                                doc_file: "$$doc.doc_file",
                                doc_typeId: "$$doc.doc_typeId",
                                doc_type: {
                                    $let: {
                                        vars: {
                                            matched: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$docTypeDetails",
                                                            as: "d",
                                                            cond: { $eq: ["$$d._id", "$$doc.doc_typeId"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: "$$matched.doc_type",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            { $unset: "docTypeDetails" },
        ];
        // Search across employee fields + department + position
        if (search.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { firstName: { $regex: search, $options: "i" } },
                        { lastName: { $regex: search, $options: "i" } },
                        { contactNo: { $regex: search, $options: "i" } },
                        { contactNo2: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                        { nationality: { $regex: search, $options: "i" } },
                        { fatherName: { $regex: search, $options: "i" } },
                        { motherName: { $regex: search, $options: "i" } },
                        { qualification: { $regex: search, $options: "i" } },
                        { fieldOfStudy: { $regex: search, $options: "i" } },
                        { gender: { $regex: search, $options: "i" } },
                        { maritalStatus: { $regex: search, $options: "i" } },
                        { empId: { $regex: search, $options: "i" } },
                        { dateOfBirth: { $regex: search, $options: "i" } },
                        { "department.dept_name": { $regex: search, $options: "i" } },
                        { "position.pos_name": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        // Department filter by name
        if (filterDepartmentName) {
            pipeline.push({
                $match: {
                    "department.dept_name": {
                        $regex: filterDepartmentName,
                        $options: "i",
                    },
                },
            });
        }
        // Position filter by name
        if (filterPositionName) {
            pipeline.push({
                $match: {
                    "position.pos_name": { $regex: filterPositionName, $options: "i" },
                },
            });
        }
        if (filterGender) {
            pipeline.push({
                $match: { gender: { $regex: filterGender, $options: "i" } },
            });
        }
        // Count total documents after filters
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await employee_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.total || 0;
        // Pagination & sort
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        // Project to include dept_name & pos_name
        pipeline.push({
            $project: {
                firstName: 1,
                lastName: 1,
                empId: 1,
                contactNo: 1,
                contactNo2: 1,
                email: 1,
                nationality: 1,
                fatherName: 1,
                motherName: 1,
                qualification: 1,
                fieldOfStudy: 1,
                residentialAddress: 1,
                gender: 1,
                maritalStatus: 1,
                salary: 1,
                dateOfBirth: 1,
                dateOfJoining: 1,
                documents: 1,
                branchId: 1,
                dept_name: "$department.dept_name",
                pos_name: "$position.pos_name",
                departmentId: "$department._id",
                positionId: "$position._id",
            },
        });
        const employees = await employee_1.default.aggregate(pipeline);
        return res.status(200).json({
            data: employees,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getEmployees = getEmployees;
const deleteEmployee = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { employeeId } = req.params;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!employeeId) {
            return res.status(400).json({ message: "Employee Id is required!" });
        }
        const employee = await employee_1.default.findOne({ _id: employeeId });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found!" });
        }
        await employee_1.default.findByIdAndUpdate(employeeId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "Position deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteEmployee = deleteEmployee;
//docuement type 
const createDocumentType = async (req, res, next) => {
    try {
        const { branchIds, documents } = req.body;
        const userId = req.user?.id; //  assuming req.user is populated from auth middleware
        // 1️ Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // 2️ Validate branchIds
        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({ message: "Branch IDs are required!" });
        }
        // 3️ Validate departments array
        if (!documents ||
            !Array.isArray(documents) ||
            documents.length === 0) {
            return res.status(400).json({ message: "Documents are required!" });
        }
        for (const doc of documents) {
            if (!doc) {
                return res
                    .status(400)
                    .json({ message: "Document type name is required!" });
            }
        }
        // 4️ Check duplicates in DB
        const documentNames = documents.map((dept) => dept);
        const existDocuments = await documentType_1.default.find({
            branchId: { $in: branchIds },
            doc_type: { $in: documentNames },
            isDeleted: false,
        }).collation({ locale: "en", strength: 2 });
        if (existDocuments.length > 0) {
            existDocuments.map((d) => d);
            return res.status(400).json({
                message: `The following document type already exist in one or more branches`,
            });
        }
        // 5️ Prepare bulk insert data
        const docuementData = [];
        for (const branchId of branchIds) {
            for (const doc of documents) {
                docuementData.push({
                    branchId,
                    doc_type: doc.trim(),
                    //   createdById: userId,
                    isDeleted: false,
                });
            }
        }
        // 6️ Insert all at once
        await documentType_1.default.insertMany(docuementData);
        return res.status(201).json({
            message: "Document type created successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createDocumentType = createDocumentType;
const getAllDocumentTypes = async (req, res, next) => {
    try {
        const branchId = req.query.branchId;
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // validate branchId
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        // pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search term
        const search = (req.query.search || "").trim();
        // build query
        const query = {
            branchId: new mongoose_1.default.Types.ObjectId(branchId),
            isDeleted: false,
        };
        //  only add dept_name when search has content
        if (search.length > 0) {
            query.doc_type = { $regex: search, $options: "i" };
        }
        const totalCount = await documentType_1.default.countDocuments(query);
        const docs = await documentType_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return res.status(200).json({ data: docs, totalCount, page, limit });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllDocumentTypes = getAllDocumentTypes;
const updateDocument = async (req, res, next) => {
    try {
        const { documentId, branchId, doc_type } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        if (!documentId) {
            return res.status(400).json({ message: "Document Id is required!" });
        }
        if (!doc_type ||
            typeof doc_type !== "string" ||
            doc_type.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "New document type is required!" });
        }
        const branch = await branch_1.default.findById(branchId);
        if (!branch)
            return res.status(400).json({ message: "Branch not found!" });
        const document = await documentType_1.default.findOne({
            _id: documentId,
            branchId,
        });
        if (!document) {
            return res.status(404).json({ message: "Document not found!" });
        }
        const existDocument = await documentType_1.default.findOne({
            branchId,
            doc_type: doc_type.trim(),
            isDeleted: false,
            _id: { $ne: documentId }, // Exclude the current department
        });
        if (existDocument) {
            return res.status(400).json({
                message: `The document type already exists in the specified branch!`,
            });
        }
        if (document.doc_type === doc_type.trim()) {
            return res.status(400).json({
                message: "New document type is the same as the current type!",
            });
        }
        document.doc_type = doc_type.trim();
        await document.save();
        return res.status(200).json({
            message: "document type updated successfully!",
            data: document,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateDocument = updateDocument;
const deleteDocumentType = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!documentId) {
            return res.status(400).json({ message: "document type Id is required!" });
        }
        const document = await documentType_1.default.findOne({ _id: documentId });
        if (!document) {
            return res.status(404).json({ message: "document type not found!" });
        }
        await documentType_1.default.findByIdAndUpdate(documentId, {
            isDeleted: true,
            deletedAt: new Date(),
            // deletedById: user._id,
            deletedBy: user.username,
        });
        return res.status(200).json({
            message: "Document type deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteDocumentType = deleteDocumentType;
