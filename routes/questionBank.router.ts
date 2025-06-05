import express from 'express';
// Ensure all necessary Multer types are imported
import multer, { FileFilterCallback, StorageEngine, File } from 'multer';
import * as QuestionBankController from '../controllers/questionBank.controller'; // Adjusted path for flat structure
import isAuth from '../middleware/auth'; // Adjusted path for flat structure

const router = express.Router();

// --- Multer Configuration for File Uploads ---
// IMPORTANT: Changed to memoryStorage() for Supabase Storage integration.
// Files will be held in server memory as a Buffer before being uploaded to Supabase.
const storage: StorageEngine = multer.memoryStorage();

const fileFilter = (req: express.Request, file: File, cb: FileFilterCallback) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Only PDF files are allowed!'), false); // Reject other file types
    }
};

const upload = multer({
    storage: storage, // Now using memoryStorage
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 10 // 10 MB file size limit
    }
});

// --- Question Bank Routes ---

// Route for creating a new question bank (requires authentication and PDF file upload)
router.post(
    '/create',
    isAuth, // Authenticates the user
    upload.single('pdfFile'), // Handles a single file upload with input field name 'pdfFile'
    QuestionBankController.createQuestionBankController
);

// Route for fetching all question banks
router.get(
    '/',
    QuestionBankController.getAllQuestionBanksController
);

// Route for fetching a single question bank by ID
router.get(
    '/:id',
    QuestionBankController.getQuestionBankByIdController
);

// Route for updating an existing question bank (requires authentication and allows PDF file update)
router.put(
    '/:id',
    isAuth, // Authenticates the user
    upload.single('pdfFile'), // Allows updating the PDF file
    QuestionBankController.updateQuestionBankController
);

// Route for deleting a question bank (requires authentication)
router.delete(
    '/:id',
    isAuth, // Authenticates the user
    QuestionBankController.deleteQuestionBankController
);

export default router;