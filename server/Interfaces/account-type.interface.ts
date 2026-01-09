import { accountTypesCategory } from "../types/enum.types";

export interface IAccountType {
  name: string;
  code?: string;
  category: accountTypesCategory;
  description?: string;
  isSystemGenerated?: boolean;
  createdBy?: string;
  isDeleted?: boolean;
}
