"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUserAndAllowedBranchIds = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_1 = require("../constants/http-status");
const resolveUserAndAllowedBranchIds = async ({ userId, userModel, branchModel, requestedBranchId, }) => {
    const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
    });
    if (!user) {
        const error = new Error("User not found or inactive");
        error.statusCode = http_status_1.HTTP_STATUS.UNAUTHORIZED;
        throw error;
    }
    let allowedBranchIds = [];
    if (user.role === "CompanyAdmin") {
        const branches = await branchModel
            .find({
            companyAdminId: user._id,
            isDeleted: false,
        })
            .select("_id");
        allowedBranchIds = branches.map((b) => new mongoose_1.default.Types.ObjectId(b._id));
    }
    else if (user.role === "User") {
        if (!user.branchId) {
            const error = new Error("User is not assigned to any branch!");
            error.statusCode = http_status_1.HTTP_STATUS.BAD_REQUEST;
            throw error;
        }
        allowedBranchIds = [user.branchId];
    }
    else {
        const error = new Error("Unauthorized role!");
        error.statusCode = http_status_1.HTTP_STATUS.FORBIDDEN;
        throw error;
    }
    if (requestedBranchId) {
        const filterId = new mongoose_1.default.Types.ObjectId(requestedBranchId);
        if (!allowedBranchIds.some((id) => id.equals(filterId))) {
            const error = new Error("You are not authorized to view data for this branch!");
            error.statusCode = http_status_1.HTTP_STATUS.FORBIDDEN;
            throw error;
        }
        return {
            user,
            allowedBranchIds: [filterId],
        };
    }
    return { user, allowedBranchIds };
};
exports.resolveUserAndAllowedBranchIds = resolveUserAndAllowedBranchIds;
