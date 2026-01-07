import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  vendorCreditModel,
  vendorCreditModelDocument,
} from "../../models/vendor-credit.model";

class vendorCredit extends GenericDatabaseService<vendorCreditModelDocument> {
  constructor() {
    super(vendorCreditModel);
  }
}

export const vendorCreditController = new vendorCredit();
