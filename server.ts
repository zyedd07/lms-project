import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './models';
require('dotenv').config(); // For environment variables

//Routers
import userRouter from './routes/User.router';
import teacherRouter from './routes/Teacher.router';
import categoryRouter from './routes/Category.router';
import adminRouter from './routes/Admin.router';
import courseRouter from './routes/Course.router';
import testSeriesRouter from './routes/TestSeries.router'
import  questionRouter from './routes/Question.router'
import optionRouter from './routes/Option.router'
import testRouter from "./routes/Test.router"

const app = express();


app.use(express.json());


app.use(express.urlencoded({ extended: true }));
const corsOptions = {
    origin: ['*'],
    optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));

app.get('/', (req: Request, res: Response) => {
    try {
        res.status(200).send("Server is up and running");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
})

//Routes
app.use('/user', userRouter);
app.use('/teacher', teacherRouter);
app.use('/categories', categoryRouter);
app.use('/admin', adminRouter);
app.use('/course', courseRouter);
app.use('/testseries', testSeriesRouter);
app.use('/question' , questionRouter)
app.use('/option' , optionRouter)
app.use('/test', testRouter)



app.use((err: any, req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    if (err?.name === "SequelizeDatabaseError") {
        statusCode = 400;
    }
    if (err?.original?.message) {
        message = err?.original?.message
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

initAssociation();

const PORT = process.env.PORT
app.listen(PORT, async () => {
    try {
        console.log(`Server is running on port: ${PORT}`);
        await sequelize.sync({ alter: false });
        return console.log(`Database Connected`);
    } catch (err) {
        console.log(err)
        throw err;
    }
});