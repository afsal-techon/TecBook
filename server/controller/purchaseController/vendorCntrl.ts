import VENDOR from '../../models/vendor'
import express , {Request,Response,NextFunction} from 'express'
import { IVendor } from '../../types/common.types';
import USER from '../../models/user'
import { Types } from "mongoose";



export const CreateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      name,
      phone,
      note,
      openingBalance,
      billingInfo,
      shippingInfo,
      taxTreatment,
      trn,
      placeOfSupplay,

    } = req.body as IVendor

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    if (!name) {
      return res.status(400).json({ message: "Name is required!" });
    }
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required!" });
    }
    if (!billingInfo) {
      return res.status(400).json({ message: "Billing address is required!" });
    }

    if (!shippingInfo) {
      return res.status(400).json({ message: "Shipping address is required!" });
    }
    if (!taxTreatment) {
      return res.status(400).json({ message: "Tax treatment is required!" });
    }

    // if (!trn) {
    //   return res.status(400).json({ message: "trn is required!" });
    // }
    
    // if (!placeOfSupplay) {
    //   return res.status(400).json({ message: "Place of supplay required!" });
    // }

    const existContact = await VENDOR.findOne({ phone , branchId ,isDeleted:false });
    if (existContact)
      return res
        .status(400)
        .json({ message: "Phone number is already exists!" });


    await VENDOR.create({
        branchId,
        name,
        phone,
        openingBalance,
        billingInfo,
        shippingInfo,
        taxTreatment,
        trn,
        note,
        placeOfSupplay,
        createdById:user._id
    });

    return res.status(200).json({ message: "Vendor created successfully" });
  } catch (err) {
    next(err);
  }
};

export const getVendors = async (
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

    // Branch Id required
    const branchId = req.query.branchId as string;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // Search filter
    const search = ((req.query.search as string) || "").trim();

    const match: any = {
      isDeleted: false,
      branchId: new Types.ObjectId(branchId),
    };

    // Add search conditions
    if (search.length > 0) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Pipeline
    const pipeline: any[] = [
      { $match: match },

      {
        $project: {
          _id: 1,
          branchId: 1,
          name: 1,
          phone: 1,
          openingBalance: 1,
          billingInfo: 1,
          shippingInfo: 1,
          taxTreatment: 1,
          trn: 1,
          placeOfSupplay: 1,
          createdAt: 1,
          updatedAt:1,
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const vendors = await VENDOR.aggregate(pipeline);

    // Total count for pagination
    const totalCount = await VENDOR.countDocuments(match);

    return res.status(200).json({
      data: vendors,
      totalCount,
      page,
      limit,
    });

  } catch (err) {
    next(err);
  }
};

export const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
     vendorId,
      branchId,
      name,
      phone,
      openingBalance,
      billingInfo,
      shippingInfo,
      taxTreatment,
      trn,
      note,
      placeOfSupplay,
    } = req.body // allow partial

    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required!" });
    }

    // Check if customer exists
    const vendor = await VENDOR.findOne({ _id: vendorId, isDeleted: false });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found!" });
    }

    // Duplicate phone check if updating phone
    if (phone && phone !== vendor.phone) {
      const existContact = await VENDOR.findOne({
        phone,
        branchId: branchId || vendor.branchId,
        _id: { $ne: vendorId },
      });

      if (existContact) {
        return res.status(400).json({
          message: "Phone number already exists for another Vendor!",
        });
      }
    }

    // Build update object — take new values if given, else keep old
    const updateData = {
      branchId: branchId ?? vendor.branchId,
      name: name ?? vendor.name,
      phone: phone ?? vendor.phone,
      openingBalance: openingBalance ?? vendor.openingBalance,
      billingInfo: billingInfo ?? vendor.billingInfo,
      shippingInfo: shippingInfo ?? vendor.shippingInfo,
      taxTreatment: taxTreatment ?? vendor.taxTreatment,
      trn: trn ?? vendor.trn,
      note:note ?? vendor.note,
      placeOfSupplay: placeOfSupplay ?? vendor.placeOfSupplay,
    };

    await VENDOR.findByIdAndUpdate(vendorId, updateData, { new: true });

    return res.status(200).json({
      message: "Vendor updated successfully!",
    });
  } catch (err) {
    next(err);
  }
};


export const deleteVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { vendorId }  =req.params;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

     if (!vendorId) {
      return res.status(400).json({ message: "Vendor Id is required!" });
    }

    const vendor = await VENDOR.findOne({ _id: vendorId });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found!" });
    }
  

    await VENDOR.findByIdAndUpdate(vendorId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Vendor deleted successfully!",
    });
    

  } catch (err) {
    next(err);
  }
};