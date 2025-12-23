import USER from "../../models/user";
// import PAYMENT from "../../models/";
import express, { Request, Response, NextFunction } from "express";
import CUSTOMER from "../../models/customer";
import { imagekit } from "../../config/imageKit";
import { Types } from "mongoose";
import BRANCH from "../../models/branch";
import mongoose from "mongoose";
import QuoteNumberSetting from "../../models/numberSetting";
import SALSE_PERSON from "../../models/salesPerson";
import TAX from '../../models/tax'