"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserTestAttemptController = __importStar(require("../controllers/Usertestattempt.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// ===== USER ROUTES =====
// Check if the current user can take a specific test
router.get('/eligibility/:testId', auth_1.default, UserTestAttemptController.checkTestEligibilityController);
// Mark that the user has started a test (call this when user clicks "Start Test")
router.post('/start/:testId', auth_1.default, UserTestAttemptController.startTestAttemptController);
// Mark that the user has completed a test (call this when user submits the test)
router.post('/complete/:testId', auth_1.default, UserTestAttemptController.completeTestAttemptController);
// Get current user's test attempt history
// Optional query param: ?testId=uuid (to get attempts for a specific test)
router.get('/my-attempts', auth_1.default, UserTestAttemptController.getMyTestAttemptsController);
// ===== ADMIN/TEACHER ROUTES =====
// Admin grants additional attempts to a user
// Body: { userId, testId, additionalAttempts, reason? }
router.post('/grant', auth_1.default, UserTestAttemptController.grantTestAttemptsController);
// Admin resets test attempts for a user (sets attempts back to default or custom value)
// Body: { userId, testId, newAllowedAttempts?, reason? }
router.post('/reset', auth_1.default, UserTestAttemptController.resetTestAttemptsController);
// Admin/Teacher gets all users' attempt status for a specific test
router.get('/test/:testId/status', auth_1.default, UserTestAttemptController.getTestAttemptsStatusController);
// Admin/Teacher gets a specific user's test attempt history
// Optional query param: ?testId=uuid
router.get('/user/:userId', auth_1.default, UserTestAttemptController.getUserTestAttemptsController);
exports.default = router;
