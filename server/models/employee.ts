import mongoose, { Schema, Model, mongo } from "mongoose";
import { IEmployee } from "../types/common.types";

const EmployeeSchema = new Schema<IEmployee>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    positionId: { type: Schema.Types.ObjectId, ref: "Position", default: null },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    empId: { type: String, default: null },

    salary: { type: Number, default: 0 },
    dateOfJoining: { type: String, required: true },

    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    contactNo2: { type: String, default: null },
    nationality: { type: String, default: null },
    motherName: { type: String, default: null },
    fieldOfStudy: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    residentialAddress: { type: String, default: null },
    gender: { type: String, default: null },
    contactNo: { type: String, default: null },
    email: { type: String, default: null },
    fatherName: { type: String, default: null },
    qualification: { type: String, default: null },
    maritalStatus: { type: String, default: null },

    //  documents field (array of name + file)
    documents: [
      {
        doc_name: { type: String, default: null },
        doc_file: { type: String, default: null },
        doc_typeId: {
          type: Schema.Types.ObjectId,
          ref: "DocumentType",
          default: null,
        },
        startDate :{ type:Date, default:null},
        endDate:{ type:Date,default:null}
      },
    ],
    isDeleted: { type: Boolean, default: false },
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
