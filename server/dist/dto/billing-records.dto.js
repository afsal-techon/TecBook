"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBillingRecordsDTO = exports.CreateBillingRecordsDTO = void 0;
const class_validator_1 = require("class-validator");
const enum_types_1 = require("../types/enum.types");
const class_transformer_1 = require("class-transformer");
const item_dto_1 = require("./item.dto");
class CreateBillingRecordsDTO {
}
exports.CreateBillingRecordsDTO = CreateBillingRecordsDTO;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBillingRecordsDTO.prototype, "vendorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBillingRecordsDTO.prototype, "billNumber", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateBillingRecordsDTO.prototype, "purchaseOrderNumber", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBillingRecordsDTO.prototype, "billDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBillingRecordsDTO.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBillingRecordsDTO.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enum_types_1.BillingPaymentStatus),
    __metadata("design:type", String)
], CreateBillingRecordsDTO.prototype, "payment", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => item_dto_1.ItemDto),
    __metadata("design:type", Array)
], CreateBillingRecordsDTO.prototype, "items", void 0);
class updateBillingRecordsDTO {
}
exports.updateBillingRecordsDTO = updateBillingRecordsDTO;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], updateBillingRecordsDTO.prototype, "vendorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], updateBillingRecordsDTO.prototype, "purchaseOrderNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], updateBillingRecordsDTO.prototype, "billDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], updateBillingRecordsDTO.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], updateBillingRecordsDTO.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enum_types_1.BillingPaymentStatus),
    __metadata("design:type", String)
], updateBillingRecordsDTO.prototype, "payment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => item_dto_1.ItemDto),
    __metadata("design:type", Array)
], updateBillingRecordsDTO.prototype, "items", void 0);
