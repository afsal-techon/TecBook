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
}

export const creditNoteController = new CreditNoteController(branchModel);
