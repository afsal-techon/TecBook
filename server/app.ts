import "reflect-metadata";
console.log("🚀 App starting...");
import express , { Application, NextFunction, Request,Response } from 'express';
console.log("✅ Express imported");
import dotenv from 'dotenv';
console.log("✅ .env loaded");
import cookieParser from "cookie-parser";
import mainRouter from './Routes/mainRouter'
import connectDB from './config/database';
import cors from 'cors';
import purchaseOrderRoutes from './Routes/purchase-order.routes';
import billingRecordsRoutes from './Routes/billing-records.routes';




dotenv.config();
const app:Application = express();


const port  = process.env.PORT;


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use(cors({
  origin: ["http://localhost:3000", "http://192.168.10.117:3000"],
  credentials: true,
}));

// app.use(cors({
//   origin: "https://www.tecbooks.online",
//   credentials: true,
// }));


 app.use((err:any, req:Request, res:Response, next:NextFunction) => {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
});
 


(async () => {
  await connectDB();

  app.use("/api", mainRouter);
  app.use("/api/purchase-orders", purchaseOrderRoutes);
  app.use("/api/billing-records", billingRecordsRoutes);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();






