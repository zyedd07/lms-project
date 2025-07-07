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
const initAssociation = () => {
    // --- NEW: User and Course relationship through UserCourse ---
    // This replaces the old Enrollment model associations.
    User_model_1.default.belongsToMany(Course_model_1.default, { through: UserCourse_model_1.default, foreignKey: 'userId', as: 'enrolledCourses' });
    Course_model_1.default.belongsToMany(User_model_1.default, { through: UserCourse_model_1.default, foreignKey: 'courseId', as: 'enrolledUsers' });
    // --- OLD Enrollment model relationships have been removed ---
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
};
exports.default = initAssociation;
