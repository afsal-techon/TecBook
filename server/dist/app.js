"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
console.log("🚀 App starting...");
const express_1 = __importDefault(require("express"));
console.log("✅ Express imported");
const dotenv_1 = __importDefault(require("dotenv"));
console.log("✅ .env loaded");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mainRouter_1 = __importDefault(require("./Routes/mainRouter"));
const database_1 = __importDefault(require("./config/database"));
const cors_1 = __importDefault(require("cors"));
const purchase_order_routes_1 = __importDefault(require("./Routes/purchase-order.routes"));
const billing_records_routes_1 = __importDefault(require("./Routes/billing-records.routes"));
const expense_routes_1 = __importDefault(require("./Routes/expense.routes"));
const paymentesMade_routes_1 = __importDefault(require("./Routes/paymentesMade.routes"));
const credit_note_routes_1 = __importDefault(require("./Routes/credit-note.routes"));
const vendor_credit_routes_1 = __importDefault(require("./Routes/vendor-credit.routes"));
// import { accountTypeController } from "./controller/accountTypeController/account-types.controller";
const account_type_routes_1 = __importDefault(require("./Routes/account-type.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, cookie_parser_1.default)());
// app.use(cors({
//   origin: ["http://localhost:3000", "http://192.168.10.117:3000"],
//   credentials: true,
// }));
app.use((0, cors_1.default)({
    origin: "https://www.tecbooks.online",
    credentials: true,
}));
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
});
(async () => {
    // accountTypeController.autoCreateCommonAccountTypes() // in future move to register company function
    // accountTypeController.autoCreateCommonAccounts();
    await (0, database_1.default)();
    app.use("/api", mainRouter_1.default);
    app.use("/api/purchase-orders", purchase_order_routes_1.default);
    app.use("/api/billing-records", billing_records_routes_1.default);
    app.use("/api/expenses", expense_routes_1.default);
    app.use("/api/payments-made", paymentesMade_routes_1.default);
    app.use("/api/credit-note", credit_note_routes_1.default);
    app.use("/api/vendor-credit", vendor_credit_routes_1.default);
    app.use("/api/account-types", account_type_routes_1.default);
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
})();
