import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors'; // <-- ADDED CorsOptions import here
import { sequelize } from './models';
require('dotenv').config(); // For environment variables

// Add this line to log the DATABASE_URL
console.log("DATABASE_URL being used by application:", process.env.DATABASE_URL);

//Routers
import userRouter from './routes/User.router';
import teacherRouter from './routes/Teacher.router';
import categoryRouter from './routes/Category.router';
import adminRouter from './routes/Admin.router';
import courseRouter from './routes/Course.router';
import testSeriesRouter from './routes/TestSeries.router';
import questionRouter from './routes/Question.router';
import optionRouter from './routes/Option.router';
import testRouter from "./routes/Test.router"; // Corrected import for testRouter

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CORRECTED CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:3000', // Your React Admin Panel's local development URL
  // Add other local development origins if needed, e.g., for mobile device testing:
  // 'http://192.168.x.x:3000',

  // IMPORTANT: When your React Admin Panel is deployed to a live domain,
  // add that domain here. E.g.: 'https://admin.yourlms.com'
];

const corsOptions: CorsOptions = { // <-- Applied CorsOptions type here
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) { // <-- Added types for origin and callback
      // Allow requests with no origin (like React Native app or Postman)
      // OR if the origin is in our allowed list.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods for your API
    credentials: true, // <--- This MUST be true if your frontend sends cookies/auth headers
    optionsSuccessStatus: 204 // For preflight requests
};

app.use(cors(corsOptions)); // Apply the corrected CORS middleware

app.get('/', (req: Request, res: Response) => {
    try {
        res.status(200).send("Server is up and running");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

//Routes
app.use('/user', userRouter);
app.use('/teacher', teacherRouter);
app.use('/categories', categoryRouter);
app.use('/admin', adminRouter);
app.use('/course', courseRouter);
app.use('/testseries', testSeriesRouter);
app.use('/question' , questionRouter);
app.use('/option' , optionRouter);
app.use('/test', testRouter);


// Error handling middleware (ensure AuthenticatedRequest is correctly defined if used)
app.use((err: any, req: Request, res: Response, next: NextFunction) => { // Changed req: AuthenticatedRequest to req: Request for general error handling
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

initAssociation(); // Call the association initialization

const PORT = process.env.PORT || 5000; // Provide a default port for local development
app.listen(PORT, async () => {
    try {
        console.log(`Server is running on port: ${PORT}`);
        await sequelize.sync({ alter: false }); // Syncs models with the database
        return console.log(`Database Connected`);
    } catch (err) {
        console.log(err);
        throw err; // Re-throw error to indicate server startup failure
    }
});
