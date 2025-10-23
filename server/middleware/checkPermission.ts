import USER from "../models/user";
import express, { Request, Response, NextFunction } from "express";
import { IPermission } from "../types/common.types";

type PermissionAction = "can_create" | "can_read" | "can_update" | "can_delete";

const checkPermission = (
  panel: string,
  module: string,
  action: PermissionAction
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const user = await USER.findOne({
        _id: userId,
        isDeleted: false,
      }).populate<{ permissions: IPermission[] }>("permissions");
      
      if (!user) {
        return res.status(401).json({ message: "User not found!" });
      }

      if (user.role === "CompanyAdmin") {
        return next(); // CompanyAdmins have full access
      }

      const allPermissions = user.permissions.flatMap(
        (p) => p.permissions || []
      );

      // Panel-wide access check
      const hasPanelWideAccess = user.permissions.some((perm) => {
        if (panel === "admin" && perm.fullAdminAccess) return true;
        return false;
      });

      if (hasPanelWideAccess) {
        return next(); // Full access granted for panel
      }

      const hasPermission = allPermissions.some((perm) => {
        if (perm.module !== module) return false;

        if (perm.moduleFullAccess) return true;

        if (action === "can_read") {
          return (
            perm.actions?.can_read ||
            perm.actions?.can_create ||
            perm.actions?.can_update ||
            perm.actions?.can_delete
          );
        }

        return perm.actions?.[action] === true;
      });

      if (!hasPermission) {
        return res.status(403).json({ message: "Permission denied!" });
      }

      next(); // All checks passed
    } catch (err) {
      next(err);
    }
  };
};

export default checkPermission;
