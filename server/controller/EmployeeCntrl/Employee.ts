import DEPARTMENT from "../../models/department";
import POSITION from "../../models/position";
import express, { NextFunction, Request, Response } from "express";
import USER from "../../models/user";
import BRANCH from "../../models/branch";
import { IDepartment, IDocumentType, IEmployee } from "../../types/common.types";
import EMPLOYEE from "../../models/employee";
import mongoose from "mongoose";
import { imagekit } from "../../config/imageKit";
import DOC_TYPE from '../../models/documentType'
import { Types } from "mongoose";





export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchIds, departments } = req.body;
    const userId = req.user?.id; //  assuming req.user is populated from auth middleware

    // 1️ Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // 2️ Validate branchIds
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({ message: "Branch IDs are required!" });
    }

    // 3️ Validate departments array
    if (
      !departments ||
      !Array.isArray(departments) ||
      departments.length === 0
    ) {
      return res.status(400).json({ message: "Departments are required!" });
    }
    
      const trimmedDepartments = departments.map((d) => d.trim());

     const existing = await DEPARTMENT.find({
      branchIds:{ $in: branchIds },
      dept_name: { $in: trimmedDepartments },
      isDeleted: false,
    }).collation({ locale: "en", strength: 2 });

    if (existing.length > 0) {
      const existingNames = existing.map((e) => e.dept_name);
      return res.status(400).json({
        message: `The following departments already exist: ${existingNames.join(", ")}`,
      });
    }

  const departmentDocs = trimmedDepartments.map((deptName) => ({
      dept_name: deptName,
      branchIds,
      createdById: userId,
      isDeleted: false,
    }));

   await DEPARTMENT.insertMany(departmentDocs);

    return res.status(201).json({
      message: "Departments created successfully!",
    });
  } catch (err) {
    next(err);
  }
};


export const getAllDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    //  Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const userRole = user.role; // e.g., "CompanyAdmin" or "User"
    const filterBranchId = req.query.branchId as string; // optional filter

    //  Pagination & Search
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    const search = ((req.query.search as string) || "").trim();

    //  Determine allowed branches
    let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      // Fetch all branches owned by this CompanyAdmin
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");
      

       allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      // Fetch the user's assigned branchId
      if (!user.branchId) {
        return res
          .status(400)
          .json({ message: "User is not assigned to any branch!" });
      }
      allowedBranchIds = [user.branchId];
     
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized role for this operation." });
    }

    // 🔹 If branchId is provided in query, filter within allowed branches
    if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);
      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message:
            "You are not authorized to view departments for this branch!",
        });
      }
      allowedBranchIds = [filterId];
    }

    //  Base match
    const matchStage: any = {
      isDeleted: false,
      branchIds: { $in: allowedBranchIds },
    };

    // 🔹 Search filter
    if (search) {
      matchStage.dept_name = { $regex: search, $options: "i" };
    }

    // 🔹 Aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "branches",
          localField: "branchIds",
          foreignField: "_id",
          as: "branches",
        },
      },
      {
        $project: {
          _id: 1,
          dept_name: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          branchIds: 1,
          branches: {
            _id: 1,
            branchName: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
  

    // 🔹 Count total (before pagination)
    const countPipeline = [{ $match: matchStage }, { $count: "totalCount" }];
    const countResult = await DEPARTMENT.aggregate(countPipeline);
    const totalCount = countResult[0]?.totalCount || 0;

    // 🔹 Execute query
    const departments = await DEPARTMENT.aggregate(pipeline);


    return res.status(200).json({
      data: departments,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};


export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { departmentId, branchIds, dept_name } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0)
      return res.status(400).json({ message: "Branch Ids are required!" });

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required!" });
    }
    if (
      !dept_name ||
      typeof dept_name !== "string" ||
      dept_name.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ message: "New department name is required!" });
    }

    // const branches = await BRANCH.find({ _id: { $in: branchIds } });
    //    if (branches.length !== branchIds.length)
    //   return res
    //     .status(400)
    //     .json({ message: "One or more branches not found!" });

    const department = await DEPARTMENT.findOne({
      _id: departmentId,
      isDeleted: false,
    });
    if (!department) {
      return res.status(404).json({ message: "Department not found!" });
    }

      const duplicate = await DEPARTMENT.findOne({
      _id: { $ne: departmentId },
      branchIds: { $in: branchIds },
      dept_name: dept_name.trim(),
      isDeleted: false,
    }).collation({ locale: "en", strength: 2 });

    if (duplicate) {
      return res
        .status(400)
        .json({ message:"The department already exists!" });
    }

    // if (department.dept_name === dept_name.trim()) {
    //   return res.status(400).json({
    //     message: "New department name is the same as the current name!",
    //   });
    // }

    department.dept_name = dept_name.trim();
    department.branchIds = branchIds;
    await department.save();

    return res.status(200).json({
      message: "Department updated successfully!",
      data: department,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { departmentId } = req.params;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required!" });
    }

    const department = await DEPARTMENT.findOne({ _id: departmentId });
    if (!department) {
      return res.status(404).json({ message: "Department not found!" });
    }

        const positionExists = await POSITION.findOne({
      departmentId: departmentId,
      isDeleted: false,
    });

    if (positionExists) {
      return res.status(400).json({
        message: "This department currently linked to position. Please remove position before deleting.",
      });
    }


    await DEPARTMENT.findByIdAndUpdate(departmentId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      deletedBy: user.username,
    });

    return res.status(200).json({
      message: "Department deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};



//positino
export const createPosition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {  departmentId, positions } = req.body;
    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required!" });
    }
    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ message: "Positions are required!" });
    }

        // Validate department
    const department = await DEPARTMENT.findOne({
      _id: departmentId,
      isDeleted: false,
    });

     if (!department) {
      return res.status(400).json({ message: "Department not found!" });
    }

      if (!department.branchIds || department.branchIds.length === 0) {
      return res.status(400).json({
        message:
          "This department has no assigned branches. Please assign branches first.",
      });
    }

    const positionNames = positions.map((p) => p.trim().toLowerCase());
    const existingPositions = await POSITION.find({
      departmentId,
      pos_name: { $in: positionNames },
      isDeleted: false,
    }).collation({ locale: "en", strength: 2 });


   if (existingPositions.length > 0)
      return res.status(400).json({ message: "Positions already exist under this department!" });

    const positionData = positions.map((pos) => ({
      pos_name: pos.trim(),
      departmentId,
      branchIds: department.branchIds, 
      createdById: user._id,
    }));

    const createdPositions = await POSITION.insertMany(positionData);

    return res.status(200).json({
      message: "Positions added successfully!",
      data: createdPositions,
    });
  } catch (err) {
    next(err);
  }
};

export const getALLPosition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {

    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // Search
    const search = (req.query.search as string) || "";
    const dept_name = (req.query.dept_name as string) || "";

     const userRole = user.role; // e.g., "CompanyAdmin" or "User"
    const filterBranchId = req.query.branchId as string;
    const filterDepartmentId = req.query.departmentId as string;

         let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      // Fetch all branches owned by this CompanyAdmin
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");
      

       allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      // Fetch the user's assigned branchId
      if (!user.branchId) {
        return res
          .status(400)
          .json({ message: "User is not assigned to any branch!" });
      }
      allowedBranchIds = [user.branchId];
     
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized role for this operation." });
    }

        //  If branchId is provided in query, filter within allowed branches
    if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);
      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message:
            "You are not authorized to view departments for this branch!",
        });
      }
      allowedBranchIds = [filterId];
    }

        const matchStage: any = {
      isDeleted: false,
      branchIds: { $in: allowedBranchIds },
    };

     if (search) {
      matchStage.pos_name = { $regex: search, $options: "i" };
    }
     if (filterDepartmentId) {
      matchStage.departmentId = new mongoose.Types.ObjectId(filterDepartmentId);
    }

        const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branchIds",
          foreignField: "_id",
          as: "branches",
        },
      },
      {
        $project: {
          _id: 1,
          pos_name: 1,
          departmentId: 1,
          departmentName: {
            $ifNull: ["$department.dept_name", "No Department"],
          },
          branchIds: 1,
          branches: {
            _id: 1,
            branchName: 1,
          },
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];


     const countPipeline = [{ $match: matchStage }, { $count: "totalCount" }];
    const countResult = await POSITION.aggregate(countPipeline);
    const totalCount = countResult[0]?.totalCount || 0;

    //  Execute query
    const positions = await POSITION.aggregate(pipeline);

    // Format response
      return res.status(200).json({
      data: positions,
      totalCount,
      page,
      limit,
    });

  } catch (err) {
    next(err);
  }
};

export const updatePosition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
   const { positionId, pos_name } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!positionId) {
      return res.status(400).json({ message: "Position ID is required!" });
    }
    if (
      !pos_name ||
      typeof pos_name !== "string" ||
      pos_name.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ message: "New Position name is required!" });
    }

    const position = await POSITION.findOne({ _id: positionId, isDeleted: false });
    if (!position) {
      return res.status(404).json({ message: "Position not found!" });
    }

    const existingPosition = await POSITION.findOne({
      departmentId: position.departmentId,
      pos_name: { $regex: `^${pos_name.trim()}$`, $options: "i" },
      isDeleted: false,
      _id: { $ne: positionId },
    }).collation({ locale: "en", strength: 2 });

       if (existingPosition) {
      return res.status(400).json({
        message: "Position already exists in the same department!",
      });
    }


    // if (position.pos_name === pos_name.trim()) {
    //   return res.status(400).json({
    //     message: "New position name is the same as the current name!",
    //   });
    // }

    position.pos_name = pos_name.trim();
    await position.save();

    return res.status(200).json({
      message: "Position updated successfully!",
    });
  } catch (err) {
    next(err);
  }
};

export const deletePosition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { positionId } = req.params;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }
    if (!positionId) {
      return res.status(400).json({ message: "Position ID is required!" });
    }

    const position = await POSITION.findOne({ _id: positionId,isDeleted: false });
    if (!position) {
      return res.status(404).json({ message: "Position not found!" });
    }
        if (position.departmentId) {
      const department = await DEPARTMENT.findOne({
        _id: position.departmentId,
        isDeleted: false,
      });

      if (department) {
        return res.status(400).json({
          message: `This position currently linked to department. Please remove department before deleting.`,
        });
      }
    }

    await POSITION.findByIdAndUpdate(positionId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Position deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};

export const generateUniqueEmployeeId = async (): Promise<number> => {
  let uniqueId = 0;
  let exists = true;

  while (exists) {
    uniqueId = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const existing = await EMPLOYEE.findOne({ empId: uniqueId }).lean();
    exists = !!existing; // convert to boolean
  }

  return uniqueId;
};



//employee
export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      positionId,
      departmentId,
      salary,
      dateOfJoining,
      firstName,
      lastName,
      contactNo,
      contactNo2,
      email,
      nationality,
      fatherName,
      motherName,
      dateOfBirth,
      qualification,
      fieldOfStudy,
      residentialAddress,
      gender,
      maritalStatus,
    } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    if (!positionId) {
      return res.status(400).json({ message: "Position is required!" });
    }
    if (!departmentId) {
      return res.status(400).json({ message: "Department is required!" });
    }
    if (!firstName) {
      return res.status(400).json({ message: "First name is required!" });
    }

    if (!dateOfJoining) {
      return res.status(400).json({ message: "Date of joining is required!" });
    }
    if (!contactNo) {
      return res.status(400).json({ message: "Contact number is required!" });
    }

    if (!gender) {
      return res.status(400).json({ message: "Gender is required!" });
    }
    
    if (!dateOfBirth) {
      return res.status(400).json({ message: "dob is required!" });
    }

    if (email) {
      const exist = await EMPLOYEE.findOne({ email ,branchId,isDeleted:false });
      if (exist) {
        return res.status(400).json({ message: "Email already exists!" });
      }
    }

    const existContact = await EMPLOYEE.findOne({ contactNo,branchId ,isDeleted:false });
    if (existContact)
      return res
        .status(400)
        .json({ message: "Phone number is already exists!" });

    const employeeId = await generateUniqueEmployeeId();

    let uploadedDocuments: Array<{
      doc_name: string;
      doc_file: string;
      doc_typeId: Types.ObjectId | null;
      startDate:Date | null;
      endDate:Date | null;
    }> = [];
    const documentsMetadata = req.body.metadata
      ? JSON.parse(req.body.metadata)
      : [];

    if (req.files && Array.isArray(req.files)) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const meta = documentsMetadata[i] || {}; // fallback in case metadata missing

        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });

        uploadedDocuments.push({
          doc_name: meta.doc_name || file.originalname,
          doc_file: uploadResponse.url,
          doc_typeId: meta.doc_typeId ? new Types.ObjectId(meta.doc_typeId) : null,
          startDate:meta.startDate,
          endDate: meta.endDate,
        });
      }
    }

    await EMPLOYEE.create({
      branchId,
      positionId,
      departmentId,
      empId: employeeId,
      salary,
      dateOfJoining,
      firstName,
      lastName,
      contactNo,
      contactNo2,
      email,
      nationality,
      fatherName,
      motherName,
      dateOfBirth,
      qualification,
      fieldOfStudy,
      residentialAddress,
      gender,
      maritalStatus,
      documents: uploadedDocuments,
    });

    return res.status(200).json({ message: "Employee created successfully" });
  } catch (err) {
    next(err);
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      employeeId,
      branchId,
      positionId,
      departmentId,
      salary,
      dateOfJoining,
      firstName,
      lastName,
      contactNo,
      contactNo2,
      email,
      nationality,
      dateOfBirth,
      fatherName,
      motherName,
      qualification,
      fieldOfStudy,
      residentialAddress,
      gender,
      maritalStatus,
      existingDocuments,
    } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required!" });
    }

    const employee = await EMPLOYEE.findById(employeeId);
    if (!employee)
      return res.status(400).json({ message: "Employee not found!" });

    //  Validate required fields
    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });
    if (!positionId)
      return res.status(400).json({ message: "Position is required!" });
    if (!departmentId)
      return res.status(400).json({ message: "Department is required!" });
    if (!firstName)
      return res.status(400).json({ message: "First name is required!" });
    if (!dateOfJoining)
      return res.status(400).json({ message: "Date of joining is required!" });
    if (!contactNo)
      return res.status(400).json({ message: "Contact number is required!" });
    if (!gender)
      return res.status(400).json({ message: "Gender is required!" });

    //  Check unique email/contact
    if (email && email !== employee.email) {
      const exist = await EMPLOYEE.findOne({ email,isDeleted:false,branchId });
      if (exist)
        return res.status(400).json({ message: "Email already exists!" });
    }

    if (contactNo && contactNo !== employee.contactNo) {
      const existContact = await EMPLOYEE.findOne({ contactNo,branchId ,isDeleted:false });
      if (existContact)
        return res
          .status(400)
          .json({ message: "Phone number already exists!" });
    }


    let finalDocuments: Array<{
      doc_name: string;
      doc_file: string;
      doc_typeId: Types.ObjectId | null;
      startDate:Date | null;
      endDate:Date | null;
    }> = [];

        if (existingDocuments) {
      // front-end sends existingDocuments as JSON string
      const parsedExistingDocs = Array.isArray(existingDocuments)
        ? existingDocuments
        : JSON.parse(existingDocuments);

      finalDocuments = parsedExistingDocs.map((doc:any) => ({
        doc_name: doc.doc_name,
        doc_file: doc.doc_file,
        doc_typeId: doc.doc_typeId ? new Types.ObjectId(doc.doc_typeId) : null,
        startDate:doc.startDate,
        endDate:doc.endDate,
      }));
    }



    const documentsMetadata = req.body.metadata
      ? JSON.parse(req.body.metadata)
      : [];

    if (req.files && Array.isArray(req.files)) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const meta = documentsMetadata[i] || {};



        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });




        finalDocuments.push({
          doc_name: meta.doc_name || file.originalname || "",
          doc_file: uploadResponse.url || "",
          doc_typeId: meta.doc_typeId ? new Types.ObjectId(meta.doc_typeId) : null,
           startDate:meta.startDate,
           endDate:meta.endDate,
        });
      }
    }

    //  Update employee
    employee.branchId = branchId;
    employee.positionId = positionId;
    employee.departmentId = departmentId;
    employee.salary = salary;
    employee.dateOfJoining = dateOfJoining;
    employee.firstName = firstName;
    employee.lastName = lastName;
    employee.contactNo = contactNo;
    employee.contactNo2 = contactNo2;
    employee.email = email;
    employee.nationality = nationality;
    employee.fatherName = fatherName;
    employee.motherName = motherName;
    employee.qualification = qualification;
    employee.fieldOfStudy = fieldOfStudy;
    employee.residentialAddress = residentialAddress;
    employee.gender = gender;
    employee.dateOfBirth = dateOfBirth;
    employee.maritalStatus = maritalStatus;
    employee.documents = finalDocuments

    await employee.save();

    return res.status(200).json({ message: "Employee updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    // 🔹 Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const userRole = user.role; // "CompanyAdmin" or "User"
    const filterBranchId = req.query.branchId as string; // optional
    const search = ((req.query.search as string) || "").trim();
    const filterDepartmentName = req.query.departmentId as string; 
    const filterPositionName = req.query.positionId as string;
    const filterGender = ((req.query.gender as string) || "").trim();

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // 🔹 Determine allowed branches
    let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      // Fetch all branches owned by the CompanyAdmin
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");
      allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      if (!user.branchId) {
        return res
          .status(400)
          .json({ message: "User is not assigned to any branch!" });
      }
      allowedBranchIds = [user.branchId];
    } else {
      return res.status(403).json({ message: "Unauthorized role!" });
    }

    // 🔹 Apply branch filter if passed
    if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);
      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message: "You are not authorized to view employees for this branch!",
        });
      }
      allowedBranchIds = [filterId];
    }

    // 🔹 Build pipeline
    const pipeline: any[] = [
      {
        $match: {
          branchId: { $in: allowedBranchIds },
          isDeleted: false,
        },
      },
      // Join Department
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },

      // Join Position
      {
        $lookup: {
          from: "positions",
          localField: "positionId",
          foreignField: "_id",
          as: "position",
        },
      },
      { $unwind: { path: "$position", preserveNullAndEmptyArrays: true } },

      // Join Document Types
      {
        $lookup: {
          from: "documenttypes",
          localField: "documents.doc_typeId",
          foreignField: "_id",
          as: "docTypeDetails",
        },
      },
      {
        $addFields: {
          documents: {
            $map: {
              input: "$documents",
              as: "doc",
              in: {
                doc_name: "$$doc.doc_name",
                doc_file: "$$doc.doc_file",
                doc_typeId: "$$doc.doc_typeId",
                doc_type: {
                  $let: {
                    vars: {
                      matched: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$docTypeDetails",
                              as: "d",
                              cond: { $eq: ["$$d._id", "$$doc.doc_typeId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$matched.doc_type",
                  },
                },
              },
            },
          },
        },
      },
      { $unset: "docTypeDetails" },
    ];

    // 🔹 Filters
    if (search.length > 0) {
      pipeline.push({
        $match: {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { contactNo: { $regex: search, $options: "i" } },
            { contactNo2: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { nationality: { $regex: search, $options: "i" } },
            { fatherName: { $regex: search, $options: "i" } },
            { motherName: { $regex: search, $options: "i" } },
            { qualification: { $regex: search, $options: "i" } },
            { fieldOfStudy: { $regex: search, $options: "i" } },
            { gender: { $regex: search, $options: "i" } },
            { maritalStatus: { $regex: search, $options: "i" } },
            { empId: { $regex: search, $options: "i" } },
            { "department.dept_name": { $regex: search, $options: "i" } },
            { "position.pos_name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    if (filterDepartmentName) {
      pipeline.push({
        $match: {
          "department._id": new mongoose.Types.ObjectId(filterDepartmentName),
        },
      });
    }

    if (filterPositionName) {
      pipeline.push({
        $match: {
          "position._id": new mongoose.Types.ObjectId(filterPositionName),
        },
      });
    }

    if (filterGender) {
      pipeline.push({
        $match: { gender: { $regex: filterGender, $options: "i" } },
      });
    }

    // 🔹 Count total after filters
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await EMPLOYEE.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // 🔹 Pagination & projection
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    pipeline.push({
      $project: {
        firstName: 1,
        lastName: 1,
        empId: 1,
        contactNo: 1,
        contactNo2: 1,
        email: 1,
        nationality: 1,
        fatherName: 1,
        motherName: 1,
        qualification: 1,
        fieldOfStudy: 1,
        residentialAddress: 1,
        gender: 1,
        maritalStatus: 1,
        salary: 1,
        dateOfBirth: 1,
        dateOfJoining: 1,
        documents: 1,
        branchId: 1,
        dept_name: "$department.dept_name",
        pos_name: "$position.pos_name",
        departmentId: "$department._id",
        positionId: "$position._id",
      },
    });

    //  Execute
    const employees = await EMPLOYEE.aggregate(pipeline);

    return res.status(200).json({
      data: employees,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};


export const deleteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { employeeId }  =req.params;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

     if (!employeeId) {
      return res.status(400).json({ message: "Employee Id is required!" });
    }

    const employee = await EMPLOYEE.findOne({ _id: employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found!" });
    }


  

    await EMPLOYEE.findByIdAndUpdate(employeeId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Position deleted successfully!",
    });
    

  } catch (err) {
    next(err);
  }
};


//docuement type 
export const createDocumentType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchIds, documents } = req.body;
    const userId = req.user?.id; //  assuming req.user is populated from auth middleware

    // 1️ Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // 2️ Validate branchIds
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({ message: "Branch IDs are required!" });
    }

    // 3️ Validate departments array
    if (
      !documents ||
      !Array.isArray(documents) ||
      documents.length === 0
    ) {
      return res.status(400).json({ message: "Documents are required!" });
    }

    // 4️ Check duplicates in DB
    const documentNames = documents.map((dept) => dept.trim());

    const existDocuments = await DOC_TYPE.find({
      branchIds: { $in: branchIds },
      doc_type: { $in: documentNames },
      isDeleted: false,
    }).collation({ locale: "en", strength: 2 });

    if (existDocuments.length > 0) {
     const existingNames =  existDocuments.map((d) => d.doc_type);
      return res.status(400).json({
        message: `The following document type already exist:  ${existingNames.join(", ")}`,
      });
    }


    const docuementData = documentNames.map((doc)=>({
      doc_type: doc,
      branchIds,
      createdById: userId,
      isDeleted: false,
    }))

    // 6️ Insert all at once
    await DOC_TYPE.insertMany(docuementData);

    return res.status(201).json({
      message: "Document type created successfully!",
    });
  } catch (err) {
    next(err);
  }
};

export const getAllDocumentTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const filterBranchId = req.query.branchId as string
    const userId = req.user?.id;

    // validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const userRole = user.role; 

    // pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // search term
    const search = ((req.query.search as string) || "").trim();

        let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      // Fetch all branches owned by this CompanyAdmin
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");
      

       allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      // Fetch the user's assigned branchId
      if (!user.branchId) {
        return res
          .status(400)
          .json({ message: "User is not assigned to any branch!" });
      }
      allowedBranchIds = [user.branchId];
     
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized role for this operation." });
    }

        if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);
      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message:
            "You are not authorized to view doc type for this branch!",
        });
      }
      allowedBranchIds = [filterId];
    }


    // build query
   const matchStage: any = {
      isDeleted: false,
      branchIds: { $in: allowedBranchIds },
    };

    //  only add dept_name when search has content
    if (search.length > 0) {
      matchStage.doc_type = { $regex: search, $options: "i" };
    }

        const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "branches",
          localField: "branchIds",
          foreignField: "_id",
          as: "branches",
        },
      },
      {
        $project: {
          _id: 1,
          doc_type: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          branchIds: 1,
          branches: {
            _id: 1,
            branchName: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

        const countPipeline = [{ $match: matchStage }, { $count: "totalCount" }];
    const countResult = await DOC_TYPE.aggregate(countPipeline);
    const totalCount = countResult[0]?.totalCount || 0;

     const docs = await DOC_TYPE.aggregate(pipeline);


    return res.status(200).json({
      data: docs,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};


export const updateDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { documentId, branchIds, doc_type } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

 if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0)
      return res.status(400).json({ message: "Branch Ids are required!" });

    if (!documentId) {
      return res.status(400).json({ message: "Document Id is required!" });
    }
    if (
      !doc_type ||
      typeof doc_type !== "string" ||
      doc_type.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ message: "New document type is required!" });
    }

    const branches = await BRANCH.find({ _id: { $in: branchIds } });



    const document = await DOC_TYPE.findOne({
      _id: documentId,
         isDeleted: false,
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found!" });
    }

    const existDocument = await DOC_TYPE.findOne({
       _id: { $ne: documentId },
     branchIds: { $in: branchIds },
      doc_type: doc_type.trim(),
      isDeleted: false,
    });

    if (existDocument) {
      return res.status(400).json({
        message: `The document type already exists!`,
      });
    }

    // if (document.doc_type === doc_type.trim()) {
    //   return res.status(400).json({
    //     message: "New document type is the same as the current type!",
    //   });
    // }

    document.doc_type = doc_type.trim();
    document.branchIds = branchIds;
    await document.save();

    return res.status(200).json({
      message: "document type updated successfully!",
      data: document,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDocumentType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { documentId } = req.params;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!documentId) {
      return res.status(400).json({ message: "document type Id is required!" });
    }

    const document = await DOC_TYPE.findOne({ _id: documentId });
    if (!document) {
      return res.status(404).json({ message: "document type not found!" });
    }

    await DOC_TYPE.findByIdAndUpdate(documentId, {
      isDeleted: true,
      deletedAt: new Date(),
      // deletedById: user._id,
      deletedBy: user.username,
    });

    return res.status(200).json({
      message: "Document type deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};




