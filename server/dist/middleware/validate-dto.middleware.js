"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validateDto = (DtoClass) => async (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({
            success: false,
            message: "Request body is missing",
        });
    }
    if (typeof req.body.items === "string") {
        try {
            req.body.items = JSON.parse(req.body.items);
        }
        catch {
            return res.status(400).json({
                success: false,
                message: "Invalid items JSON format",
            });
        }
    }
    const dtoInstance = (0, class_transformer_1.plainToInstance)(DtoClass, req.body, {
        enableImplicitConversion: true,
    });
    const errors = await (0, class_validator_1.validate)(dtoInstance, {
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
exports.validateDto = validateDto;
