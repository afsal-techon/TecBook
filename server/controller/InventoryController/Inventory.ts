import CATEGORY from '../../models/category'
import express, { Response,Request,NextFunction} from 'express';
import USER from '../../models/user'
import { ICategory } from '../../types/common.types';
import mongoose from 'mongoose';
import BRANCH from '../../models/branch'

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchIds, categories } = req.body;
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

    //  Validate departments array
    if (
      !categories ||
      !Array.isArray(categories) ||
      categories.length === 0
    ) {
      return res.status(400).json({ message: "Categories are required!" });
    }

    for (const category of categories) {
      if (!category) {
        return res
          .status(400)
          .json({ message: "Category name is required!" });
      }
    }

    // 4️ Check duplicates in DB
    const categoryNames = categories.map((dept) => dept);

    const existCategories = await CATEGORY.find({
      branchId: { $in: branchIds },
      name: { $in: categoryNames },
      isDeleted: false,
    }).collation({ locale: "en", strength: 2 });

    if (existCategories.length > 0) {
      existCategories.map((d) => d);
      return res.status(400).json({
        message: `The following categories already exist in one or more branches`,
      });
    }

    // 5️ Prepare bulk insert data
    const categoryData: Partial<ICategory>[] = [];

    for (const branchId of branchIds) {
      for (const category of categories) {
        categoryData.push({
          branchId,
          name: category.trim(),
          //   createdById: userId,
          isDeleted: false,
        });
      }
    }

    // 6️ Insert all at once
    await CATEGORY.insertMany(categoryData);

    return res.status(201).json({
      message: "Categories created successfully!",
    });
  } catch (err) {
    next(err);
  }
};


export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const  branchId  = req.query.branchId as string
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
      query.name = { $regex: search, $options: "i" };
    }

    const totalCount = await CATEGORY.countDocuments(query);

    const categories = await CATEGORY.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ data: categories, totalCount, page, limit });
  } catch (err) {
    next(err);
  }
};


export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { categoryId, branchId, name } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    if (!categoryId) {
      return res.status(400).json({ message: "Category Id is required!" });
    }
    if (
      !name ||
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ message: "New category name is required!" });
    }

    const branch = await BRANCH.findById(branchId);
    if (!branch) return res.status(400).json({ message: "Branch not found!" });

    const category = await CATEGORY.findOne({
      _id: categoryId,
      branchId,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    const existCategory = await CATEGORY.findOne({
      branchId,
      name: name.trim(),
      isDeleted: false,
      _id: { $ne: categoryId }, // Exclude the current department
    });

    if (existCategory) {
      return res.status(400).json({
        message: `The category already exists in the specified branch!`,
      });
    }

    if (category.name === name.trim()) {
      return res.status(400).json({
        message: "New category name is the same as the current name!",
      });
    }

    category.name = name.trim();
    await category.save();

    return res.status(200).json({
      message: "Category updated successfully!",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};



export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { categoryId } = req.params;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!categoryId) {
      return res.status(400).json({ message: "Category Id is required!" });
    }

    const category = await CATEGORY.findOne({ _id: categoryId });
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    await CATEGORY.findByIdAndUpdate(categoryId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      deletedBy: user.username,
    });

    return res.status(200).json({
      message: "Category deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};