import { Document } from "mongoose";

export interface IBaseFIelds extends Document {
  isDeleted: boolean;
  createdBy: string;
}
