"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validateDto = (DtoClass) => async (req, res, next) => {
    const dtoInstance = (0, class_transformer_1.plainToInstance)(DtoClass, req.body);
    const errors = await (0, class_validator_1.validate)(dtoInstance, {
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
exports.validateDto = validateDto;
