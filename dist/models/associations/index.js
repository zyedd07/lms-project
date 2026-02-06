"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Categories_model_1 = __importDefault(require("../Categories.model"));
const Course_model_1 = __importDefault(require("../Course.model"));
const CourseLiveLecture_model_1 = __importDefault(require("../CourseLiveLecture.model"));
const CourseTeacher_model_1 = __importDefault(require("../CourseTeacher.model"));
const CourseTestSeries_model_1 = __importDefault(require("../CourseTestSeries.model"));
const UserCourse_model_1 = __importDefault(require("../UserCourse.model"));
const Lecture_model_1 = __importDefault(require("../Lecture.model"));
const LiveLecture_model_1 = __importDefault(require("../LiveLecture.model"));
const Payment_model_1 = __importDefault(require("../Payment.model"));
const Teacher_model_1 = __importDefault(require("../Teacher.model"));
const TestSeries_model_1 = __importDefault(require("../TestSeries.model"));
const User_model_1 = __importDefault(require("../User.model"));
const Test_model_1 = __importDefault(require("../Test.model"));
const Question_model_1 = __importDefault(require("../Question.model"));
const Brand_model_1 = __importDefault(require("../Brand.model"));
const BrandCategory_model_1 = __importDefault(require("../BrandCategory.model"));
const Company_model_1 = __importDefault(require("../Company.model"));
const Notification_model_1 = __importDefault(require("../Notification.model"));
const Drug_model_1 = __importDefault(require("../Drug.model"));
const DrugCategory_model_1 = __importDefault(require("../DrugCategory.model"));
const UserTestSeries_model_1 = __importDefault(require("../UserTestSeries.model"));
const UserQbank_model_1 = __importDefault(require("../UserQbank.model"));
const QuestionBank_model_1 = __importDefault(require("../QuestionBank.model"));
const UserWebinar_model_1 = __importDefault(require("../UserWebinar.model"));
const webinar_model_1 = __importDefault(require("../webinar.model"));
const Order_model_1 = __importDefault(require("../Order.model"));
const Result_model_1 = __importDefault(require("../Result.model"));
const Usertestattempt_model_1 = __importDefault(require("../Usertestattempt.model"));
const initAssociation = () => {
    Result_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId', as: 'user' });
    Result_model_1.default.belongsTo(Test_model_1.default, { foreignKey: 'testId', as: 'test' });
    User_model_1.default.hasMany(Result_model_1.default, { foreignKey: 'userId', as: 'results' });
    Test_model_1.default.hasMany(Result_model_1.default, { foreignKey: 'testId', as: 'results' });
    Usertestattempt_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId', as: 'user' });
    Usertestattempt_model_1.default.belongsTo(Test_model_1.default, { foreignKey: 'testId', as: 'test' });
    Usertestattempt_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'grantedBy', as: 'admin' });
    User_model_1.default.hasMany(Usertestattempt_model_1.default, { foreignKey: 'userId' });
    Test_model_1.default.hasMany(Usertestattempt_model_1.default, { foreignKey: 'testId' });
    // ===== ORDER ASSOCIATIONS (MUST BE FIRST) =====
    // Order belongs to User
    Order_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userid', as: 'user' });
    User_model_1.default.hasMany(Order_model_1.default, { foreignKey: 'userid', as: 'orders' });
    // Order belongs to Products (only one will be filled per order)
    Order_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseid', as: 'course' });
    Order_model_1.default.belongsTo(QuestionBank_model_1.default, { foreignKey: 'qbankid', as: 'qbank' });
    Order_model_1.default.belongsTo(TestSeries_model_1.default, { foreignKey: 'testseriesid', as: 'testSeries' });
    Order_model_1.default.belongsTo(webinar_model_1.default, { foreignKey: 'webinarid', as: 'webinar' });
    // ===== PAYMENT ASSOCIATIONS =====
    // Payment belongs to Order
    Payment_model_1.default.belongsTo(Order_model_1.default, { foreignKey: 'orderid', as: 'order' });
    Order_model_1.default.hasMany(Payment_model_1.default, { foreignKey: 'orderid', as: 'payments' });
    // Payment belongs to User
    Payment_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userid', as: 'user' });
    User_model_1.default.hasMany(Payment_model_1.default, { foreignKey: 'userid', as: 'payments' });
    // Payment verified by Admin (User)
    Payment_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'verifiedby', as: 'verifier' });
    // Legacy Payment-Course association (if needed for backward compatibility)
    Course_model_1.default.hasMany(Payment_model_1.default, { foreignKey: 'courseid' });
    Payment_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseid' });
    // ===== USER WEBINAR ASSOCIATIONS =====
    UserWebinar_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    UserWebinar_model_1.default.belongsTo(webinar_model_1.default, { foreignKey: 'webinarId' });
    User_model_1.default.hasMany(UserWebinar_model_1.default, { foreignKey: 'userId' });
    webinar_model_1.default.hasMany(UserWebinar_model_1.default, { foreignKey: 'webinarId' });
    // ===== USER COURSE ASSOCIATIONS =====
    User_model_1.default.hasMany(UserCourse_model_1.default, { foreignKey: 'userId' });
    UserCourse_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    Course_model_1.default.hasMany(UserCourse_model_1.default, { foreignKey: 'courseId' });
    UserCourse_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId' });
    // ===== USER TEST SERIES ASSOCIATIONS =====
    User_model_1.default.hasMany(UserTestSeries_model_1.default, { foreignKey: 'userId' });
    UserTestSeries_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    TestSeries_model_1.default.hasMany(UserTestSeries_model_1.default, { foreignKey: 'testSeriesId' });
    UserTestSeries_model_1.default.belongsTo(TestSeries_model_1.default, { foreignKey: 'testSeriesId' });
    // ===== USER QBANK ASSOCIATIONS =====
    User_model_1.default.hasMany(UserQbank_model_1.default, { foreignKey: 'userId' });
    UserQbank_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    QuestionBank_model_1.default.hasMany(UserQbank_model_1.default, { foreignKey: 'qbankId' });
    UserQbank_model_1.default.belongsTo(QuestionBank_model_1.default, { foreignKey: 'qbankId' });
    // ===== COURSE ASSOCIATIONS =====
    Course_model_1.default.belongsToMany(LiveLecture_model_1.default, { through: CourseLiveLecture_model_1.default, foreignKey: 'courseId' });
    LiveLecture_model_1.default.belongsToMany(Course_model_1.default, { through: CourseLiveLecture_model_1.default, foreignKey: 'liveLectureId' });
    Course_model_1.default.belongsToMany(TestSeries_model_1.default, { through: CourseTestSeries_model_1.default, foreignKey: 'courseId' });
    TestSeries_model_1.default.belongsToMany(Course_model_1.default, { through: CourseTestSeries_model_1.default, foreignKey: 'testSeriesId' });
    Course_model_1.default.belongsToMany(Teacher_model_1.default, { through: CourseTeacher_model_1.default, foreignKey: 'courseId', as: 'teachers' });
    Teacher_model_1.default.belongsToMany(Course_model_1.default, { through: CourseTeacher_model_1.default, foreignKey: 'teacherId', as: 'courses' });
    Course_model_1.default.hasMany(CourseTeacher_model_1.default, { foreignKey: 'courseId', as: 'courses' });
    CourseTeacher_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId', as: 'course' });
    Teacher_model_1.default.hasMany(CourseTeacher_model_1.default, { foreignKey: 'teacherId', as: 'teacher' });
    CourseTeacher_model_1.default.belongsTo(Teacher_model_1.default, { foreignKey: 'teacherId', as: 'teacher' });
    Course_model_1.default.belongsTo(Categories_model_1.default, { foreignKey: 'categoryId', as: 'category' });
    Categories_model_1.default.hasMany(Course_model_1.default, { foreignKey: 'categoryId', as: 'courses' });
    // ===== TEST SERIES ASSOCIATIONS =====
    TestSeries_model_1.default.hasMany(Test_model_1.default, { foreignKey: 'testSeriesId', as: 'tests' });
    Test_model_1.default.belongsTo(TestSeries_model_1.default, { foreignKey: 'testSeriesId', as: 'testSeries' });
    // ===== TEST AND QUESTION ASSOCIATIONS =====
    Test_model_1.default.hasMany(Question_model_1.default, { foreignKey: 'testId', as: 'testQuestions' });
    Question_model_1.default.belongsTo(Test_model_1.default, { foreignKey: 'testId', as: 'test' });
    // ===== LECTURE ASSOCIATIONS =====
    Lecture_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId', as: 'course' });
    Course_model_1.default.hasMany(Lecture_model_1.default, { foreignKey: 'courseId', as: 'lectures' });
    // ===== BRAND ASSOCIATIONS =====
    Brand_model_1.default.belongsTo(BrandCategory_model_1.default, {
        foreignKey: 'brandCategoryId',
        as: 'brandCategory'
    });
    BrandCategory_model_1.default.hasMany(Brand_model_1.default, {
        foreignKey: 'brandCategoryId',
        as: 'brands'
    });
    Brand_model_1.default.belongsTo(Company_model_1.default, {
        foreignKey: 'companyId',
        as: 'company'
    });
    Company_model_1.default.hasMany(Brand_model_1.default, {
        foreignKey: 'companyId',
        as: 'brands'
    });
    // ===== NOTIFICATION ASSOCIATIONS =====
    User_model_1.default.hasMany(Notification_model_1.default, {
        foreignKey: 'userId',
        as: 'notifications'
    });
    Notification_model_1.default.belongsTo(User_model_1.default, {
        foreignKey: 'userId',
        as: 'user'
    });
    // ===== DRUG INDEX ASSOCIATIONS =====
    Drug_model_1.default.belongsTo(DrugCategory_model_1.default, {
        foreignKey: 'categoryId',
        as: 'category'
    });
    DrugCategory_model_1.default.hasMany(Drug_model_1.default, {
        foreignKey: 'categoryId',
        as: 'drugs'
    });
    // ===== UPLOADER/CREATOR ASSOCIATIONS =====
    Course_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'uploaderId', as: 'uploader' });
    TestSeries_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'createdBy', as: 'creator' });
    QuestionBank_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'uploadedBy', as: 'uploader' });
};
exports.default = initAssociation;
