"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyUser = (req, res, next) => {
    try {
        // const token = req.header("Authorization");
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
exports.verifyUser = verifyUser;
