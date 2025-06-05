import express from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer'; // Ensure all types are imported
import * as QuestionBankController from '../controllers/questionBank.controller';
import isAuth from '../middleware/auth'; // Your authentication middleware
import * as fs from 'fs'; // Import the fs module

const router = express.Router();

// --- Multer Configuration for File Uploads ---

// Explicitly define the StorageEngine type for clarity
const storage: StorageEngine = multer.diskStorage({
    destination: function (req: express.Request, file: multer.File, cb: (error: Error | null, destination: string) => void) {
        // Ensure the directory exists
        const uploadDir = 'uploads/question-banks/';
        fs.mkdirSync(uploadDir, { recursive: true }); // Use fs.mkdirSync
        cb(null, uploadDir); // Files will be stored in this directory
    }, // Added comma here to separate properties
    filename: function (req: express.Request, file: multer.File, cb: (error: Error | null, filename: string) => void) {
        // Define the filename for the uploaded file
        // Appending timestamp to avoid name collisions
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Explicitly define the fileFilter function's type for robustness
const fileFilter = (req: express.Request, file: multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // Accept the file
    } else {
        // Pass an Error object and false to reject the file
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 10 // 10 MB file size limit
    }
});

// --- Question Bank Routes ---

router.post(
    '/create',
    isAuth, // Authenticates the user
    upload.single('pdfFile'), // Handles a single file upload with field name 'pdfFile'
    QuestionBankController.createQuestionBankController
);

router.get(
    '/',
    QuestionBankController.getAllQuestionBanksController
);

router.get(
    '/:id',
    QuestionBankController.getQuestionBankByIdController
);

router.put(
    '/:id',
    isAuth, // Authenticates the user
    upload.single('pdfFile'), // Allows updating the PDF file
    QuestionBankController.updateQuestionBankController
);

router.delete(
    '/:id', // Corrected from '/id' to '/:id' for dynamic ID
    isAuth, // Authenticates the user
    QuestionBankController.deleteQuestionBankController
);

export default router;