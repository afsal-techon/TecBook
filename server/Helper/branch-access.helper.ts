import mongoose from "mongoose";
import { Model } from "mongoose";
import { IUser } from "../types/user.types";
import { HTTP_STATUS } from "../constants/http-status";

type BranchAccessParams = {
  userId: string;
  userModel: Model<IUser>;
  branchModel: Model<any>;
  requestedBranchId?: string;
};

export const resolveUserAndAllowedBranchIds = async ({
  userId,
  userModel,
  branchModel,
  requestedBranchId,
}: BranchAccessParams): Promise<{
  user: IUser;
  allowedBranchIds: mongoose.Types.ObjectId[];
}> => {
  const user = await userModel.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    const error: any = new Error("User not found or inactive");
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    throw error;
  }

  let allowedBranchIds: mongoose.Types.ObjectId[] = [];

  if (user.role === "CompanyAdmin") {
    const branches = await branchModel
      .find({
        companyAdminId: user._id,
        isDeleted: false,
      })
      .select("_id");

    allowedBranchIds = branches.map((b) => new mongoose.Types.ObjectId(b._id));
  } else if (user.role === "User") {
    if (!user.branchId) {
      const error: any = new Error("User is not assigned to any branch!");
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    allowedBranchIds = [user.branchId];
  } else {
    const error: any = new Error("Unauthorized role!");
    error.statusCode = HTTP_STATUS.FORBIDDEN;
    throw error;
  }

  if (requestedBranchId) {
    const filterId = new mongoose.Types.ObjectId(requestedBranchId);

    if (!allowedBranchIds.some((id) => id.equals(filterId))) {
      const error: any = new Error(
        "You are not authorized to view data for this branch!"
      );
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    return {
      user,
      allowedBranchIds: [filterId],
    };
  }

  return { user, allowedBranchIds };
};
