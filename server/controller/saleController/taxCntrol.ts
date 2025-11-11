import TAX from '../../models/tax';
import USER from '../../models/user'
import { Request, Response, NextFunction } from "express";




export const createTax = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      name,
      type,
      cgstRate,
      sgstRate,
      vatRate,
      description,
    } = req.body;

    const userId = req.user?.id;

    // 1 Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    // 2️ Validate input
     if(!name){
        return res.status(400).json({ message:"Tax name is required!"})
     }
       if(!type){
        return res.status(400).json({ message:"Tax type is required!"})
     }
    // 3️ Validate tax type logic
    if (type === "GST" && (cgstRate == null || sgstRate == null)) {
      return res
        .status(400)
        .json({ message: "CGST and SGST rates are required for GST type!" });
    }
    if (type === "VAT" && vatRate == null) {
      return res.status(400).json({ message: "VAT rate is required for VAT type!" });
    }

    // 4️ Prevent duplicate (same name under same branch)
    const existingTax = await TAX.findOne({
      branchId,
      name: { $regex: `^${name}$`, $options: "i" },
      isActive: true,
    });
    if (existingTax)
      return res.status(400).json({ message: `Tax '${name}' already exists!` });

    // 5️ Create new tax
    const newTax = new TAX({
      branchId,
      name,
      type,
      cgstRate: type === "GST" ? cgstRate : null,
      sgstRate: type === "GST" ? sgstRate : null,
      vatRate: type === "VAT" ? vatRate : null,
      description,
      createdById: userId,
    });

    await newTax.save();

    return res.status(201).json({
      message: "Tax created successfully!",
      data: newTax,
    });
  } catch (err) {
    next(err);
  }
};



export const getAllTaxes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {

    const { branchId } = req.query;

        const taxes = await TAX.find({
      branchId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      data: taxes,
    });

  } catch (err) {
    next(err);
  }
};



export const updateTax = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const taxId = req.params.id; // tax ID from URL
    const {
      branchId,
      name,
      type,
      cgstRate,
      sgstRate,
      vatRate,
      description,
    //   isActive,
    } = req.body;

    const userId = req.user?.id;

    // 1️ Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    // 2️ Validate tax existence
    const existingTax = await TAX.findOne({ _id: taxId, isDeleted: false });
    if (!existingTax)
      return res.status(404).json({ message: "Tax record not found!" });

    // 3️ Prevent duplicate name in same branch (excluding current)
    if (name) {
      const duplicateTax = await TAX.findOne({
        _id: { $ne: taxId },
        branchId,
        name: { $regex: `^${name}$`, $options: "i" },
        // isActive: true,
      });
      if (duplicateTax) {
        return res.status(400).json({
          message: `Another tax with name '${name}' already exists!`,
        });
      }
    }

    // 4️ Validate type-specific fields
    if (type === "GST") {
      if (cgstRate == null || sgstRate == null) {
        return res.status(400).json({
          message: "CGST and SGST rates are required for GST type!",
        });
      }
    }

    if (type === "VAT") {
      if (vatRate == null) {
        return res
          .status(400)
          .json({ message: "VAT rate is required for VAT type!" });
      }
    }

    // 5️ Prepare update data
    const updateData: any = {
      branchId,
      name,
      type,
      cgstRate: type === "GST" ? cgstRate : null,
      sgstRate: type === "GST" ? sgstRate : null,
      vatRate: type === "VAT" ? vatRate : null,
      description,
    //   isActive,
      updatedById: userId,
      updatedAt: new Date(),
    };

    // Remove undefined/null fields (to allow partial updates)
    // Object.keys(updateData).forEach(
    //   (key) => updateData[key] === undefined && delete updateData[key]
    // );

    // 6️ Update document
    const updatedTax = await TAX.findByIdAndUpdate(taxId, updateData, {
      new: true,
    });

    // 7️ Response
    return res.status(200).json({
      message: "Tax updated successfully!",
      data: updatedTax,
    });
  } catch (err) {
    next(err);
  }
};



export const deleteTax = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { taxId }  =req.params;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

     if (!taxId) {
      return res.status(400).json({ message: "Tax Id is required!" });
    }

    const tax = await TAX.findOne({ _id: taxId });
    if (!tax) {
      return res.status(404).json({ message: "Tax not found!" });
    }
  

    await TAX.findByIdAndUpdate(taxId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Tax deleted successfully!",
    });
    

  } catch (err) {
    next(err);
  }
};


