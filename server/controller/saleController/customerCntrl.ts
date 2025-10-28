import CUSTOMER from '../../models/customer'
import express , {Request,Response,NextFunction} from 'express'
import { ICustomer } from '../../types/common.types';
import USER from '../../models/user'
import { Types } from "mongoose";



export const createCustomer = async (
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

    } = req.body as ICustomer

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

    if (!trn) {
      return res.status(400).json({ message: "trn is required!" });
    }
    
    if (!placeOfSupplay) {
      return res.status(400).json({ message: "Place of supplay required!" });
    }

    const existContact = await CUSTOMER.findOne({ phone , branchId ,isDeleted:false });
    if (existContact)
      return res
        .status(400)
        .json({ message: "Phone number is already exists!" });


    await CUSTOMER.create({
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

    return res.status(200).json({ message: "Customer created successfully" });
  } catch (err) {
    next(err);
  }
};

export const getCustomers = async (
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

    const customers = await CUSTOMER.aggregate(pipeline);

    // Total count for pagination
    const totalCount = await CUSTOMER.countDocuments(match);

    return res.status(200).json({
      data: customers,
      totalCount,
      page,
      limit,
    });

  } catch (err) {
    next(err);
  }
};


export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
     customerId,
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

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required!" });
    }

    // Check if customer exists
    const customer = await CUSTOMER.findOne({ _id: customerId, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    // Duplicate phone check if updating phone
    if (phone && phone !== customer.phone) {
      const existContact = await CUSTOMER.findOne({
        phone,
        branchId: branchId || customer.branchId,
        _id: { $ne: customerId },
      });

      if (existContact) {
        return res.status(400).json({
          message: "Phone number already exists for another customer!",
        });
      }
    }

    // Build update object — take new values if given, else keep old
    const updateData = {
      branchId: branchId ?? customer.branchId,
      name: name ?? customer.name,
      phone: phone ?? customer.phone,
      openingBalance: openingBalance ?? customer.openingBalance,
      billingInfo: billingInfo ?? customer.billingInfo,
      shippingInfo: shippingInfo ?? customer.shippingInfo,
      taxTreatment: taxTreatment ?? customer.taxTreatment,
      trn: trn ?? customer.trn,
      note:note ?? customer.note,
      placeOfSupplay: placeOfSupplay ?? customer.placeOfSupplay,
    };

    await CUSTOMER.findByIdAndUpdate(customerId, updateData, { new: true });

    return res.status(200).json({
      message: "Customer updated successfully!",
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { customerId }  =req.params;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

     if (!customerId) {
      return res.status(400).json({ message: "Customer Id is required!" });
    }

    const customer = await CUSTOMER.findOne({ _id: customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found!" });
    }
  

    await CUSTOMER.findByIdAndUpdate(customerId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Customer deleted successfully!",
    });
    

  } catch (err) {
    next(err);
  }
};