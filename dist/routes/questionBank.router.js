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
// Removed multer imports as direct file uploads are no longer handled in these routes
// import multer, { FileFilterCallback, StorageEngine, File, MulterFileFilterFunction } from 'multer';
const QuestionBankController = __importStar(require("../controllers/questionBank.controller"));
const auth_1 = __importDefault(require("../middleware/auth")); // Assuming this is your authentication middleware
const router = express_1.default.Router();
// --- Removed Multer Configuration ---
// The frontend now sends a file URL in the JSON body,
// so direct file upload middleware is no longer needed here.
// The actual file upload to storage should happen via a separate media upload endpoint.
// --- Question Bank Routes ---
// Route for creating a question bank
// No multer middleware needed here. The controller expects JSON body with 'fileUrl'.
router.post('/create', auth_1.default, QuestionBankController.createQuestionBankController);
// Route for getting all question banks
router.get('/', QuestionBankController.getAllQuestionBanksController);
// Route for getting a single question bank by ID
router.get('/:id', QuestionBankController.getQuestionBankByIdController);
// Route for updating a question bank
// No multer middleware needed here. The controller expects JSON body with 'fileUrl' if updated.
router.put('/:id', auth_1.default, QuestionBankController.updateQuestionBankController);
// Route for deleting a question bank
router.delete('/:id', auth_1.default, QuestionBankController.deleteQuestionBankController);
exports.default = router;
