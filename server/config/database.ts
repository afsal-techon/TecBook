import { NextFunction } from "express";
import mongoose from "mongoose";


const connectDB = async ()=>{
    try {
        const dbURI = process.env.MONGO_URL as string
        await mongoose.connect(dbURI);
        console.log('Database connected succssfully')
        
    } catch (err:any) {
       console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

export default  connectDB