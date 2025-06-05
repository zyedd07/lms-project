// routes/questionBank.router.ts
import express from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import * as QuestionBankController from '../controllers/questionBank.controller'; // Changed path
import isAuth from '../middleware/auth'; // Changed path
import * as fs from 'fs';

const router = express.Router();

// --- Multer Configuration for File Uploads ---
const storage: StorageEngine = multer.diskStorage({
    destination: function (req: express.Request, file: multer.File, cb: (error: Error | null, destination: string) => void) {
        const uploadDir = 'uploads/question-banks/';
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req: express.Request, file: multer.File, cb: (error: Error | null, filename: string) => void) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req: express.Request, file: multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
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