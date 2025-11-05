"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleUserUserGroup = exports.deletePermission = exports.updateUserGroup = exports.getOneUserGroups = exports.getAlluserGroups = exports.createUserGroup = void 0;
const user_1 = __importDefault(require("../../models/user"));
const permission_1 = __importDefault(require("../../models/permission"));
const mongoose_1 = __importDefault(require("mongoose"));
const createUserGroup = async (req, res, next) => {
    try {
        const { branchId, name, permissions, fullAdminAccess } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        const existing = await permission_1.default.findOne({
            name,
            branchId,
            isDeleted: false,
        });
        if (existing) {
            return res
                .status(400)
                .json({ message: "Permission role name already exists!" });
        }
        let formattedPermissions = [];
        if (permissions && Array.isArray(permissions)) {
            formattedPermissions = permissions.map((p) => {
                const moduleAccess = {
                    can_create: p.actions?.can_create || false,
                    can_read: p.actions?.can_read || false,
                    can_update: p.actions?.can_update || false,
                    can_delete: p.actions?.can_delete || false,
                };
                if (p.moduleFullAccess) {
                    moduleAccess.can_create = true;
                    moduleAccess.can_read = true;
                    moduleAccess.can_update = true;
                    moduleAccess.can_delete = true;
                }
                return {
                    module: p.module,
                    moduleFullAccess: !!p.moduleFullAccess,
                    actions: moduleAccess,
                };
            });
        }
        const newPermission = new permission_1.default({
            name,
            permissions: formattedPermissions,
            branchId: branchId,
            User: userId,
            // createdBy: user.name,
            fullAdminAccess,
        });
        await newPermission.save();
        res
            .status(201)
            .json({
            message: "Permissions created successfully",
            data: newPermission,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createUserGroup = createUserGroup;
const getAlluserGroups = async (req, res, next) => {
    try {
        const branchId = req.query.branchId;
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        // pagination setup
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search setup
        const search = (req.query.search || "").trim();
        // base query
        const query = {
            branchId: new mongoose_1.default.Types.ObjectId(branchId),
            isDeleted: false,
        };
        // add search filter if present
        if (search.length > 0) {
            query.name = { $regex: search, $options: "i" };
        }
        // total count for pagination
        const totalCount = await permission_1.default.countDocuments(query);
        // get paginated data
        const permissions = await permission_1.default.find(query)
            .select({
            name: 1,
            createdAt: 1,
            updatedAt: 1,
            _id: 1,
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return res.status(200).json({
            data: permissions,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAlluserGroups = getAlluserGroups;
const getOneUserGroups = async (req, res, next) => {
    try {
        const { permissionId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!permissionId) {
            return res.status(400).json({ message: "Permisssion Id is required!" });
        }
        const permission = await permission_1.default.findById(permissionId);
        return res.status(200).json({ data: permission });
    }
    catch (err) {
        next(err);
    }
};
exports.getOneUserGroups = getOneUserGroups;
const updateUserGroup = async (req, res, next) => {
    try {
        const { branchId, permissionId, name, permissions, fullAdminAccess } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!branchId) {
            return res.status(400).json({ message: "Permission Id is required!" });
        }
        if (!permissionId) {
            return res.status(400).json({ message: "Permission ID is required!" });
        }
        // Check if permission exists
        const existingPermission = await permission_1.default.findOne({ _id: permissionId, branchId, isDeleted: false });
        if (!existingPermission) {
            return res.status(404).json({ message: "Permission not found!" });
        }
        // If name is changing, check for duplicates
        if (name && name !== existingPermission.name) {
            const nameCheck = await permission_1.default.findOne({ name, branchId });
            if (nameCheck) {
                return res.status(400).json({ message: "Permission role name already exists!" });
            }
        }
        // Format permissions\
        let formattedPermissions = [];
        if (permissions && Array.isArray(permissions)) {
            formattedPermissions = permissions.map((p) => {
                const moduleAccess = {
                    can_create: p.actions?.can_create || false,
                    can_read: p.actions?.can_read || false,
                    can_update: p.actions?.can_update || false,
                    can_delete: p.actions?.can_delete || false,
                };
                if (p.moduleFullAccess) {
                    moduleAccess.can_create = true;
                    moduleAccess.can_read = true;
                    moduleAccess.can_update = true;
                    moduleAccess.can_delete = true;
                }
                return {
                    module: p.module,
                    moduleFullAccess: !!p.moduleFullAccess,
                    actions: moduleAccess,
                };
            });
        }
        // Update the permission document
        const updated = await permission_1.default.findByIdAndUpdate(permissionId, {
            name,
            permissions: formattedPermissions,
            fullAdminAccess,
            // updatedBy: userId,
            updatedAt: new Date(),
        }, { new: true });
        return res.status(200).json({
            message: "Permission updated successfully",
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateUserGroup = updateUserGroup;
const deletePermission = async (req, res, next) => {
    try {
        const { branchId, permissionId } = req.body;
        const userId = req.user?.id;
        if (!branchId || !permissionId) {
            return res.status(400).json({ message: "Branch Id and Permission Id are required!" });
        }
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const permission = await permission_1.default.findOne({ _id: permissionId, branchId, isDeleted: false });
        if (!permission) {
            return res.status(404).json({ message: "Permission not found!" });
        }
        await permission_1.default.findByIdAndUpdate(permissionId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        await user_1.default.updateMany({ branchId, permissions: permissionId }, { $pull: { permissions: permissionId } });
        return res.status(200).json({ message: "Permission deleted successfully!" });
    }
    catch (err) {
        next(err);
    }
};
exports.deletePermission = deletePermission;
const getSingleUserUserGroup = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No user ID found" });
        }
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false })
            .populate({
            path: "permissions",
            match: { isDeleted: false }, // exclude deleted permissions
        });
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        return res.status(200).json(user);
    }
    catch (err) {
        next(err);
    }
};
exports.getSingleUserUserGroup = getSingleUserUserGroup;
