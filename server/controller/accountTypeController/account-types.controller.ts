import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  accountTypeModel,
  accountTypeModelDocument,
} from "../../models/account-types.model";

export class AccountType extends GenericDatabaseService<accountTypeModelDocument> {
  constructor() {
    super(accountTypeModel);
  }
}

export const accountTypeController = new AccountType();
