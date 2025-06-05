
import express from 'express';
import multer from 'multer'; // Import multer for file uploads
import * as QuestionBankController from '../controllers/questionBank.controller'; // Assuming this path is correct
import isAuth from '../middleware/auth'; // Your authentication middleware

const router = express.Router();

// --- Multer Configuration for File Uploads ---
// IMPORTANT: For production, you will need a storage solution like Supabase Storage.
// This example uses `multer.diskStorage` for local file storage, which is suitable
// for development but NOT for deployment where your server instances are ephemeral.
//
// For Supabase Storage, you'd integrate the Supabase client or a custom storage engine
// here, so files are uploaded directly to your Supabase Buckets.
// Example:
// const storage = multer.memoryStorage(); // Store file in memory if you handle upload to Supabase Storage in service/controller
// const upload = multer({ storage: storage });
//
// If you are using a library like `@supabase/storage-js` in your service layer
// to handle the actual upload to Supabase, `multer` can simply parse the incoming file.
// For demonstration, we'll use disk storage.

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create the directory if it doesn't exist
        const uploadDir = 'uploads/question-banks/';
        require('fs').mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir); // Files will be stored in this directory
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded file
        // Appending timestamp to avoid name collisions
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --- Question Bank Routes ---

// Route for creating a new question bank (requires authentication and file upload)
router.post(
    '/create',
    isAuth, // Authenticates the user
    upload.single('pdfFile'), // Handles a single file upload with field name 'pdfFile'
    QuestionBankController.createQuestionBankController
);

// Route for getting all question banks (no authentication required by default, adjust as needed)
router.get(
    '/',
    QuestionBankController.getAllQuestionBanksController
);

// Route for getting a single question bank by ID (no authentication required by default)
router.get(
    '/:id',
    QuestionBankController.getQuestionBankByIdController
);

// Route for updating an existing question bank (requires authentication and allows file update)
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
