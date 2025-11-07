"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.createUser = exports.getUser = exports.loginUser = exports.createAdmin = void 0;
const user_1 = __importDefault(require("../../models/user"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const employee_1 = __importDefault(require("../../models/employee"));
const mongoose_1 = __importDefault(require("mongoose"));
const createAdmin = async (req, res, next) => {
    try {
        const { username, password, role } = req.body;
        if (!username)
            return res.status(400).json({ message: "Username is required!" });
        if (!password)
            return res.status(400).json({ message: "Password is required!" });
        if (!role)
            return res.status(400).json({ message: "Role is required!" });
        if (!["CompanyAdmin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role!" });
        }
        const existingUser = await user_1.default.findOne({ username, isDeleted: false });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User with this username already exists!" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await user_1.default.create({
            username,
            password: hashedPassword,
            role,
        });
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, username: user.username }, process.env.SECRET_KEY, { expiresIn: "7d" });
        //    res.cookie("token", token, {
        //   httpOnly: true,
        //   secure: false,
        //   sameSite: "none",
        //   path:'/'
        // });
        return res
            .status(200)
            .json({ message: "Account created succsffully", user, token });
    }
    catch (err) {
        next(err);
    }
};
exports.createAdmin = createAdmin;
const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username)
            return res.status(400).json({ message: "Username is required!" });
        if (!password)
            return res.status(400).json({ message: "Password is required!" });
        const user = await user_1.default.findOne({
            username,
            isDeleted: false,
        });
        if (!user)
            return res.status(400).json({ message: "Invalid username!" });
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password!" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username, role: user.role }, process.env.SECRET_KEY, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // must be true on HTTPS
            sameSite: "lax",
            domain: ".tecbooks.online", // critical — share cookie across subdomains
            path: "/",
            // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            message: "Login successful",
            user,
            token,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.loginUser = loginUser;
const getUser = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        return res.status(200).json({ message: "ok done" });
    }
    catch (err) {
        next(err);
    }
};
exports.getUser = getUser;
const createUser = async (req, res, next) => {
    try {
        const { branchId, employeeId, username, password, permissionIds } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        if (!employeeId) {
            return res.status(400).json({ message: "Employee Id  is required!" });
        }
        if (!username) {
            return res.status(400).json({ message: "Usernme  is required!" });
        }
        if (!password) {
            return res.status(400).json({ message: "Password  is required!" });
        }
        const existingUser = await user_1.default.findOne({ username, isDeleted: false });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists!" });
        }
        const emp = await employee_1.default.findById(employeeId);
        if (!emp) {
            return res.status(400).json({ message: "Employee not found!" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await user_1.default.create({
            branchId,
            username,
            password: hashedPassword,
            employeeId,
            role: "User",
            permissions: permissionIds || [],
            createdById: userId,
        });
        await user_1.default.findByIdAndUpdate(branchId, { branchId: branchId });
        return res.status(200).json({ message: "User created successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.createUser = createUser;
const getAllUsers = async (req, res, next) => {
    try {
        const branchId = req.query.branchId;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        // pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search term
        const search = (req.query.search || "").trim();
        const pipeline = [
            {
                $match: {
                    branchId: new mongoose_1.default.Types.ObjectId(branchId),
                    isDeleted: false,
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employee",
                },
            },
            {
                $unwind: {
                    path: "$employee",
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];
        // search by username or employee name
        if (search.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { username: { $regex: search, $options: "i" } },
                        { "employee.firstName": { $regex: search, $options: "i" } },
                        { "employee.lastName": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        const totalCountPipeline = [...pipeline, { $count: "total" }];
        const totalCountResult = await user_1.default.aggregate(totalCountPipeline);
        const totalCount = totalCountResult[0]?.total || 0;
        pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }, {
            $project: {
                _id: 1,
                username: 1,
                role: 1,
                branchId: 1,
                permissions: 1,
                "employee._id": 1,
                "employee.firstName": 1,
                "employee.lastName": 1,
                createdAt: 1,
                updatedAt: 1,
            },
        });
        const users = await user_1.default.aggregate(pipeline);
        return res.status(200).json({
            data: users,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllUsers = getAllUsers;
const updateUser = async (req, res, next) => {
    try {
        const { userId, branchId, employeeId, username, password, permissionIds } = req.body;
        const loggedInUserId = req.user?.id;
        // 🔹 Validate logged-in user
        const loggedInUser = await user_1.default.findOne({
            _id: loggedInUserId,
            isDeleted: false,
        });
        if (!loggedInUser)
            return res.status(400).json({ message: "User not found!" });
        // 🔹 Validate required fields
        if (!userId)
            return res.status(400).json({ message: "User ID is required!" });
        if (!branchId)
            return res.status(400).json({ message: "Branch ID is required!" });
        if (!employeeId)
            return res.status(400).json({ message: "Employee ID is required!" });
        if (!username)
            return res.status(400).json({ message: "Username is required!" });
        // 🔹 Find target user
        const existingUser = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!existingUser)
            return res.status(400).json({ message: "User not found!" });
        // 🔹 Validate employee existence
        const emp = await employee_1.default.findById(employeeId);
        if (!emp)
            return res.status(400).json({ message: "Employee not found!" });
        // 🔹 Check if username already exists (excluding self)
        const usernameExists = await user_1.default.findOne({
            username,
            _id: { $ne: userId },
            isDeleted: false,
        });
        if (usernameExists)
            return res.status(400).json({ message: "Username already exists!" });
        // 🔹 Hash password only if provided
        let hashedPassword = existingUser.password;
        if (password) {
            hashedPassword = await bcrypt_1.default.hash(password, 10);
        }
        // 🔹 Update user
        existingUser.branchId = branchId;
        existingUser.employeeId = employeeId;
        existingUser.username = username;
        existingUser.password = hashedPassword;
        existingUser.permissions = permissionIds || existingUser.permissions;
        await existingUser.save();
        return res.status(200).json({ message: "User updated successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res, next) => {
    try {
        const userid = req.user?.id;
        const { userId } = req.params;
        // Validate user
        const user = await user_1.default.findOne({ _id: userid, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!userId) {
            return res.status(400).json({ message: "User Id is required!" });
        }
        const companyAdmin = await user_1.default.findOne({
            _id: userId,
            role: "CompanyAdmin",
        });
        if (companyAdmin) {
            return res
                .status(400)
                .json({ message: "Company Admin cannot be deleted!" });
        }
        await user_1.default.findByIdAndUpdate(userId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "User deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteUser = deleteUser;
