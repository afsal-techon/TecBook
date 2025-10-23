import { Types, Document } from "mongoose";

export interface IUser extends Document {
  branchId?: Types.ObjectId | null;
  username?: string;
  password: string;
  role: "User" | "CompanyAdmin";
  employeeId?:Types.ObjectId | null;
  permissions?: Types.ObjectId[];
  status?: boolean;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface CreateAdminBody {
  username: string,
  password:string,
  role:"CompanyAdmin"
}

export interface adminLoginBody{
  username:string,
  password:string,
}

export interface jwtPayload{
  id:string,
  username:string,
  role:string
}

