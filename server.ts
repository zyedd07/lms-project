import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { sequelize } from './models'; // Assuming this imports your Sequelize instance
require('dotenv').config();

// Add this line to log the DATABASE_URL
console.log("DATABASE_URL being used by application:", process.env.DATABASE_URL);

// Routers
import userRouter from './routes/User.router';
import teacherRouter from './routes/Teacher.router';
import categoryRouter from './routes/Category.router';
import adminRouter from './routes/Admin.router';
import courseRouter from './routes/Course.router';
import testSeriesRouter from './routes/TestSeries.router';
import questionRouter from './routes/Question.router';
import testRouter from "./routes/Test.router";
import questionBankRouter from './routes/questionBank.router';
import webinarRouter from './routes/webinar.router';
import brandCategoryRouter from './routes/brandCategory.router';
import companyRouter from './routes/company.router';
import brandRouter from './routes/brand.router';
import notificationRouter from './routes/Notification.router';
import articleRouter from './routes/Article.router';
import drugRouter from './routes/Drug.router'; // --- NEW: Drug Router Import ---
import drugCategoryRouter from './routes/DrugCategory.router'; // --- NEW: Drug Category Router Import ---

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    'http://localhost:3000', // Your React Admin Panel's local development URL
];

const corsOptions: CorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.get('/', (req: Request, res: Response) => {
    try {
        res.status(200).send("Server is up and running");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

// Routes
app.use('/user', userRouter);
app.use('/teacher', teacherRouter);
app.use('/categories', categoryRouter);
app.use('/admin', adminRouter);
app.use('/course', courseRouter);
app.use('/testseries', testSeriesRouter);
app.use('/question' , questionRouter);
app.use('/test', testRouter);
app.use('/question-banks', questionBankRouter);
app.use('/webinars', webinarRouter);
app.use('/brand-categories', brandCategoryRouter);
app.use('/companies', companyRouter);
app.use('/brands', brandRouter);
app.use('/notifications', notificationRouter);
app.use('/articles', articleRouter);
app.use('/drugs', drugRouter); // --- NEW: Drug Route Mounting ---
app.use('/drug-categories', drugCategoryRouter); // --- NEW: Drug Category Route Mounting ---


// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err?.name === "SequelizeDatabaseError") {
        statusCode = 400;
    }
    if (err?.original?.message) {
        message = err?.original?.message;
    }
    if (err?.errors?.[0]?.message) {
        message = err?.errors?.[0]?.message;
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
    });
});

import './models/associations/index';
import { AuthenticatedRequest } from './middleware/auth';
import initAssociation from './models/associations/index';
import Webinar from './models/webinar.model';
import Brand from './models/Brand.model';
import BrandCategory from './models/BrandCategory.model';
import Company from './models/Company.model';
import Notification from './models/Notification.model';
import Article from './models/Article.model'; // Import Article model
import Drug from './models/Drug.model'; // Import Drug model
import DrugCategory from './models/DrugCategory.model'; // Import DrugCategory model

initAssociation();

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    try {
        console.log(`Server is running on port: ${PORT}`);
        await sequelize.sync({ alter: false });
        return console.log(`Database Connected`);
    } catch (err) {
        console.log(err);
        throw err;
    }
});
