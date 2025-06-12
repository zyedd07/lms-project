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

// --- ADDED: Webinar Router Import ---
import webinarRouter from './routes/webinar.router';
// --- END ADDED ---

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    'http://localhost:3000', // Your React Admin Panel's local development URL
    // Add other local development origins if needed, e.g., for mobile device testing:
    // 'http://192.168.x.x:3000',

    // IMPORTANT: When your React Admin Panel is deployed to a live domain,
    // add that domain here. E.g.: 'https://admin.yourlms.com'
];

const corsOptions: CorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like React Native app or Postman)
        // OR if the origin is in our allowed list.
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

// --- ADDED: Webinar Route Mounting ---
app.use('/webinars', webinarRouter); // Mount your webinar router here
// --- END ADDED ---

// Error handling middleware (ensure AuthenticatedRequest is correctly defined if used)
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

// Ensure these imports are correctly resolved in your project structure
import './models/associations/index'; // Example: Path to your association setup
import { AuthenticatedRequest } from './middleware/auth'; // Example: Path to your AuthenticatedRequest type definition
import initAssociation from './models/associations/index'; // Example: Path to your association initialization function
import Webinar from './models/webinar.model'; // Ensure Webinar model is imported for Sequelize to recognize it

initAssociation(); // Call the association initialization

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    try {
        console.log(`Server is running on port: ${PORT}`);
        // IMPORTANT: Since you created the 'Webinars' table manually in Supabase,
        // we generally don't use `sequelize.sync({ alter: true })` in production.
        // `alter: false` is safer if you manage schema manually or with migrations.
        // If you are using `sequelize.define` without the `initialize` method,
        // simply importing the model (`import Webinar from './models/webinar.model';`)
        // is enough for Sequelize to register it.
        await sequelize.sync({ alter: false }); // Syncs models with the database (no schema changes if alter: false)
        return console.log(`Database Connected`);
    } catch (err) {
        console.log(err);
        throw err;
    }
});
