import DEPARTMENT from "../../models/department";
import POSITION from "../../models/position";
import express, { NextFunction, Request, Response } from "express";
import USER from "../../models/user";
import BRANCH from "../../models/branch";
import { IDepartment } from "../../types/common.types";
import mongoose from "mongoose";

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
      if (!department.dept_name) {
        return res
          .status(400)
          .json({ message: "Department name is required!" });
      }
    }

    // 4️ Check duplicates in DB
    const departmentNames = departments.map((dept) =>
      dept.dept_name.trim().toLowerCase()
    );

    const existingDepartments = await DEPARTMENT.find({
      branchId: { $in: branchIds },
      dept_name: { $in: departmentNames },
      isDeleted: false,
    }).collation({ locale: "en", strength: 2 });

    if (existingDepartments.length > 0) {
      const duplicateNames = existingDepartments.map((d) => d.dept_name);
      return res.status(400).json({
        message: `The following departments already exist in one or more branches: ${duplicateNames.join(
          ", "
        )}`,
      });
    }

    // 5️ Prepare bulk insert data
    const departmentData: Partial<IDepartment>[] = [];

    for (const branchId of branchIds) {
      for (const department of departments) {
        departmentData.push({
          branchId,
          dept_name: department.dept_name.trim(),
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

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
    }

    //pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";

    // Build query
    const query: any = { branchId, isDeleted: false };
    if (search) {
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
        !position.pos_name ||
        typeof position.pos_name !== "string" ||
        position.pos_name.trim().length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Position name is required for each position!" });
      }
    }

    const positionNames = positions.map((position) =>
      position.pos_name.trim().toLowerCase()
    );
    const existingPositions = await POSITION.find({
      departmentId,
      branchId,
      isDeleted: false,
      pos_name: { $in: positionNames }, // Case-insensitive match
    }).collation({ locale: "en", strength: 2 });

    if (existingPositions.length > 0) {
      const duplicateNames = existingPositions.map(
        (position) => position.pos_name
      );
      return res.status(400).json({
        message: `The following position already exist in one or more branches: ${duplicateNames.join(
          ", "
        )}`,
      });
    }

    const positionData = positions.map((position) => ({
      pos_name: position.pos_name.trim(),
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
          positionName: "$pos_name",
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
      return res
        .status(400)
        .json({
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
