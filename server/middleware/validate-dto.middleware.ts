import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const validateDto =
  (DtoClass: any) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(DtoClass, req.body);

    const errors = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors.map(err => ({
          field: err.property,
          constraints: err.constraints,
        })),
      });
    }

    req.body = dtoInstance; // transformed & validated
    next();
  };
