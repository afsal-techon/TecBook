import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const validateDto =
  (DtoClass: any) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    if (typeof req.body.items === "string") {
      try {
        req.body.items = JSON.parse(req.body.items);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid items JSON format",
        });
      }
    }

    const dtoInstance = plainToInstance(DtoClass, req.body, {
      enableImplicitConversion: true,
    });

    const errors = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors.map((err) => ({
          field: err.property,
          constraints: err.constraints,
        })),
      });
    }

    req.body = dtoInstance;
    next();
  };
