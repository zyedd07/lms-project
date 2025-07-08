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
const supabase_js_1 = require("@supabase/supabase-js");
const questionBank_services_1 = require("../services/questionBank.services"); // Import service functions
// Supabase client setup using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using SERVICE_ROLE_KEY for server-side
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
/**
 * Creates a new Question Bank, uploads the associated PDF file to Supabase Storage,
 * and saves the question bank details (including price and uploader) to the database.
 */
const createQuestionBankController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // --- Authorization and File Validation ---
        const uploaderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get uploader ID from authenticated user
        if (!uploaderId) {
            throw new httpError_1.default("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new httpError_1.default("PDF file is required for creating a question bank.", 400);
        }
        // --- Extract and Validate Request Body Data ---
        const { name, description, price } = req.body; // Destructure price from req.body
        if (!name) {
            throw new httpError_1.default("Question bank name is required.", 400);
        }
        // Parse and validate price
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            throw new httpError_1.default("Price is required and must be a non-negative number.", 400);
        }
        // --- File Handling and Supabase Upload ---
        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname;
        const fileMimeType = req.file.mimetype;
        // Create a unique path for the file in Supabase Storage
        const supabaseFilePath = `question-banks/${uploaderId}/${Date.now()}-${originalFileName}`;
        const { data: uploadData, error: uploadError } = yield supabase.storage
            .from('question-banks')
            .upload(supabaseFilePath, fileBuffer, {
            contentType: fileMimeType,
            upsert: false, // Do not overwrite existing files
        });
        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            throw new httpError_1.default(`Failed to upload PDF file to storage: ${uploadError.message}`, 500);
        }
        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
            .from('question-banks')
            .getPublicUrl(supabaseFilePath);
        const filePublicUrl = publicUrlData === null || publicUrlData === void 0 ? void 0 : publicUrlData.publicUrl;
        if (!filePublicUrl) {
            throw new httpError_1.default("Failed to get public URL for uploaded file.", 500);
        }
        // --- Call Service to Save Question Bank Details to Database ---
        const newQuestionBank = yield (0, questionBank_services_1.createQuestionBankService)({
            name: name,
            description: description,
            filePath: filePublicUrl,
            fileName: originalFileName,
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
        // FIX: Call the service function that includes uploader data
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
        // FIX: Call the service function that includes uploader data
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
 * Updates an existing Question Bank, optionally replacing its PDF file,
 * and updates its details (including price) in the database.
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
        // Cast to 'any' to allow access to 'uploader' property if QuestionBankData type is not yet updated
        const questionBank = yield (0, questionBank_services_1.getQuestionBankByIdService)(id);
        if (!questionBank) {
            throw new httpError_1.default("Question bank not found.", 404);
        }
        // Check if the user is authorized to update (uploader, admin, or teacher)
        if (((_c = questionBank.uploader) === null || _c === void 0 ? void 0 : _c.id) !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new httpError_1.default("Unauthorized to update this question bank.", 403);
        }
        const { name, description, price } = req.body;
        let filePublicUrl = undefined;
        let originalFileName = undefined;
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
        // --- Handle File Replacement (if a new file is provided) ---
        if (req.file) {
            // Delete old file from Supabase Storage
            if (questionBank.filePath) {
                const oldFilePathInBucket = questionBank.filePath.split('/').slice(8).join('/');
                const { error: deleteError } = yield supabase.storage
                    .from('question-banks')
                    .remove([oldFilePathInBucket]);
                if (deleteError) {
                    console.error("Supabase Delete Old File Error:", deleteError);
                    throw new httpError_1.default(`Failed to delete old PDF file from storage: ${deleteError.message}`, 500);
                }
            }
            // Upload the new file
            const fileBuffer = req.file.buffer;
            originalFileName = req.file.originalname;
            const fileMimeType = req.file.mimetype;
            const supabaseFilePath = `question-banks/${userId}/${Date.now()}-${originalFileName}`; // Use current user's ID for new file path
            const { data: uploadData, error: uploadError } = yield supabase.storage
                .from('question-banks')
                .upload(supabaseFilePath, fileBuffer, {
                contentType: fileMimeType,
                upsert: false,
            });
            if (uploadError) {
                console.error("Supabase Upload Error:", uploadError);
                throw new httpError_1.default(`Failed to upload new PDF file to storage: ${uploadError.message}`, 500);
            }
            // Get public URL for the new file
            const { data: publicUrlData } = supabase.storage
                .from('question-banks')
                .getPublicUrl(supabaseFilePath);
            filePublicUrl = publicUrlData === null || publicUrlData === void 0 ? void 0 : publicUrlData.publicUrl;
            if (!filePublicUrl) {
                throw new httpError_1.default("Failed to get public URL for new uploaded file.", 500);
            }
            updateFields.filePath = filePublicUrl;
            updateFields.fileName = originalFileName;
        }
        // --- Perform Database Update via Service ---
        // FIX: Call the updateQuestionBankService
        const updatedQuestionBank = yield (0, questionBank_services_1.updateQuestionBankService)(id, updateFields);
        res.status(200).json({ success: true, data: updatedQuestionBank });
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuestionBankController = updateQuestionBankController;
/**
 * Deletes a Question Bank record and its associated PDF file from Supabase Storage.
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
        // Cast to 'any' to allow access to 'uploader' property if QuestionBankData type is not yet updated
        const questionBank = yield (0, questionBank_services_1.getQuestionBankByIdService)(id);
        if (!questionBank) {
            throw new httpError_1.default("Question bank not found.", 404);
        }
        // Check if the user is authorized to delete (uploader, admin, or teacher)
        if (((_c = questionBank.uploader) === null || _c === void 0 ? void 0 : _c.id) !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new httpError_1.default("Unauthorized to delete this question bank.", 403);
        }
        // --- Delete File from Supabase Storage ---
        if (questionBank.filePath) {
            const filePathInBucket = questionBank.filePath.split('/').slice(8).join('/');
            const { error: deleteError } = yield supabase.storage
                .from('question-banks')
                .remove([filePathInBucket]);
            if (deleteError) {
                console.error("Supabase Delete Error:", deleteError);
                throw new httpError_1.default(`Failed to delete PDF file from storage: ${deleteError.message}`, 500);
            }
        }
        // --- Delete Question Bank Record from Database via Service ---
        // FIX: Call the deleteQuestionBankService
        const response = yield (0, questionBank_services_1.deleteQuestionBankService)(id);
        res.status(200).json({ success: true, message: response.message });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuestionBankController = deleteQuestionBankController;
