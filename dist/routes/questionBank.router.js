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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Ensure correct imports based on the shim
const multer_1 = __importDefault(require("multer"));
const QuestionBankController = __importStar(require("../controllers/questionBank.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// --- Multer Configuration for File Uploads ---
// Corrected: Accessing memoryStorage directly from the multer object, which the shim now allows
const storage = multer_1.default.memoryStorage();
// Type the fileFilter function with MulterFileFilterFunction
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter, // This now correctly matches MulterFileFilterFunction
    limits: {
        fileSize: 1024 * 1024 * 10 // 10 MB file size limit
    }
});
// --- Question Bank Routes ---
router.post('/create', auth_1.default, upload.single('pdfFile'), QuestionBankController.createQuestionBankController);
router.get('/', QuestionBankController.getAllQuestionBanksController);
router.get('/:id', QuestionBankController.getQuestionBankByIdController);
router.put('/:id', auth_1.default, upload.single('pdfFile'), QuestionBankController.updateQuestionBankController);
router.delete('/:id', auth_1.default, QuestionBankController.deleteQuestionBankController);
exports.default = router;
