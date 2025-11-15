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
const teacher_router_1 = __importDefault(require("./routes/teacher.router"));
const Category_router_1 = __importDefault(require("./routes/Category.router"));
const Admin_router_1 = __importDefault(require("./routes/Admin.router"));
const Course_router_1 = __importDefault(require("./routes/Course.router"));
const TestSeries_router_1 = __importDefault(require("./routes/TestSeries.router"));
const Question_router_1 = __importDefault(require("./routes/Question.router"));
const Test_router_1 = __importDefault(require("./routes/Test.router"));
const questionBank_router_1 = __importDefault(require("./routes/questionBank.router"));
const webinar_router_1 = __importDefault(require("./routes/webinar.router"));
const brandCategory_router_1 = __importDefault(require("./routes/brandCategory.router"));
const company_router_1 = __importDefault(require("./routes/company.router"));
const brand_router_1 = __importDefault(require("./routes/brand.router"));
const Notification_router_1 = __importDefault(require("./routes/Notification.router"));
const Article_router_1 = __importDefault(require("./routes/Article.router"));
const Drug_router_1 = __importDefault(require("./routes/Drug.router"));
const DrugCategory_router_1 = __importDefault(require("./routes/DrugCategory.router"));
const HomeContent_router_1 = __importDefault(require("./routes/HomeContent.router"));
const UserCourse_router_1 = __importDefault(require("./routes/UserCourse.router"));
const UserTestSeries_router_1 = __importDefault(require("./routes/UserTestSeries.router"));
const UserQbank_router_1 = __importDefault(require("./routes/UserQbank.router"));
const HelpCenter_router_1 = __importDefault(require("./routes/HelpCenter.router"));
const TermsSection_router_1 = __importDefault(require("./routes/TermsSection.router")); // Make sure the filename matches
const PaymentGateway_router_1 = __importDefault(require("./routes/PaymentGateway.router"));
const PaymentProcessing_router_1 = __importDefault(require("./routes/PaymentProcessing.router"));
const PaymentWebhook_router_1 = __importDefault(require("./routes/PaymentWebhook.router")); // Import the new webhook router
const UserWebinar_router_1 = __importDefault(require("./routes/UserWebinar.router")); // The new UserWebinar routes
const Mediafile_router_1 = __importDefault(require("./routes/Mediafile.router")); // The new UserWebinar routes
const AdminPayment_router_1 = __importDefault(require("./routes/AdminPayment.router"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const allowedOrigins = [
    'http://localhost:3000',
    'https://d33203vzrqpmtm.cloudfront.net'
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform'],
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
app.use('/teachers', teacher_router_1.default); // Using the new teacher router
app.use('/categories', Category_router_1.default);
app.use('/admin', Admin_router_1.default);
app.use('/course', Course_router_1.default);
app.use('/testseries', TestSeries_router_1.default);
app.use('/question', Question_router_1.default);
app.use('/test', Test_router_1.default);
app.use('/question-banks', questionBank_router_1.default);
app.use('/webinars', webinar_router_1.default);
app.use('/brand-categories', brandCategory_router_1.default);
app.use('/companies', company_router_1.default);
app.use('/brands', brand_router_1.default);
app.use('/notifications', Notification_router_1.default);
app.use('/articles', Article_router_1.default);
app.use('/drugs', Drug_router_1.default);
app.use('/drug-categories', DrugCategory_router_1.default);
app.use('/home-content', HomeContent_router_1.default);
app.use('/user-courses', UserCourse_router_1.default);
app.use('/user-test-series', UserTestSeries_router_1.default);
app.use('/user-qbanks', UserQbank_router_1.default);
app.use('/help-center', HelpCenter_router_1.default);
app.use('/terms-sections', TermsSection_router_1.default);
app.use('/payment-gateway', PaymentGateway_router_1.default);
app.use('/payments', PaymentProcessing_router_1.default);
app.use('/webhooks', PaymentWebhook_router_1.default);
app.use('/user-webinars', UserWebinar_router_1.default);
app.use('/media-file', Mediafile_router_1.default);
app.use('/admin/payments', AdminPayment_router_1.default);
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
app.use((err, req, res, next) => {
    var _a, _b, _c, _d, _e, _f;
    // --- ADD THIS LINE TO LOG THE ERROR ---
    console.error("[GLOBAL ERROR HANDLER]:", err);
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
require("./models/associations/index");
const index_1 = __importDefault(require("./models/associations/index"));
(0, index_1.default)();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Server is running on port: ${PORT}`);
        yield models_1.sequelize.sync({ alter: false });
        return console.log(`Database Connected`);
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}));
