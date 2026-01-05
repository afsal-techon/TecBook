import { Model } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  CreditNoteModel,
  CreditNoteModelDocument,
} from "../../models/credtiNoteModel";
import { IBranch } from "../../types/common.types";
import branchModel from "../../models/branch";

class CreditNoteController extends GenericDatabaseService<CreditNoteModelDocument> {
  private readonly branchModel: Model<IBranch>;
  constructor(branchModel: Model<IBranch>) {
    super(CreditNoteModel);
    this.branchModel = branchModel;
  }

  private async validateBranch(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid branch Id");
    }
    const validateBranch = await this.branchModel.findById(id, {
      isDeleted: false,
    });
    if (!validateBranch) {
      throw new Error("Branch not found");
    }
    return validateBranch;
  }
}

export const creditNoteController = new CreditNoteController(branchModel);
