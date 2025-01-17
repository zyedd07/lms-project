import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './models';
require('dotenv').config(); // For environment variables

//Routers
import userRouter from './routes/User.router';

const app = express();

// Built-in body parser for JSON
app.use(express.json());

// Built-in body parser for URL-encoded data
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
    origin: ['*'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
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


app.use((err: any, req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    if (err?.name === "SequelizeDatabaseError") {
        statusCode = 400;
    }
    if (err?.original?.message) {
        message = err?.original?.message
    }
    if(err?.errors?.[0]?.message){
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