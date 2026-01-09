import { accountTypesCategory } from "../types/enum.types";
import { IBaseFIelds } from "./base.interface";

export interface IAccountType extends IBaseFIelds {
  name: string;
  code?: string;
  category: accountTypesCategory;
  description?: string;
  isSystemGenerated?: boolean;
}
