import express from 'express';
// Removed multer imports as direct file uploads are no longer handled in these routes
// import multer, { FileFilterCallback, StorageEngine, File, MulterFileFilterFunction } from 'multer';
import * as QuestionBankController from '../controllers/questionBank.controller';
import isAuth from '../middleware/auth'; // Assuming this is your authentication middleware

const router = express.Router();

// --- Removed Multer Configuration ---
// The frontend now sends a file URL in the JSON body,
// so direct file upload middleware is no longer needed here.
// The actual file upload to storage should happen via a separate media upload endpoint.

// --- Question Bank Routes ---

// Route for creating a question bank
// No multer middleware needed here. The controller expects JSON body with 'fileUrl'.
router.post(
    '/create',
    isAuth,
    QuestionBankController.createQuestionBankController
);

// Route for getting all question banks
router.get(
    '/',
    QuestionBankController.getAllQuestionBanksController
);

// Route for getting a single question bank by ID
router.get(
    '/:id',
    QuestionBankController.getQuestionBankByIdController
);

// Route for updating a question bank
// No multer middleware needed here. The controller expects JSON body with 'fileUrl' if updated.
router.put(
    '/:id',
    isAuth,
    QuestionBankController.updateQuestionBankController
);

// Route for deleting a question bank
router.delete(
    '/:id',
    isAuth,
    QuestionBankController.deleteQuestionBankController
);

export default router;