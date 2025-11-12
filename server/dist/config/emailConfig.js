"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async ({ to, subject, html }) => {
    try {
        // ✅ Configure your mail transporter
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST, // e.g. "smtp.gmail.com"
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for 587
            auth: {
                user: process.env.SMTP_USER, // your email ID
                pass: process.env.SMTP_PASS, // your email password or app password
            },
        });
        // ✅ Send email
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || "Quotation System"}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`📨 Email sent to ${to}`);
    }
    catch (error) {
        console.error("❌ Failed to send email:", error);
    }
};
exports.default = sendEmail;
