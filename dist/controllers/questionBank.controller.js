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
exports.deleteQuestionBankController = exports.updateQuestionBankController = exports.getQuestionBankByIdController = exports.getAllQuestionBanksController = exports.createQuestionBankController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const questionBank_services_1 = require("../services/questionBank.services");
/**
 * Creates a new Question Bank record in the database, using a provided file URL.
 * The actual file upload to storage is assumed to be handled by a separate media service/process.
 */
const createQuestionBankController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // --- Authorization and Data Validation ---
        const uploaderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get uploader ID from authenticated user
        if (!uploaderId) {
            throw new httpError_1.default("Unauthorized: User ID missing.", 401);
        }
        const { name, description, price, filePath } = req.body;
        if (!name) {
            throw new httpError_1.default("Question bank name is required.", 400);
        }
        if (!filePath) {
            throw new httpError_1.default("PDF file URL is required for creating a question bank.", 400);
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            throw new httpError_1.default("Price is required and must be a non-negative number.", 400);
        }
        // --- UPDATED FILENAME EXTRACTION ---
        const urlObj = new URL(filePath);
        const rawFileName = urlObj.pathname.split('/').pop();
        const fileName = rawFileName ? rawFileName.split('?')[0].split('#')[0] : 'untitled_file';
        // --- END UPDATED FILENAME EXTRACTION ---
        // --- Call Service to Save Question Bank Details to Database ---
        const newQuestionBank = yield (0, questionBank_services_1.createQuestionBankService)({
            name: name,
            description: description,
            filePath: filePath, // Pass the full URL as filePath
            fileName: fileName, // Pass the extracted filename
            price: parsedPrice,
            uploadedBy: uploaderId, // Pass the uploaderId to the service
        });
        res.status(201).json({ success: true, data: newQuestionBank });
    }
    catch (error) {
        console.error("Error caught in createQuestionBankController (before passing to middleware):", error);
        next(error);
    }
});
exports.createQuestionBankController = createQuestionBankController;
/**
 * Retrieves all Question Banks from the database, including uploader information.
 */
const getAllQuestionBanksController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionBanks = yield (0, questionBank_services_1.getAllQuestionBanksService)();
        res.status(200).json({ success: true, data: questionBanks });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllQuestionBanksController = getAllQuestionBanksController;
/**
 * Retrieves a single Question Bank by its ID, including uploader information.
 */
const getQuestionBankByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const questionBank = yield (0, questionBank_services_1.getQuestionBankByIdService)(id);
        if (!questionBank) {
            throw new httpError_1.default("Question bank not found.", 404);
        }
        res.status(200).json({ success: true, data: questionBank });
    }
    catch (error) {
        next(error);
    }
});
exports.getQuestionBankByIdController = getQuestionBankByIdController;
/**
 * Updates an existing Question Bank record in the database.
 * It now accepts a new file URL from the request body if the file needs to be changed.
 * The deletion/upload of the actual file from storage is assumed to be handled by a separate media service.
 */
const updateQuestionBankController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        // --- Authorization ---
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId || !userRole) {
            throw new httpError_1.default("Unauthorized: User information missing.", 401);
        }
        // Find the question bank to check authorization
        const questionBank = yield (0, questionBank_services_1.getQuestionBankByIdService)(id);
        if (!questionBank) {
            throw new httpError_1.default("Question bank not found.", 404);
        }
        // Check if the user is authorized to update (uploader, admin, or teacher)
        if (((_c = questionBank.uploader) === null || _c === void 0 ? void 0 : _c.id) !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new httpError_1.default("Unauthorized to update this question bank.", 403);
        }
        const { name, description, price, filePath } = req.body;
        // Prepare fields for update
        const updateFields = {};
        if (name !== undefined)
            updateFields.name = name;
        if (description !== undefined)
            updateFields.description = description;
        // Handle price update
        if (price !== undefined) {
            const parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                throw new httpError_1.default("Price must be a non-negative number.", 400);
            }
            updateFields.price = parsedPrice;
        }
        // Handle file URL update (if a new URL is provided)
        if (filePath !== undefined) {
            if (typeof filePath !== 'string' || !filePath.startsWith('http')) {
                throw new httpError_1.default("PDF File URL must be a valid URL (start with http/https).", 400);
            }
            updateFields.filePath = filePath;
            // --- UPDATED FILENAME EXTRACTION FOR UPDATE ---
            const urlObj = new URL(filePath);
            const rawFileName = urlObj.pathname.split('/').pop();
            updateFields.fileName = rawFileName ? rawFileName.split('?')[0].split('#')[0] : 'untitled_file';
            // --- END UPDATED FILENAME EXTRACTION ---
        }
        // --- Perform Database Update via Service ---
        const updatedQuestionBank = yield (0, questionBank_services_1.updateQuestionBankService)(id, updateFields);
        res.status(200).json({ success: true, data: updatedQuestionBank });
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuestionBankController = updateQuestionBankController;
/**
 * Deletes a Question Bank record from the database.
 * The deletion of the associated PDF file from storage is assumed to be handled
 * by a separate media service or a manual process if no longer referenced.
 */
const deleteQuestionBankController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        // --- Authorization ---
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId || !userRole) {
            throw new httpError_1.default("Unauthorized: User information missing.", 401);
        }
        // Find the question bank to check authorization
        const questionBank = yield (0, questionBank_services_1.getQuestionBankByIdService)(id);
        if (!questionBank) {
            throw new httpError_1.default("Question bank not found.", 404);
        }
        // Check if the user is authorized to delete (uploader, admin, or teacher)
        if (((_c = questionBank.uploader) === null || _c === void 0 ? void 0 : _c.id) !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new httpError_1.default("Unauthorized to delete this question bank.", 403);
        }
        // --- Delete Question Bank Record from Database via Service ---
        const response = yield (0, questionBank_services_1.deleteQuestionBankService)(id);
        res.status(200).json({ success: true, message: response.message });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuestionBankController = deleteQuestionBankController;
