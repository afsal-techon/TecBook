import DEPARTMENT from "../../models/department";
import POSITION from "../../models/position";
import express, { NextFunction, Request, Response } from "express";
import USER from "../../models/user";
import BRANCH from "../../models/branch";
import { IDepartment, IEmployee } from "../../types/common.types";
import EMPLOYEE from "../../models/employee";
import mongoose from "mongoose";
import { imagekit } from "../../config/imageKit";

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

    for (const department of departments) {
      if (!department) {
        return res
          .status(400)
          .json({ message: "Department name is required!" });
      }
    }

    // 4️ Check duplicates in DB
    const departmentNames = departments.map((dept) => dept);

    const existingDepartments = await DEPARTMENT.find({
      branchId: { $in: branchIds },
      dept_name: { $in: departmentNames },
      isDeleted: false,
    }).collation({ locale: "en", strength: 2 });

    if (existingDepartments.length > 0) {
      existingDepartments.map((d) => d);
      return res.status(400).json({
        message: `The following departments already exist in one or more branches`,
      });
    }

    // 5️ Prepare bulk insert data
    const departmentData: Partial<IDepartment>[] = [];

    for (const branchId of branchIds) {
      for (const department of departments) {
        departmentData.push({
          branchId,
          dept_name: department.trim(),
          //   createdById: userId,
          isDeleted: false,
        });
      }
    }

    // 6️ Insert all at once
    await DEPARTMENT.insertMany(departmentData);

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
    const { branchId } = req.params;
    const userId = req.user?.id;

    // validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // validate branchId
    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
    }

    // pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // search term
    const search = ((req.query.search as string) || "").trim();

    // build query
    const query: any = {
      branchId: new mongoose.Types.ObjectId(branchId),
      isDeleted: false,
    };

    //  only add dept_name when search has content
    if (search.length > 0) {
      query.dept_name = { $regex: search, $options: "i" };
    }

    const totalCount = await DEPARTMENT.countDocuments(query);

    const departments = await DEPARTMENT.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ data: departments, totalCount, page, limit });
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
    const { departmentId, branchId, dept_name } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

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

    const branch = await BRANCH.findById(branchId);
    if (!branch) return res.status(400).json({ message: "Branch not found!" });

    const department = await DEPARTMENT.findOne({
      _id: departmentId,
      branchId,
    });
    if (!department) {
      return res.status(404).json({ message: "Department not found!" });
    }

    const existDepartment = await DEPARTMENT.findOne({
      branchId,
      dept_name: dept_name.trim(),
      isDeleted: false,
      _id: { $ne: departmentId }, // Exclude the current department
    });

    if (existDepartment) {
      return res.status(400).json({
        message: `The department already exists in the specified branch!`,
      });
    }

    if (department.dept_name === dept_name.trim()) {
      return res.status(400).json({
        message: "New department name is the same as the current name!",
      });
    }

    department.dept_name = dept_name.trim();
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
    const { branchId, departmentId, positions } = req.body;
    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }
    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required!" });
    }
    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ message: "Positions are required!" });
    }

    for (const position of positions) {
      if (
        !position ||
        typeof position !== "string" ||
        position.trim().length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Position name is required for each position!" });
      }
    }

    const positionNames = positions.map((position) =>
      position.trim().toLowerCase()
    );
    const existingPositions = await POSITION.find({
      departmentId,
      branchId,
      isDeleted: false,
      pos_name: { $in: positionNames }, // Case-insensitive match
    }).collation({ locale: "en", strength: 2 });

    if (existingPositions.length > 0) {
      return res.status(400).json({
        message: `The following position already exist in one or more branches!`,
      });
    }

    const positionData = positions.map((position) => ({
      pos_name: position.trim(),
      departmentId,
      branchId,
      createdById: user._id,
      // createdBy: user.name,
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
    const { branchId } = req.params;
    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Validate branch
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // Search
    const search = (req.query.search as string) || "";

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          isDeleted: false,
          ...(search ? { pos_name: { $regex: search, $options: "i" } } : {}),
        },
      },
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
        $project: {
          _id: 1,
          pos_name: "$pos_name",
          branchId: 1,
          departmentId: 1,
          departmentName: {
            $ifNull: ["$department.dept_name", "No Department"],
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
      {
        $project: {
          data: 1,
          totalCount: {
            $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
          },
        },
      },
    ];

    // Run aggregation
    const result = await POSITION.aggregate(pipeline);

    // Format response
    const response = {
      data: result[0]?.data || [],
      totalCount: result[0]?.totalCount || 0,
      page,
      limit,
    };

    return res.status(200).json(response);
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
    const { branchId, positionId, pos_name } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
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

    const position = await POSITION.findOne({ _id: positionId, branchId });
    if (!position) {
      return res.status(404).json({ message: "Position not found!" });
    }

    const existPosition = await POSITION.findOne({
      branchId,
      pos_name: pos_name.trim(),
      isDeleted: false,
      _id: { $ne: positionId },
    });

    if (existPosition) {
      return res.status(400).json({
        message: `The position already exists in the specified branch!`,
      });
    }

    if (position.pos_name === pos_name.trim()) {
      return res.status(400).json({
        message: "New position name is the same as the current name!",
      });
    }

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

    const position = await POSITION.findOne({ _id: positionId });
    if (!position) {
      return res.status(404).json({ message: "Position not found!" });
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
      qualification,
      fieldOfStudy,
      residentialAddress,
      gender,
      meritalStatus,
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

    if (email) {
      const exist = await EMPLOYEE.findOne({ email });
      if (exist) {
        return res.status(400).json({ message: "Email already exists!" });
      }
    }

    const existContact = await EMPLOYEE.findOne({ contactNo });
    if (existContact)
      return res
        .status(400)
        .json({ message: "Contact number is already exists!" });

    const employeeId = await generateUniqueEmployeeId();

    let uploadedDocuments: Array<{
      doc_name: string;
      doc_file: string;
      doc_type: string;
    }> = [];
    const documentsMetadata = req.body.metadata
      ? JSON.parse(req.body.metadata)
      : [];

    if (req.files && Array.isArray(req.files)) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        console.log(documentsMetadata, [i]);
        const meta = documentsMetadata[i] || {}; // fallback in case metadata missing

        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });

        uploadedDocuments.push({
          doc_name: meta.doc_name || file.originalname,
          doc_file: uploadResponse.url,
          doc_type: meta.doc_type || "unknown",
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
      qualification,
      fieldOfStudy,
      residentialAddress,
      gender,
      meritalStatus,
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
      fatherName,
      motherName,
      qualification,
      fieldOfStudy,
      residentialAddress,
      gender,
      meritalStatus,
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
      const exist = await EMPLOYEE.findOne({ email });
      if (exist)
        return res.status(400).json({ message: "Email already exists!" });
    }

    if (contactNo && contactNo !== employee.contactNo) {
      const existContact = await EMPLOYEE.findOne({ contactNo });
      if (existContact)
        return res
          .status(400)
          .json({ message: "Contact number already exists!" });
    }

    let uploadedDocuments: Array<{
      doc_name: string;
      doc_file: string;
      doc_type: string;
    }> = [];

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

        uploadedDocuments.push({
          doc_name: meta.doc_name || file.originalname || "",
          doc_file: uploadResponse.url || "",
          doc_type: meta.doc_type || "unknown",
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
    employee.meritalStatus = meritalStatus;
    employee.documents = uploadedDocuments;

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

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    // Validate branchId

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    console.log(req.query,'qer');
    

    // Search & filters
    const search = ((req.query.search as string) || "").trim();
    const branchId = req.query.branchId as string;
    const filterDepartmentName = req.query.departmentId as string; // dept_name from frontend
    const filterPositionName = req.query.positionId as string;
    const filterGender = ((req.query.gender as string) || "").trim();
    
    console.log(filterDepartmentName,'dept', filterPositionName,'pos')
    

    if (!branchId)
      return res.status(400).json({ message: "Branch Id is required!" });
    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
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
    ];

    // Search across employee fields + department + position
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
            { meritalStatus: { $regex: search, $options: "i" } },
            { empId: { $regex: search, $options: "i" } },
            { "department.dept_name": { $regex: search, $options: "i" } },
            { "position.pos_name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Department filter by name
    if (filterDepartmentName) {
      pipeline.push({
        $match: {
          "department.dept_name": {
            $regex: filterDepartmentName,
            $options: "i",
          },
        },
      });
    }

    // Position filter by name
    if (filterPositionName) {
      pipeline.push({
        $match: {
          "position.pos_name": { $regex: filterPositionName, $options: "i" },
        },
      });
    }

    if (filterGender) {
      pipeline.push({
        $match: { gender: { $regex: filterGender, $options: "i" } },
      });
    }
    
    

    // Count total documents after filters
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await EMPLOYEE.aggregate(countPipeline);

    console.log(countResult,'count')

    
    const totalCount = countResult[0]?.total || 0;

    // Pagination & sort
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Project to include dept_name & pos_name
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
        meritalStatus: 1,
        salary: 1,
        dateOfJoining: 1,
        documents: 1,
        dept_name: "$department.dept_name",
        pos_name: "$position.pos_name",
      },
    });

    const employees = await EMPLOYEE.aggregate(pipeline);

    console.log(employees,'employees');
    

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
