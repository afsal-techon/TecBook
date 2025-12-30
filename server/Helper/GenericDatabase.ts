import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants/http-status";
import mongoose, { Model, Document, Types, HydratedDocument } from "mongoose";
import { IBaseFIelds } from "../Interfaces/base.interface";

/**
 * GenericDatabaseService
 * ----------------------
 * Reusable CRUD service for Mongo/Mongoose models.
 * Each method is an Express-compatible controller function.
 *
 * @template T - Model document type
 */
export class GenericDatabaseService<T extends Model<HydratedDocument<any>>> {
  constructor(protected readonly dbModel: T) {}

  protected isValidMongoId = (id: string) => {
    return mongoose.isValidObjectId(id);
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
  genericCreateOne = async (payload: any) => {
    try {
      const data: T | null = await this.dbModel.create(payload);
      if (!data) {
        throw Object.assign(new Error("Failed to create record"), {
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      return data;
    } catch (error) {
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
  genericFindAll = async () => {
    try {
      const data: T[] | null = await this.dbModel.find({ isDeleted: false });
      return data;
    } catch (error: unknown) {
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
  genericFindById = async (id: string) => {
    try {
      if (!id) {
        throw Object.assign(new Error("ID is required"), {
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      if (!this.isValidMongoId(id)) {
        throw Object.assign(new Error("Invalid ID format"), {
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const data: T | null = await this.dbModel.findById({
        _id: id,
        isDeleted: false,
      });
      if (!data) {
        throw Object.assign(new Error("Record not found"), {
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
      }

      return {
        data,
      };
    } catch (error: unknown) {
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
  genericFindOneByIdOrNotFound = async (id: string) => {
    try {
      if (!id) {
        throw new Error("ID is required");
      }

      if (!this.isValidMongoId(id)) {
        throw Object.assign(new Error("Invalid ID format"), {
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const data: T | null = await this.dbModel.findById({
        _id: id,
        isDeleted: false,
      });

      if (!data) {
        throw Object.assign(new Error("Record not found"), {
          success: false,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
      }

      return {
        data,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to find record by ID", error.message);
        throw new Error(error.message);
      }
      console.log("Failed to find record by ID");
      throw error;
    }
  };

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
  async genericUpdateOneById(id: string, payload: Partial<any>) {
    try {
      if (!id) {
        throw Object.assign(new Error("ID is required"), {
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      if (!this.isValidMongoId(id)) {
        throw Object.assign(new Error("Invalid ID format"), {
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const data = await this.dbModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        payload,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!data) {
        throw Object.assign(new Error("Record not found"), {
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
      }

      return {
        data,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to update record", error.message);
        throw new Error(error.message);
      }
      console.log("Failed to update record");
      throw error;
    }
  }

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
  genericDeleteOneById = async (
    id: string
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }> => {
    try {
      if (!id) {
        throw Object.assign(new Error("ID is required"), {
          success: false,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      if (!this.isValidMongoId(id)) {
        throw Object.assign(new Error("Invalid ID format"), {
          success: false,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const data: T | null = await this.dbModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
      );
      if (!data) {
        throw Object.assign(new Error("Record not found"), {
          success: false,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
      }

      return {
        success: true,
        statusCode: HTTP_STATUS.OK,
        message: "Record deleted successfully",
      };
    } catch (error: unknown) {
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
  genericFindOne = async (filter: any) => {
    try {
      const data: T | null = await this.dbModel.findOne({
        isDeleted: false,
        ...filter,
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to fetch record", error.message);
        throw error;
      }
      throw error;
    }
  };
}
