"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTestAttemptEligibility = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Usertestattempt_service_1 = require("../services/Usertestattempt.service");
/**
 * Middleware to check if a user is eligible to take a test
 * This should be used before allowing a user to start/access a test
 *
 * Usage: Apply this middleware to routes where users start a test
 * The testId should be available in req.params or req.body
 */
const checkTestAttemptEligibility = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        // Get testId from params or body
        const testId = req.params.testId || req.body.testId;
        if (!testId) {
            throw new httpError_1.default("Test ID is required", 400);
        }
        // Check eligibility
        const eligibility = yield (0, Usertestattempt_service_1.checkUserTestEligibilityService)(req.user.id, testId);
        if (!eligibility.canAttempt) {
            throw new httpError_1.default(`You have no remaining attempts for this test. Used: ${eligibility.attemptsUsed}/${eligibility.allowedAttempts}`, 403);
        }
        // Attach eligibility info to request for use in controller
        req.testEligibility = eligibility;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkTestAttemptEligibility = checkTestAttemptEligibility;
