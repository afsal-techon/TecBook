"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOneProject = exports.updateProject = exports.getAllProjects = exports.createProject = void 0;
const user_1 = __importDefault(require("../../models/user"));
const branch_1 = __importDefault(require("../../models/branch"));
const mongoose_1 = __importDefault(require("mongoose"));
const project_1 = __importDefault(require("../../models/project"));
const createProject = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { branchId, customerId, projectName, projectId, billingMethod, description, users, projectCost, costBudget, revenueBudget, ratePerHour, tasks, } = req.body;
        if (!branchId) {
            return res.status(400).json({ message: "branchId is required!" });
        }
        if (!customerId) {
            return res.status(400).json({ message: "CustomerId is required!" });
        }
        if (!projectName || projectName.trim() === "") {
            return res.status(400).json({ message: "project name is required!" });
        }
        if (!billingMethod) {
            return res.status(400).json({ message: "billingMethod is required!" });
        }
        if (billingMethod === "Fixed Cost for Project") {
            if (!projectCost || projectCost <= 0) {
                return res.status(400).json({ message: "project cost is required!" });
            }
        }
        if (billingMethod === "Based on Project Hours") {
            if (!ratePerHour || ratePerHour <= 0) {
                return res.status(400).json({
                    message: "ratePerHour is required!",
                });
            }
        }
        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({
                message: "At least one task is required!",
            });
        }
        // Validate each task
        for (const t of tasks) {
            if (!t.taskName || t.taskName.trim() === "") {
                return res.status(400).json({ message: "Task name is required!" });
            }
            if (billingMethod === "Based on Task Hours") {
                if (!t.ratePerHour || t.ratePerHour <= 0) {
                    return res.status(400).json({
                        message: "Each task must include a valid ratePerHour!",
                    });
                }
            }
        }
        const newProject = await project_1.default.create({
            branchId,
            customerId,
            projectName,
            projectId,
            billingMethod,
            description,
            users,
            projectCost: billingMethod === "Fixed Cost for Project" ? projectCost : 0,
            ratePerHour: billingMethod === "Based on Project Hours" ? ratePerHour : 0,
            tasks,
            costBudget,
            revenueBudget,
            createdById: userId,
        });
        return res.status(201).json({
            message: "Project created successfully",
            data: newProject,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createProject = createProject;
const getAllProjects = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        const userRole = user.role;
        const filterBranchId = req.query.branchId;
        const search = (req.query.search || "").trim();
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // Determine allowed branches
        let allowedBranchIds = [];
        if (userRole === "CompanyAdmin") {
            const branches = await branch_1.default.find({
                companyAdminId: userId,
                isDeleted: false,
            }).select("_id");
            allowedBranchIds = branches.map((b) => new mongoose_1.default.Types.ObjectId(b._id));
        }
        else if (userRole === "User") {
            if (!user.branchId) {
                return res.status(400).json({
                    message: "User is not assigned to any branch!",
                });
            }
            allowedBranchIds = [user.branchId];
        }
        else {
            return res.status(403).json({ message: "Unauthorized role!" });
        }
        // Branch filter (if selected)
        if (filterBranchId) {
            const filterId = new mongoose_1.default.Types.ObjectId(filterBranchId);
            if (!allowedBranchIds.some((id) => id.equals(filterId))) {
                return res.status(403).json({
                    message: "You are not authorized to view projects for this branch!",
                });
            }
            allowedBranchIds = [filterId];
        }
        // Base match conditions
        const matchStage = {
            branchId: { $in: allowedBranchIds },
            isDeleted: false,
        };
        // Build aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            // Join Customer
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer",
                },
            },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        ];
        // Search filter (projectName or projectCode)
        if (search.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { projectName: { $regex: search, $options: "i" } },
                        { projectId: { $regex: search, $options: "i" } },
                        { "customer.name": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        // Count before pagination
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await project_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.total || 0;
        // Sort, skip, limit
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        // Projection
        pipeline.push({
            $project: {
                branchId: 1,
                customerId: 1,
                projectName: 1,
                projectId: 1,
                billingMethod: 1,
                description: 1,
                users: 1,
                projectCost: 1,
                ratePerHour: 1,
                costBudget: 1,
                revenueBudget: 1,
                tasks: 1,
                createdAt: 1,
                "customer.name": 1,
                "customer.email": 1,
                "customer.phone": 1,
            },
        });
        // Execute pipeline
        const projects = await project_1.default.aggregate(pipeline);
        return res.status(200).json({
            data: projects,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllProjects = getAllProjects;
const updateProject = async (req, res, next) => {
    try {
        const { branchId, customerId, projectName, projectId, billingMethod, description, users, projectCost, ratePerHour, tasks, costBudget, revenueBudget } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { projectIid } = req.params;
        if (!projectId) {
            return res.status(400).json({ message: "projectId is required!" });
        }
        const existingProject = await project_1.default.findOne({
            _id: projectIid,
            isDeleted: false,
        });
        if (!existingProject) {
            return res.status(404).json({ message: "Project not found!" });
        }
        if (branchId !== undefined && !branchId) {
            return res.status(400).json({ message: "branchId is required!" });
        }
        if (customerId !== undefined && !customerId) {
            return res.status(400).json({ message: "CustomerId is required!" });
        }
        if (projectName !== undefined && projectName.trim() === "") {
            return res.status(400).json({ message: "project name cannot be empty!" });
        }
        if (billingMethod !== undefined && billingMethod.trim() === "") {
            return res.status(400).json({ message: "billingMethod is required!" });
        }
        // Billing-based validations
        if (billingMethod === "Fixed Cost for Project") {
            if (!projectCost || projectCost <= 0) {
                return res
                    .status(400)
                    .json({ message: "projectCost is required and must be > 0!" });
            }
        }
        if (billingMethod === "Based on Project Hours") {
            if (!ratePerHour || ratePerHour <= 0) {
                return res
                    .status(400)
                    .json({ message: "ratePerHour is required and must be > 0!" });
            }
        }
        if (billingMethod === "Based on Task Hours") {
            if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                return res.status(400).json({
                    message: "At least one task is required!",
                });
            }
            for (const t of tasks) {
                if (!t.taskName || t.taskName.trim() === "") {
                    return res.status(400).json({ message: "Task name is required!" });
                }
                if (!t.ratePerHour || t.ratePerHour <= 0) {
                    return res.status(400).json({
                        message: "Each task must include a valid ratePerHour!",
                    });
                }
            }
        }
        // === UPDATE LOGIC ===
        existingProject.branchId = branchId ?? existingProject.branchId;
        existingProject.customerId = customerId ?? existingProject.customerId;
        existingProject.projectName = projectName ?? existingProject.projectName;
        existingProject.projectId = projectId ?? existingProject.projectId;
        existingProject.billingMethod =
            billingMethod ?? existingProject.billingMethod;
        existingProject.description = description ?? existingProject.description;
        existingProject.users = users ?? existingProject.users;
        existingProject.costBudget = costBudget ?? existingProject.costBudget;
        existingProject.revenueBudget = revenueBudget ?? existingProject.revenueBudget;
        // Handle billing-based assignments
        if (billingMethod === "Fixed Cost for Project") {
            existingProject.projectCost = projectCost;
            existingProject.ratePerHour = 0;
        }
        if (billingMethod === "Based on Project Hours") {
            existingProject.ratePerHour = ratePerHour;
            existingProject.projectCost = 0;
        }
        if (billingMethod === "Based on Task Hours") {
            existingProject.tasks = tasks;
            existingProject.projectCost = 0;
            existingProject.ratePerHour = 0;
        }
        await existingProject.save();
        return res.status(200).json({
            message: "Project updated successfully",
            data: existingProject,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateProject = updateProject;
const getOneProject = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { projectid } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectid)) {
            return res.status(400).json({ message: "Invalid project ID!" });
        }
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // AGGREGATION PIPELINE
        const pipeline = [
            {
                $match: {
                    _id: new mongoose_1.default.Types.ObjectId(projectid),
                    isDeleted: false,
                },
            },
            // Join Customer
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer",
                },
            },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            // Join Users
            {
                $lookup: {
                    from: "users",
                    localField: "users",
                    foreignField: "_id",
                    as: "assignedUsers",
                },
            },
            // Add taskId for each task object
            {
                $addFields: {
                    tasks: {
                        $map: {
                            input: "$tasks",
                            as: "t",
                            in: {
                                taskId: "$$t._id", // duplicate _id as taskId
                                taskName: "$$t.taskName",
                                description: "$$t.description",
                                ratePerHour: "$$t.ratePerHour",
                                billable: "$$t.billable",
                            },
                        },
                    },
                },
            },
            // Final projection
            {
                $project: {
                    branchId: 1,
                    customerId: 1,
                    projectName: 1,
                    projectId: 1,
                    billingMethod: 1,
                    description: 1,
                    projectCost: 1,
                    ratePerHour: 1,
                    createdAt: 1,
                    tasks: 1,
                    customer: {
                        name: 1,
                        email: 1,
                        phone: 1,
                    },
                    assignedUsers: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        role: 1,
                    },
                },
            },
        ];
        const result = await project_1.default.aggregate(pipeline);
        if (!result.length) {
            return res.status(404).json({ message: "Project not found!" });
        }
        return res.status(200).json({
            data: result[0],
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getOneProject = getOneProject;
