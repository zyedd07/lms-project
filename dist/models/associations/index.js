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
// UserCourse is the new join table, replacing Enrollment
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
const initAssociation = () => {
    Order_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId', as: 'user' });
    Order_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId', as: 'course' });
    Order_model_1.default.belongsTo(QuestionBank_model_1.default, { foreignKey: 'qbankId', as: 'qbank' });
    Order_model_1.default.belongsTo(TestSeries_model_1.default, { foreignKey: 'testSeriesId', as: 'testSeries' });
    Order_model_1.default.belongsTo(webinar_model_1.default, { foreignKey: 'webinarId', as: 'webinar' });
    UserWebinar_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    // A UserWebinar belongs to a Webinar
    UserWebinar_model_1.default.belongsTo(webinar_model_1.default, { foreignKey: 'webinarId' });
    // Define inverse associations (optional, but good for comprehensive model relationships)
    // A User can have many UserWebinars
    User_model_1.default.hasMany(UserWebinar_model_1.default, { foreignKey: 'userId' });
    // A Webinar can have many UserWebinars
    webinar_model_1.default.hasMany(UserWebinar_model_1.default, { foreignKey: 'webinarId' });
    User_model_1.default.hasMany(UserCourse_model_1.default, { foreignKey: 'userId' });
    UserCourse_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    Course_model_1.default.hasMany(UserCourse_model_1.default, { foreignKey: 'courseId' });
    UserCourse_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId' });
    // --- User and Test Series Enrollment ---
    User_model_1.default.hasMany(UserTestSeries_model_1.default, { foreignKey: 'userId' });
    UserTestSeries_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    TestSeries_model_1.default.hasMany(UserTestSeries_model_1.default, { foreignKey: 'testSeriesId' });
    UserTestSeries_model_1.default.belongsTo(TestSeries_model_1.default, { foreignKey: 'testSeriesId' });
    // --- User and Q-Bank Enrollment ---
    User_model_1.default.hasMany(UserQbank_model_1.default, { foreignKey: 'userId' });
    UserQbank_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    QuestionBank_model_1.default.hasMany(UserQbank_model_1.default, { foreignKey: 'qbankId' });
    UserQbank_model_1.default.belongsTo(QuestionBank_model_1.default, { foreignKey: 'qbankId' });
    User_model_1.default.hasMany(Payment_model_1.default, { foreignKey: 'userId' });
    Payment_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    Course_model_1.default.hasMany(Payment_model_1.default, { foreignKey: 'courseId' });
    Payment_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId' });
    // Course and LiveLecture relationship
    Course_model_1.default.belongsToMany(LiveLecture_model_1.default, { through: CourseLiveLecture_model_1.default, foreignKey: 'courseId' });
    LiveLecture_model_1.default.belongsToMany(Course_model_1.default, { through: CourseLiveLecture_model_1.default, foreignKey: 'liveLectureId' });
    // Course and TestSeries relationship
    Course_model_1.default.belongsToMany(TestSeries_model_1.default, { through: CourseTestSeries_model_1.default, foreignKey: 'courseId' });
    TestSeries_model_1.default.belongsToMany(Course_model_1.default, { through: CourseTestSeries_model_1.default, foreignKey: 'testSeriesId' });
    // Course and Teacher relationship
    Course_model_1.default.belongsToMany(Teacher_model_1.default, { through: CourseTeacher_model_1.default, foreignKey: 'courseId', as: 'teachers' });
    Teacher_model_1.default.belongsToMany(Course_model_1.default, { through: CourseTeacher_model_1.default, foreignKey: 'teacherId', as: 'courses' });
    Course_model_1.default.hasMany(CourseTeacher_model_1.default, { foreignKey: 'courseId', as: 'courses' });
    CourseTeacher_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId', as: 'course' });
    Teacher_model_1.default.hasMany(CourseTeacher_model_1.default, { foreignKey: 'teacherId', as: 'teacher' });
    CourseTeacher_model_1.default.belongsTo(Teacher_model_1.default, { foreignKey: 'teacherId', as: 'teacher' });
    Course_model_1.default.belongsTo(Categories_model_1.default, { foreignKey: 'categoryId', as: 'category' });
    Categories_model_1.default.hasMany(Course_model_1.default, { foreignKey: 'categoryId', as: 'courses' });
    // TestSeries and Test
    TestSeries_model_1.default.hasMany(Test_model_1.default, { foreignKey: 'testSeriesId', as: 'tests' });
    Test_model_1.default.belongsTo(TestSeries_model_1.default, { foreignKey: 'testSeriesId', as: 'testSeries' });
    // Test and Question
    Test_model_1.default.hasMany(Question_model_1.default, { foreignKey: 'testId', as: 'testQuestions' });
    Question_model_1.default.belongsTo(Test_model_1.default, { foreignKey: 'testId', as: 'test' });
    Lecture_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId', as: 'course' });
    Course_model_1.default.hasMany(Lecture_model_1.default, { foreignKey: 'courseId', as: 'lectures' });
    // --- NEW ASSOCIATIONS FOR BRAND, BRANDCATEGORY, AND COMPANY ---
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
    // --- END NEW ASSOCIATIONS ---
    // --- NOTIFICATION ASSOCIATIONS ---
    User_model_1.default.hasMany(Notification_model_1.default, {
        foreignKey: 'userId',
        as: 'notifications'
    });
    Notification_model_1.default.belongsTo(User_model_1.default, {
        foreignKey: 'userId',
        as: 'user'
    });
    // --- END NOTIFICATION ASSOCIATIONS ---
    // --- DRUG INDEX ASSOCIATIONS ---
    Drug_model_1.default.belongsTo(DrugCategory_model_1.default, {
        foreignKey: 'categoryId',
        as: 'category'
    });
    DrugCategory_model_1.default.hasMany(Drug_model_1.default, {
        foreignKey: 'categoryId',
        as: 'drugs'
    });
    // --- END DRUG INDEX ASSOCIATIONS ---
    // --- FIX: ASSOCIATIONS FOR UPLOADER/CREATOR ---
    // Course uploader
    Course_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'uploaderId', as: 'uploader' });
    // TestSeries creator
    TestSeries_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'createdBy', as: 'creator' });
    // QuestionBank uploader
    QuestionBank_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'uploadedBy', as: 'uploader' });
    // Question creator (assuming Question has a createdBy field referencing User)
    // If your Question model has a 'createdBy' field that links to User, add this:
    // Question.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    // --- END FIX ---
};
exports.default = initAssociation;
