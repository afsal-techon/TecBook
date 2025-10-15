import DEPARTMENT from "../../models/department";
import POSITION from "../../models/position";
import express, { NextFunction, Request, Response } from "express";
import USER from "../../models/user";
import BRANCH from "../../models/branch";
import { IDepartment } from "../../types/common.types";

export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchIds, departments } = req.body;
    const userId = req.user?.id; // ✅ assuming req.user is populated from auth middleware

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
  const { branchId } = req.params;

  const userId = req.user?.id;

  const user = await USER.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    return res.status(400).json({ message: "User not found!" });
  }

  if (!branchId) {
    return res.status(400).json({ message: "Branch Id is required!" });
  }

  const departments = await DEPARTMENT.find({
    branchId,
    isDeleted: false,
  }).sort({ createdAt: -1 });
  return res.status(200).json({ data: departments });
};

export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
    
};
