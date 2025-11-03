"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent class's constructor
        this.statusCode = statusCode; // Add a custom statusCode property
    }
}
exports.default = HttpError;
