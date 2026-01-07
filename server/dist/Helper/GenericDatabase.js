"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericDatabaseService = void 0;
const http_status_1 = require("../constants/http-status");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * GenericDatabaseService
 * ----------------------
 * Reusable CRUD service for Mongo/Mongoose models.
 * Each method is an Express-compatible controller function.
 *
 * @template T - Model document type
 */
class GenericDatabaseService {
    constructor(dbModel) {
        this.dbModel = dbModel;
        this.isValidMongoId = (id) => {
            return mongoose_1.default.isValidObjectId(id);
        };
        /**
         * Create a new record
         * -------------------
         * @route   POST /
         * @access  Public / Protected (depends on route middleware)
         *
         * @param req - Express Request (expects body payload)
         * @param res - Express Response
         * @param next - Express NextFunction
         *
         * @response 201 - Record created successfully
         * @response 500 - Server error
         */
        this.genericCreateOne = async (payload) => {
            try {
                const data = await this.dbModel.create(payload);
                if (!data) {
                    throw Object.assign(new Error("Failed to create record"), {
                        statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                    });
                }
                return data;
            }
            catch (error) {
                throw error;
            }
        };
        /**
         * Get all records
         * ---------------
         * @route   GET /
         * @access  Public / Protected
         *
         * @param req - Express Request
         * @param res - Express Response
         * @param next - Express NextFunction
         *
         * @response 200 - Records fetched successfully
         * @response 500 - Server error
         */
        this.genericFindAll = async () => {
            try {
                const data = await this.dbModel.find({ isDeleted: false });
                return data;
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to fetch records", error.message);
                    throw new Error(error.message);
                }
                console.log("Failed to fetch records");
                throw error;
            }
        };
        /**
         * Get a single record by ID
         * -------------------------
         * @route   GET /:id
         * @access  Public / Protected
         *
         * @param req - Express Request (expects params.id)
         * @param res - Express Response
         * @param next - Express NextFunction
         *
         * @response 200 - Record found
         * @response 404 - Record not found
         * @response 500 - Server error
         */
        this.genericFindById = async (id) => {
            try {
                if (!id) {
                    throw Object.assign(new Error("ID is required"), {
                        statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                    });
                }
                if (!this.isValidMongoId(id)) {
                    throw Object.assign(new Error("Invalid ID format"), {
                        statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                    });
                }
                const data = await this.dbModel.findById({
                    _id: id,
                    isDeleted: false,
                });
                if (!data) {
                    throw Object.assign(new Error("Record not found"), {
                        statusCode: http_status_1.HTTP_STATUS.NOT_FOUND,
                    });
                }
                return {
                    data,
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to find record by ID", error.message);
                    throw new Error(error.message);
                }
                throw error;
            }
        };
        /**
         * Get one record by ID or return Not Found
         * ----------------------------------------
         * Explicit version of getById with clearer intent.
         *
         * @route   GET /:id
         * @access  Public / Protected
         *
         * @param req - Express Request (expects params.id)
         * @param res - Express Response
         * @param next - Express NextFunction
         *
         * @response 200 - Record found
         * @response 404 - Record not found
         * @response 500 - Server error
         */
        this.genericFindOneByIdOrNotFound = async (id) => {
            try {
                if (!id) {
                    throw new Error("ID is required");
                }
                if (!this.isValidMongoId(id)) {
                    throw Object.assign(new Error("Invalid ID format"), {
                        statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                    });
                }
                const data = await this.dbModel.findById({
                    _id: id,
                    isDeleted: false,
                });
                if (!data) {
                    throw Object.assign(new Error("Record not found"), {
                        success: false,
                        statusCode: http_status_1.HTTP_STATUS.NOT_FOUND,
                    });
                }
                return {
                    data,
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to find record by ID", error.message);
                    throw new Error(error.message);
                }
                console.log("Failed to find record by ID");
                throw error;
            }
        };
        /**
         * Delete a record by ID
         * ---------------------
         * @route   DELETE /:id
         * @access  Public / Protected
         *
         * @param req - Express Request (expects params.id)
         * @param res - Express Response
         * @param next - Express NextFunction
         *
         * @response 200 - Record deleted successfully
         * @response 404 - Record not found
         * @response 500 - Server error
         */
        this.genericDeleteOneById = async (id) => {
            try {
                if (!id) {
                    throw Object.assign(new Error("ID is required"), {
                        success: false,
                        statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                    });
                }
                if (!this.isValidMongoId(id)) {
                    throw Object.assign(new Error("Invalid ID format"), {
                        success: false,
                        statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                    });
                }
                const data = await this.dbModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
                if (!data) {
                    throw Object.assign(new Error("Record not found"), {
                        success: false,
                        statusCode: http_status_1.HTTP_STATUS.NOT_FOUND,
                    });
                }
                return {
                    success: true,
                    statusCode: http_status_1.HTTP_STATUS.OK,
                    message: "Record deleted successfully",
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to delete record", error.message);
                    throw new Error(error.message);
                }
                console.log("Failed to delete record");
                throw error;
            }
        };
        /**
         * Find one record by filter
         * -------------------------
         * @param filter - Mongoose filter object
         * @returns The found record or null
         */
        this.genericFindOne = async (filter) => {
            try {
                const data = await this.dbModel.findOne({
                    isDeleted: false,
                    ...filter,
                });
                return data;
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to fetch record", error.message);
                    throw error;
                }
                throw error;
            }
        };
        this.validateIdsExist = async (model, ids, fieldName) => {
            const validIds = ids
                .filter(Boolean)
                .filter((id) => this.isValidMongoId(id));
            if (!validIds.length)
                return;
            const count = await model.countDocuments({
                _id: { $in: validIds },
                isDeleted: false,
            });
            if (count !== validIds.length) {
                throw new Error(`Invalid ${fieldName} in items`);
            }
        };
    }
    /**
     * Update a record by ID
     * ---------------------
     * @route   PUT /:id
     * @access  Public / Protected
     *
     * @param req - Express Request (expects params.id & body)
     * @param res - Express Response
     * @param next - Express NextFunction
     *
     * @response 200 - Record updated successfully
     * @response 404 - Record not found
     * @response 500 - Server error
     */
    async genericUpdateOneById(id, payload) {
        try {
            if (!id) {
                throw Object.assign(new Error("ID is required"), {
                    statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                });
            }
            if (!this.isValidMongoId(id)) {
                throw Object.assign(new Error("Invalid ID format"), {
                    statusCode: http_status_1.HTTP_STATUS.BAD_REQUEST,
                });
            }
            const data = await this.dbModel.findOneAndUpdate({ _id: id, isDeleted: false }, payload, {
                new: true,
                runValidators: true,
                upsert: true,
            });
            if (!data) {
                throw Object.assign(new Error("Record not found"), {
                    statusCode: http_status_1.HTTP_STATUS.NOT_FOUND,
                });
            }
            return {
                data,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Failed to update record", error.message);
                throw new Error(error.message);
            }
            console.log("Failed to update record");
            throw error;
        }
    }
}
exports.GenericDatabaseService = GenericDatabaseService;
