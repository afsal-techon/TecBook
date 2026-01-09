import { DEFAULT_ACCOUNT_TYPES } from "../../constants/default-account-types.constant";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  accountTypeModel,
  accountTypeModelDocument,
} from "../../models/account-types.model";

export class AccountType extends GenericDatabaseService<accountTypeModelDocument> {
  constructor() {
    super(accountTypeModel);
  }

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
}

export const accountTypeController = new AccountType();
