"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const dbURI = process.env.MONGO_URL;
        await mongoose_1.default.connect(dbURI);
        console.log('Database connected succssfully');
    }
    catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
};
exports.default = connectDB;
