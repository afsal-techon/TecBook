import express, { NextFunction, Request, Response } from "express";
import USER from "../../models/user";
import { adminLoginBody, CreateAdminBody, IUser } from "../../types/user.types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { username, password, role } = req.body as CreateAdminBody;

    if (!username)
      return res.status(400).json({ message: "Username is required!" });
    if (!password)
      return res.status(400).json({ message: "Password is required!" });
    if (!role) return res.status(400).json({ message: "Role is required!" });

    if (!["CompanyAdmin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role!" });
    }

    const existingUser = await USER.findOne({ username ,isDeleted:false });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this username already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user: IUser = await USER.create({
      username,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.SECRET_KEY as string,
      { expiresIn: "7d" }
    );

    //    res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "none",
    //   path:'/'
    // });

    return res
      .status(200)
      .json({ message: "Account created succsffully", user, token });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { username, password } = req.body as adminLoginBody;

    if (!username)
      return res.status(400).json({ message: "Username is required!" });
    if (!password)
      return res.status(400).json({ message: "Password is required!" });

    const user: IUser | null = await USER.findOne({ username ,isDeleted:false});
    if (!user) return res.status(400).json({ message: "Invalid username!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password!" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.SECRET_KEY as string,
      { expiresIn: "7d" }
    );

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "none",
    //   path:'/'
    // });

    return res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    console.log(userId, "user id");
    return res.status(200).json({ message: "ok done" });
  } catch (err) {
    next(err);
  }
};




export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {

     const { branchId, employeeId, username, password, permissionIds  } = req.body


   
  } catch (err) {
    next(err);
  }
};