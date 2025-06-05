import express from 'express';
// Ensure correct imports based on the shim
import multer, { FileFilterCallback, StorageEngine, File, MulterFileFilterFunction } from 'multer';
import * as QuestionBankController from '../controllers/questionBank.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

// --- Multer Configuration for File Uploads ---
// Corrected: Accessing memoryStorage directly from the multer object, which the shim now allows
const storage: StorageEngine = multer.memoryStorage();

// Type the fileFilter function with MulterFileFilterFunction
const fileFilter: MulterFileFilterFunction = (req: express.Request, file: File, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter, // This now correctly matches MulterFileFilterFunction
    limits: {
        fileSize: 1024 * 1024 * 10 // 10 MB file size limit
    }
});

// --- Question Bank Routes ---
router.post(
    '/create',
    isAuth,
    upload.single('pdfFile'),
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
    isAuth,
    upload.single('pdfFile'),
    QuestionBankController.updateQuestionBankController
);

router.delete(
    '/:id',
    isAuth,
    QuestionBankController.deleteQuestionBankController
);

export default router;