"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegex = void 0;
const escapeRegex = (text) => {
    const result = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return result;
};
exports.escapeRegex = escapeRegex;
