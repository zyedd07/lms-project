"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const models_1 = require("./models"); // Assuming this imports your Sequelize instance
require('dotenv').config();
// Add this line to log the DATABASE_URL
console.log("DATABASE_URL being used by application:", process.env.DATABASE_URL);
// Routers
const User_router_1 = __importDefault(require("./routes/User.router"));
const Teacher_router_1 = __importDefault(require("./routes/Teacher.router"));
const Category_router_1 = __importDefault(require("./routes/Category.router")); // This is likely for Course Categories
const Admin_router_1 = __importDefault(require("./routes/Admin.router"));
const Course_router_1 = __importDefault(require("./routes/Course.router"));
const TestSeries_router_1 = __importDefault(require("./routes/TestSeries.router"));
const Question_router_1 = __importDefault(require("./routes/Question.router"));
const Test_router_1 = __importDefault(require("./routes/Test.router"));
const questionBank_router_1 = __importDefault(require("./routes/questionBank.router"));
// --- ADDED: Webinar Router Import ---
const webinar_router_1 = __importDefault(require("./routes/webinar.router"));
// --- END ADDED ---
// --- NEW: Brand, BrandCategory, Company Router Imports ---
const brandCategory_router_1 = __importDefault(require("./routes/brandCategory.router")); // New Brand Category router
const company_router_1 = __importDefault(require("./routes/company.router")); // New Company router
const brand_router_1 = __importDefault(require("./routes/brand.router")); // New Brand router
// --- END NEW ---
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const allowedOrigins = [
    'http://localhost:3000', // Your React Admin Panel's local development URL
    // Add other local development origins if needed, e.g., for mobile device testing:
    // 'http://192.168.x.x:3000',
    // IMPORTANT: When your React Admin Panel is deployed to a live domain,
    // add that domain here. E.g.: 'https://admin.yourlms.com'
];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like React Native app or Postman)
        // OR if the origin is in our allowed list.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use((0, cors_1.default)(corsOptions));
app.get('/', (req, res) => {
    try {
        res.status(200).send("Server is up and running");
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});
// Routes
app.use('/user', User_router_1.default);
app.use('/teacher', Teacher_router_1.default);
app.use('/categories', Category_router_1.default); // This is likely for Course Categories
app.use('/admin', Admin_router_1.default);
app.use('/course', Course_router_1.default);
app.use('/testseries', TestSeries_router_1.default);
app.use('/question', Question_router_1.default);
app.use('/test', Test_router_1.default);
app.use('/question-banks', questionBank_router_1.default);
// --- ADDED: Webinar Route Mounting ---
app.use('/webinars', webinar_router_1.default); // Mount your webinar router here
// --- END ADDED ---
// --- NEW: Brand, BrandCategory, Company Route Mounting ---
app.use('/brand-categories', brandCategory_router_1.default); // API path for brand categories
app.use('/companies', company_router_1.default); // API path for companies
app.use('/brands', brand_router_1.default); // API path for brands
// --- END NEW ---
// Error handling middleware (ensure AuthenticatedRequest is correctly defined if used)
app.use((err, req, res, next) => {
    var _a, _b, _c, _d, _e, _f;
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    if ((err === null || err === void 0 ? void 0 : err.name) === "SequelizeDatabaseError") {
        statusCode = 400;
    }
    if ((_a = err === null || err === void 0 ? void 0 : err.original) === null || _a === void 0 ? void 0 : _a.message) {
        message = (_b = err === null || err === void 0 ? void 0 : err.original) === null || _b === void 0 ? void 0 : _b.message;
    }
    if ((_d = (_c = err === null || err === void 0 ? void 0 : err.errors) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) {
        message = (_f = (_e = err === null || err === void 0 ? void 0 : err.errors) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message;
        statusCode = 400;
    }
    res.status(statusCode).json({
        success: false,
        message: message,
    });
});
// Ensure these imports are correctly resolved in your project structure
require("./models/associations/index"); // Example: Path to your association setup
const index_1 = __importDefault(require("./models/associations/index")); // Example: Path to your association initialization function
(0, index_1.default)(); // Call the association initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Server is running on port: ${PORT}`);
        // IMPORTANT: Since you created the 'Webinars' table manually in Supabase,
        // we generally don't use `sequelize.sync({ alter: true })` in production.
        // `alter: false` is safer if you manage schema manually or with migrations.
        // If you are using `sequelize.define` without the `initialize` method,
        // simply importing the model (`import Webinar from './models/webinar.model';`)
        // is enough for Sequelize to register it.
        yield models_1.sequelize.sync({ alter: false }); // Syncs models with the database (no schema changes if alter: false)
        return console.log(`Database Connected`);
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}));
