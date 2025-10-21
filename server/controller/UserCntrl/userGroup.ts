import USER from "../../models/user";
import PERMISSION from "../../models/permission";
import express, { Request, Response, NextFunction } from "express";
import {
  IActionPermissions,
  IModulePermission,
} from "../../types/common.types";

export const createUserGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchId, name, permissions, fullAdminAccess } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
    }

    const existing = await PERMISSION.findOne({
      name,
      branchId,
      isDeleted: false,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Permission role name already exists!" });
    }

    let formattedPermissions: IModulePermission[] = [];

    if (permissions && Array.isArray(permissions)) {
      formattedPermissions = permissions.map((p: any) => {
        const moduleAccess: IActionPermissions = {
          can_create: p.actions?.can_create || false,
          can_read: p.actions?.can_read || false,
          can_update: p.actions?.can_update || false,
          can_delete: p.actions?.can_delete || false,
        };

        if (p.moduleFullAccess) {
          moduleAccess.can_create = true;
          moduleAccess.can_read = true;
          moduleAccess.can_update = true;
          moduleAccess.can_delete = true;
        }

        return {
          module: p.module,
          moduleFullAccess: !!p.moduleFullAccess,
          actions: moduleAccess,
        };
      });
    }

    const newPermission = new PERMISSION({
      name,
      permissions: formattedPermissions,
      branchId: branchId,
      User: userId,
      // createdBy: user.name,
      fullAdminAccess,
    });

    await newPermission.save();

    res
      .status(201)
      .json({
        message: "Permissions created successfully",
        data: newPermission,
      });
  } catch (err) {
    next(err);
  }
};


export const getAlluserGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
    }

    const permissions = await PERMISSION.find({
      branchId,
      isDeleted: false,
    }).select({
      name: 1,
      createdAt: 1,
      updatedAt: 1,
      _id: 1,
    });

    return res.status(200).json({ data: permissions });
  } catch (err) {
    next(err);
  }
};


export const updateUserGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {

     const {
      branchId,
      permissionId,
      name,
      permissions,
      fullAdminAccess
    } = req.body;
     
    const userId = req.user?.id;
    
      const user = await USER.findOne({ _id: userId, isDeleted: false })
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (!branchId) {
      return res.status(400).json({ message: "Permission Id is required!" });
    }

    if (!permissionId) {
      return res.status(400).json({ message: "Permission ID is required!" });
    }

        // Check if permission exists
        const existingPermission = await PERMISSION.findOne({ _id: permissionId, branchId, isDeleted:false });
        if (!existingPermission) {
          return res.status(404).json({ message: "Permission not found!" });
        }

            // If name is changing, check for duplicates
    if (name && name !== existingPermission.name) {
      const nameCheck = await PERMISSION.findOne({ name, branchId });
      if (nameCheck) {
        return res.status(400).json({ message: "Permission role name already exists!" });
      }
    }

     // Format permissions\
         let formattedPermissions: IModulePermission[] = [];

     if (permissions && Array.isArray(permissions)) {
      formattedPermissions = permissions.map((p) => {
        const moduleAccess: IActionPermissions = {
          can_create: p.actions?.can_create || false,
          can_read: p.actions?.can_read || false,
          can_update: p.actions?.can_update || false,
          can_delete: p.actions?.can_delete || false,
        };

        if (p.moduleFullAccess) {
          moduleAccess.can_create = true;
          moduleAccess.can_read = true;
          moduleAccess.can_update = true;
          moduleAccess.can_delete = true;
        }

        return {
          module: p.module,
          moduleFullAccess: !!p.moduleFullAccess,
          actions: moduleAccess,
        };
      });
    }

        // Update the permission document
        const updated = await PERMISSION.findByIdAndUpdate(
          permissionId,
          {
            name,
            permissions: formattedPermissions,
            fullAdminAccess,
            // updatedBy: userId,
            updatedAt: new Date(),
          },
          { new: true }
        );
    
        return res.status(200).json({
          message: "Permission updated successfully",
          data: updated,
        })
    

  } catch (err) {
    next(err);
  }
};


export const deletePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
         const { branchId, permissionId  } = req.body;

       const userId = req.user?.id;

       if (!branchId || !permissionId) {
        return res.status(400).json({ message: "Branch Id and Permission Id are required!" });
      }

        const user = await USER.findOne({ _id: userId, isDeleted: false })
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }

      const permission = await PERMISSION.findOne({ _id: permissionId, branchId, isDeleted:false });
      if (!permission) {
        return res.status(404).json({ message: "Permission not found!" });
      }

      await PERMISSION.findByIdAndUpdate(permissionId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: user._id,
        // deletedBy: user.name,
      });

      await USER.updateMany(
        { branchId, permissions: permissionId },
        { $pull: { permissions: permissionId } }
      );

      return res.status(200).json({ message: "Permission deleted successfully!" });
      
  } catch (err) {
    next(err);
  }
};



