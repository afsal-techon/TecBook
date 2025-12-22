import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants/http-status";

/**
 * GenericDatabaseService
 * ----------------------
 * Reusable CRUD service for Mongo/Mongoose models.
 * Each method is an Express-compatible controller function.
 *
 * @template T - Model document type
 */
export class GenericDatabaseService<T> {
  constructor(private readonly Model: any) {}

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
  genericCreateOne = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.Model.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
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
  genericFindAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.Model.find();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      next(error);
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
  genericFindById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.Model.findById(req.params.id);
      if (!data) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Record not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
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
  genericFindOneByIdOrNotFound = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.Model.findById(req.params.id);

      if (!data) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Record not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
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
  genericUpdateOneById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!data) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Record not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
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
  genericDeleteOneById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.Model.findByIdAndDelete(req.params.id);

      if (!data) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Record not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
