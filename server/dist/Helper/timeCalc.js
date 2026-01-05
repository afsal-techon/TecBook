"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTimeToMinutes = parseTimeToMinutes;
// utils/time.ts
function parseTimeToMinutes(input) {
    if (typeof input === "number") {
        return Math.round(input * 60);
    }
    const value = input.trim();
    if (value.includes(":")) {
        const [h, m] = value.split(":");
        const hours = h ? Number(h) : 0;
        const minutes = m ? Number(m) : 0;
        if (isNaN(hours) || isNaN(minutes)) {
            throw new Error("Invalid time format");
        }
        return hours * 60 + minutes;
    }
    const num = Number(value);
    if (!isNaN(num)) {
        return Math.round(num * 60);
    }
    throw new Error("Invalid time format");
}
