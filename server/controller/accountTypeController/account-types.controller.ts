import { Model } from "mongoose";
import { DEFAULT_ACCOUNT_TYPES } from "../../constants/default-account-types.constant";
import { DEFAULT_ACCOUNTS } from "../../constants/default-account.constant";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  accountTypeModel,
  accountTypeModelDocument,
} from "../../models/account-types.model";
import accountModel from "../../models/accounts";
import { IAccounts } from "../../types/common.types";

export class AccountType extends GenericDatabaseService<accountTypeModelDocument> {
  private readonly accountModel: Model<IAccounts>;

  constructor(accountModel: Model<IAccounts>) {
    super(accountTypeModel);
    this.accountModel = accountModel;
  }

  /*  * Auto create common account types
   ----------------------------------
   This method checks for the existence of common account types and creates them if they don't exist.
   * It relies on `DEFAULT_ACCOUNT_TYPES` constant.
   * @returns A success message or an error message.
   */
  autoCreateCommonAccountTypes = async () => {
    try {
      for (const accountType of DEFAULT_ACCOUNT_TYPES) {
        const existAccountType = await this.genericFindOne({
          name: accountType.name,
          category: accountType.category,
          isDeleted: false,
          isSystemGenerated: true,
        });
        if (!existAccountType) {
          await this.genericCreateOne(accountType);
        }
      }
      return {
        success: true,
        message: "Default account types seeded successfully",
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to create common account types", error.message);
        return error.message;
      }
      console.log("Failed to create common account types", error);
      return "Failed to create common account types";
    }
  };

  /*  * Auto create system default accounts
   ----------------------------------
   This method checks for the existence of system default accounts and creates them if they don't exist.
   * It relies on `DEFAULT_ACCOUNTS` constant and `accountTypeModel` to link accounts to their types.
   * @returns A success message or an error message.
   */
  autoCreateCommonAccounts = async () => {
    try {
      for (const account of DEFAULT_ACCOUNTS) {
        if (!account.accountName || !account.accountTypeName) continue;

        const accountType = await accountTypeModel.findOne({
          name: account.accountTypeName,
          isDeleted: false,
          isSystemGenerated: true,
        });

        if (!accountType) {
          console.warn(`⚠️ AccountType not found: ${account.accountTypeName}`);
          continue;
        }

        const existingAccount = await this.genericFindOne({
          accountName: account.accountName,
          accountType: accountType._id,
          isDeleted: false,
          isSystemGenerated: true,
        });

        if (existingAccount) continue;

        await this.accountModel.create({
          accountName: account.accountName,
          accountType: accountType._id,
          isSystemGenerated: true,
        });
      }

      return {
        success: true,
        message: "System default accounts created successfully",
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to create system accounts", error.message);
        return error.message;
      }
      console.error("Failed to create system accounts", error);
      return "Failed to create system accounts";
    }
  };
}

export const accountTypeController = new AccountType(accountModel);
