"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDaysToEndOfNextMonth = exports.calculateDaysToEndOfMonth = void 0;
const calculateDaysToEndOfMonth = (fromDate = new Date()) => {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth(); // 0–11
    // End of THIS month → (next month, day 0) = last day of current month
    const endOfThisMonth = new Date(year, month + 1, 0);
    // Difference in ms → convert to days
    const diffMs = endOfThisMonth.getTime() - fromDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days; // just in case
};
exports.calculateDaysToEndOfMonth = calculateDaysToEndOfMonth;
const calculateDaysToEndOfNextMonth = (fromDate = new Date()) => {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    // End of NEXT month → (month + 2, day 0)
    const endOfNextMonth = new Date(year, month + 2, 0);
    const diffMs = endOfNextMonth.getTime() - fromDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
};
exports.calculateDaysToEndOfNextMonth = calculateDaysToEndOfNextMonth;
