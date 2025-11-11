import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { jwtPayload } from "../types/user.types";




export const verifyUser = (req:Request,res:Response,next:NextFunction)=>{
    try {
        const token = req.header("Authorization");
          //  const token = req.cookies.token;
        
          if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token,process.env.SECRET_KEY as string) as jwtPayload
      req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    next();
        
    } catch (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}