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
// --- REMOVED: The local QuestionBankData interface definition is no longer needed here ---
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
        // Extract and Validate Request Body Data
        const { name, description, price, fileUrl } = req.body; // Expecting fileUrl from frontend
        if (!name) {
            throw new httpError_1.default("Question bank name is required.", 400);
        }
        if (!fileUrl) {
            throw new httpError_1.default("PDF file URL is required for creating a question bank.", 400);
        }
        // Parse and validate price
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            throw new httpError_1.default("Price is required and must be a non-negative number.", 400);
        }
        // Derive fileName from fileUrl (e.g., last segment of the URL path)
        const fileName = fileUrl.split('/').pop() || 'untitled_file'; // Extract filename from URL
        // --- Call Service to Save Question Bank Details to Database ---
        const newQuestionBank = yield (0, questionBank_services_1.createQuestionBankService)({
            name: name,
            description: description,
            filePath: fileUrl, // Pass the URL as filePath
            fileName: fileName, // Pass the derived filename
            price: parsedPrice,
            uploadedBy: uploaderId, // Pass the uploaderId to the service
        });
        res.status(201).json({ success: true, data: newQuestionBank });
    }
    catch (error) {
        next(error); // Pass error to the error handling middleware
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
        // Now 'QuestionBankData' is correctly imported and should match service's return
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
        // This cast is no longer strictly necessary if QuestionBankData includes 'uploader'
        // but keeping it for now if your exact 'utils/types' is still in transition.
        if (((_c = questionBank.uploader) === null || _c === void 0 ? void 0 : _c.id) !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new httpError_1.default("Unauthorized to update this question bank.", 403);
        }
        const { name, description, price, fileUrl } = req.body; // Expecting fileUrl from frontend
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
        if (fileUrl !== undefined) {
            // Basic URL validation (can be more robust if needed)
            if (typeof fileUrl !== 'string' || !fileUrl.startsWith('http')) {
                throw new httpError_1.default("PDF File URL must be a valid URL (start with http/https).", 400);
            }
            updateFields.filePath = fileUrl;
            // Also update fileName if filePath changes
            updateFields.fileName = fileUrl.split('/').pop() || 'untitled_file';
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
        // This cast is no longer strictly necessary if QuestionBankData includes 'uploader'
        // but keeping it for now if your exact 'utils/types' is still in transition.
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
