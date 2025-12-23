import { Document, Schema, Types } from "mongoose";

export interface IBaseFIelds extends Document {
  isDeleted: boolean;
  createdBy:Types.ObjectId;
}
