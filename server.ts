import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './models';
require('dotenv').config(); // For environment variables

//Routers


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


app.use((err: any, req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

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