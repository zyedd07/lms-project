"use strict";
// routes/Result.routes.ts
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
const ResultController = __importStar(require("../controllers/Result.controller"));
const auth_1 = __importStar(require("../middleware/auth"));
const router = express_1.default.Router();
// Get my results (authenticated user's own results)
router.get('/my-results', auth_1.default, ResultController.getMyResultsController);
// Get user statistics
router.get('/statistics/user/:userId', auth_1.default, ResultController.getUserStatisticsController);
// Get all results for a specific test (Admin only)
router.get('/test/:testId', auth_1.default, auth_1.authorizeAdmin, ResultController.getResultsByTestController);
// Get all results for a specific user
router.get('/user/:userId', auth_1.default, ResultController.getResultsByUserController);
// Get all results (Admin only) - This should be BEFORE /:id route
router.get('/all', auth_1.default, auth_1.authorizeAdmin, ResultController.getAllResultsController);
// Get result by ID - This should be LAST among GET routes
router.get('/:id', auth_1.default, ResultController.getResultByIdController);
// Create a new result (authenticated users)
router.post('/', auth_1.default, ResultController.createResultController);
// Delete a result (Admin only)
router.delete('/:id', auth_1.default, auth_1.authorizeAdmin, ResultController.deleteResultController);
exports.default = router;
