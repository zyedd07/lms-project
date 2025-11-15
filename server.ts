import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { sequelize } from './models'; // Assuming this imports your Sequelize instance
require('dotenv').config();

// Add this line to log the DATABASE_URL
console.log("DATABASE_URL being used by application:", process.env.DATABASE_URL);

// Routers
import userRouter from './routes/User.router';
import teacherRouter from './routes/teacher.router'; 
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
import drugRouter from './routes/Drug.router'; 
import drugCategoryRouter from './routes/DrugCategory.router';
import homeContentRouter from './routes/HomeContent.router';

import userCourseRouter from './routes/UserCourse.router';
import userTestSeriesRouter from './routes/UserTestSeries.router';
import userQbankRouter from './routes/UserQbank.router';
import helpCenterRouter from './routes/HelpCenter.router';
import termsRouter from './routes/TermsSection.router'; // Make sure the filename matches
import paymentGatewayRoutes from './routes/PaymentGateway.router';
import paymentProcessingRoutes from './routes/PaymentProcessing.router';
import paymentWebhookRoutes from './routes/PaymentWebhook.router'; // Import the new webhook router
import userWebinarRoutes from './routes/UserWebinar.router'; // The new UserWebinar routes
import mediaFileRouter from './routes/Mediafile.router'; // The new UserWebinar routes
import adminPaymentVerifyRouter from './routes/AdminPayment.router';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    'http://localhost:3000',
    'https://d33203vzrqpmtm.cloudfront.net' 
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform'],
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
app.use('/teachers', teacherRouter); // Using the new teacher router
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
app.use('/drugs', drugRouter);
app.use('/drug-categories', drugCategoryRouter);
app.use('/home-content', homeContentRouter);
app.use('/user-courses', userCourseRouter);
app.use('/user-test-series', userTestSeriesRouter);
app.use('/user-qbanks', userQbankRouter);
app.use('/help-center', helpCenterRouter);
app.use('/terms-sections', termsRouter);
app.use('/payment-gateway', paymentGatewayRoutes);
app.use('/payments', paymentProcessingRoutes);
app.use('/webhooks', paymentWebhookRoutes);
app.use('/user-webinars', userWebinarRoutes);
app.use('/media-file', mediaFileRouter);
app.use('/admin/payments', adminPaymentVerifyRouter);


process.on('unhandledRejection', (reason, promise) => {
  console.error('--- UNHANDLED REJECTION ---');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('--- END UNHANDLED REJECTION ---');
});

process.on('uncaughtException', (error) => {
  console.error('--- UNCAUGHT EXCEPTION ---');
  console.error('Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  console.error('--- END UNCAUGHT EXCEPTION ---');
  process.exit(1);
});

// --- UPDATED Error handling middleware ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // --- ADD THIS LINE TO LOG THE ERROR ---
    console.error("[GLOBAL ERROR HANDLER]:", err);

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
import initAssociation from './models/associations/index';

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
