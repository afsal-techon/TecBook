import { NextFunction, Request, Response } from "express";
import mongoose, { Types, Model, FilterQuery } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  ExpenseModel,
  ExpenseModelConstants,
  ExpenseModelDocument,
} from "../../models/ExpenseModel";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from "../../dto/create-expense.dto";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import branchModel from "../../models/branch";
import vendorModel from "../../models/vendor";
import { IBranch, ICustomer, IVendor } from "../../types/common.types";
import { HTTP_STATUS } from "../../constants/http-status";
import { ItemDto } from "../../dto/item.dto";
import { IItem } from "../../Interfaces/item.interface";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import customerModel from "../../models/customer";
import { IExpenses } from "../../Interfaces/expenses.interface";

class ExpenseController extends GenericDatabaseService<ExpenseModelDocument> {
  private readonly userModel: Model<IUser>;
  private readonly branchModel: Model<IBranch>;
  private readonly vendorModel: Model<IVendor>;
  private readonly customerModel: Model<ICustomer>;

  constructor() {
    super(ExpenseModel);
    this.userModel = userModel;
    this.branchModel = branchModel;
    this.vendorModel = vendorModel;
    this.customerModel = customerModel;
  }

  /**
   * Creates a new expense record in the database.
   *
   * This method performs the following operations:
   * 1. Validates the authenticated user's ID from the request.
   * 2. Validates the existence of the User, Vendor, Branch, and Customer entities.
   * 3. Maps the expense items from the DTO to the internal item structure.
   * 4. Persists the new expense entry.
   *
   * @param req - The Express Request object. Expects `CreateExpenseDto` in `req.body` and an authenticated user in `req.user`.
   * @param res - The Express Response object.
   * @returns A Promise that resolves to void. Sends a JSON response with:
   *          - HTTP 201 (Created) and the expense data on success.
   *          - HTTP 401 (Unauthorized) if the user is not authenticated.
   *          - HTTP 400 (Bad Request) if the user ID is invalid.
   * @throws {Error} Throws an error if validation of related entities fails or if the database operation encounters an issue.
   */
  createExpense = async (
    req: Request<{}, {}, CreateExpenseDto>,
    res: Response
  ) => {
    try {
      const dto = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized",
        });
      }
      if (!this.isValidMongoId(userId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid user id",
        });
      }

      await this.validateUser(userId);
      await this.validateVendor(dto.vendorId);
      await this.validateBranch(dto.branchId);
      await this.validateCustomer(dto.customerId);

      const items: IItem[] = this.mapItems(dto.items);

      const payload = {
        date: dto.date ? new Date(dto.date) : new Date(),
        expenseNumber: dto.expenseNumber, // TODO: auto increment
        customerId: new Types.ObjectId(dto.customerId),
        branchId: new Types.ObjectId(dto.branchId),
        taxPreference: dto.taxPreference,
        paidAccount: new Types.ObjectId(dto.paidAccount),
        vendorId: new Types.ObjectId(dto.vendorId),
        items,
        createdBy: new Types.ObjectId(userId),
      };

      const expense = await this.genericCreateOne(payload);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Expense created successfully",
        data: expense,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while creating expense", error.message);
        throw new Error(error.message);
      }
      console.log("Error while creating expense", error);
      throw new Error("failed to create expense");
    }
  };

  /**
   * Updates an existing expense record by ID.
   *
   * This method performs the following operations:
   * 1. Verifies the existence of the expense record using the provided ID.
   * 2. Validates related entities (Vendor, Branch, Customer) if their IDs are provided in the update payload.
   * 3. Maps updated items to the internal item structure if provided.
   * 4. Updates the expense record in the database with the new values.
   *
   * @param req - The Express Request object. Expects the expense ID in `req.params.id` and partial expense details in `req.body`.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction.
   * @returns A Promise that resolves to void. Sends a JSON response with HTTP 200 (OK) on success.
   * @throws {Error} Throws an error if validation fails or if the database update operation fails.
   */
  updateExpense = async (
    req: Request<{ id: string }, {}, UpdateExpenseDto>,
    res: Response
  ) => {
    try {
      const { id } = req.params;

      await this.genericFindOneByIdOrNotFound(id);

      if (req.body.vendorId) {
        await this.validateVendor(req.body.vendorId);
      }

      if (req.body.branchId) {
        await this.validateBranch(req.body.branchId);
      }
      if (req.body.customerId) {
        await this.validateCustomer(req.body.customerId);
      }

      const items: IItem[] = req.body.items
        ? this.mapItems(req.body.items)
        : [];

      const payload = {
        date: req.body.date ? new Date(req.body.date) : undefined,
        customerId: req.body.customerId
          ? new Types.ObjectId(req.body.customerId)
          : undefined,
        branchId: req.body.branchId
          ? new Types.ObjectId(req.body.branchId)
          : undefined,
        taxPreference: req.body.taxPreference,
        paidAccount: req.body.paidAccount
          ? new Types.ObjectId(req.body.paidAccount)
          : undefined,
        vendorId: req.body.vendorId
          ? new Types.ObjectId(req.body.vendorId)
          : undefined,
        items,
      };

      await this.genericUpdateOneById(id, payload);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Expense updated successfully",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while updating expense", error.message);
        throw new Error(error.message);
      }
      console.log("Error while updating expense", error);
      throw new Error("failed to update expense");
    }
  };

  /**
   * Retrieves a paginated list of expenses based on query filters and user permissions.
   *
   * This method performs the following operations:
   * 1. Resolves the authenticated user's allowed branches to ensure data access security.
   * 2. Applies filtering based on the `branchId` query parameter (if provided and allowed).
   * 3. Applies search filtering on `expenseNumber` if a search term is provided.
   * 4. Supports pagination via `page` and `limit` query parameters.
   * 5. Retrieves the expense records from the database, populated with Vendor and Branch details.
   *
   * @param req - The Express Request object. Expects query parameters:
   *              - `page` (optional): Page number (default: 1).
   *              - `limit` (optional): Number of items per page (default: 20).
   *              - `search` (optional): Search term for expense number.
   *              - `branchId` (optional): Filter by specific branch ID.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction.
   * @returns A Promise that resolves to void. Sends a JSON response with:
   *          - `success`: boolean indicating success.
   *          - `data`: Array of expense objects.
   *          - `pagination`: Object containing `totalCount`, `page`, `limit`, and `totalPages`.
   * @throws {Error} Throws an error if the database query fails or permission resolution encounters issues.
   */
  getAllExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser = req.user as { id: string };

      const limit: number = parseInt(req.query.limit as string) || 20;
      const page: number = parseInt(req.query.page as string) || 1;
      const skip: number = (page - 1) * limit;
      const search: string = (req.query.search as string) || "";
      const filterBranchId = req.query.branchId as string | undefined;

      const { allowedBranchIds } = await resolveUserAndAllowedBranchIds({
        userId: authUser.id,
        userModel: this.userModel,
        branchModel: this.branchModel,
        requestedBranchId: filterBranchId,
      });

      const query: FilterQuery<IExpenses> = {
        isDeleted: false,
        branchId: { $in: allowedBranchIds },
      };

      if (search) {
        query.expenseNumber = { $regex: search, $options: "i" };
      }

      const totalCount: number = await ExpenseModel.countDocuments(query);

      const expenses = await ExpenseModel.find(query)
        .sort({ createdAt: -1 })
        .populate(ExpenseModelConstants.vendorId)
        .populate(ExpenseModelConstants.branchId)
        .skip(skip)
        .limit(limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: expenses,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while getting all expenses", error.message);
        throw new Error(error.message);
      }
      console.log("Error while getting all expenses", error);
      throw new Error("failed to get all expenses");
    }
  };

  getExpenseById = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid expense id",
        });
      }
      await this.genericFindOneByIdOrNotFound(id);

      const expense = await ExpenseModel.findOne({
        _id: id,
        isDeleted: false,
      })
        .populate(ExpenseModelConstants.vendorId)
        .populate(ExpenseModelConstants.branchId);

      if (!expense) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: expense,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while getting expense by id", error.message);
        throw new Error(error.message);
      }
      console.log("Error while getting expense by id", error);
      throw new Error("failed to get expense by id");
    }
  };
  private async validateBranch(id: string) {
    const branch = await this.branchModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!branch) throw new Error("Branch not found");
    return branch;
  }

  private async validateUser(id: string) {
    const user = await this.userModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  private async validateVendor(vendorId: string) {
    const vendor = await this.vendorModel.findOne({
      _id: vendorId,
      isDeleted: false,
    });
    if (!vendor) throw new Error("Vendor not found");
    return vendor;
  }
  private async validateCustomer(customerId: string) {
    const customer = await this.customerModel.findOne({
      _id: customerId,
      isDeleted: false,
    });
    if (!customer) throw new Error("customer not found");
    return customer;
  }

  private mapItems(itemsDto: ItemDto[]): IItem[] {
    return itemsDto.map((item) => ({
      itemId: item.itemId ? new Types.ObjectId(item.itemId) : undefined,
      taxId: item.taxId ? new Types.ObjectId(item.taxId) : undefined,
      itemName: item.itemName,
      qty: item.qty,
      tax: item.tax,
      rate: item.rate,
      amount: item.amount,
      unit: item.unit,
      discount: item.discount,
    }));
  }
}

export const expenseController = new ExpenseController();
