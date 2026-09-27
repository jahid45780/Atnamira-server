"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NotFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: "route not found"
    });
};
exports.default = NotFound;
