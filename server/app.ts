import express , { Application, NextFunction, Request,Response } from 'express';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import mainRouter from './Routes/mainRouter'
import connectDB from './config/database';
import cors from 'cors';



dotenv.config();
const app:Application = express();


const port  = process.env.PORT;


app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ["http://localhost:3001", "http://192.168.10.117:3001"],
  credentials: true,
}));


 app.use((err:any, req:Request, res:Response, next:NextFunction) => {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
});
 


(async () => {
  await connectDB();

  app.use("/api", mainRouter);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();






