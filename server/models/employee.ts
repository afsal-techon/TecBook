import mongoose, { Schema, Model, mongo } from "mongoose";
import { IEmployee } from "../types/common.types";

const EmployeeSchema = new Schema<IEmployee>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    position: { type: Schema.Types.ObjectId, ref: "Position", default: null },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    salary: { type: Number, default: 0 },
    dateOfJoining: { type: String, required: true },

    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    contactNo2: { type: String, default: null },
    nationality: { type: String, default: null },
    motherName: { type: String, default: null },
    fieldOfStudy: { type: String, default: null },
    residentialAddress: { type: String, default: null },
    gender: { type: Number, default: null },
    contactNo: { type: String, default:null},
    email: { type: String, default: null },
    fatherName: { type: String, default: null },
    qualification: { type: String, default: null },
    meritalStatsu: { type: String, default: null },

    // 👇 documents field (array of name + file)
    documents: [
      {
        name: { type: String, default: null },
        file: { type: String, default: null },
      },
    ],

    deletedAt: { type: Date, default: null },
    deletedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deletedBy: { type: String, default: null },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
  }
);

EmployeeSchema.index({ branchId: 1, department: 1 });
EmployeeSchema.index({ branchId: 1, position: 1 });
EmployeeSchema.index({ firstName: 1, lastName: 1 });
EmployeeSchema.index({ email: 1 });


const employeeModel: Model<IEmployee> = mongoose.model<IEmployee>(
  "Employee",
  EmployeeSchema
);

export default employeeModel;