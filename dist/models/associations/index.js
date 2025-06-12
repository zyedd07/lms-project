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
const Enrollment_model_1 = __importDefault(require("../Enrollment.model"));
const Lecture_model_1 = __importDefault(require("../Lecture.model"));
const LiveLecture_model_1 = __importDefault(require("../LiveLecture.model"));
const Payment_model_1 = __importDefault(require("../Payment.model"));
const Teacher_model_1 = __importDefault(require("../Teacher.model"));
const TestSeries_model_1 = __importDefault(require("../TestSeries.model"));
const User_model_1 = __importDefault(require("../User.model"));
const Test_model_1 = __importDefault(require("../Test.model"));
const Question_model_1 = __importDefault(require("../Question.model"));
// import TestOption from "../Option.model"; // Correctly commented out
const initAssociation = () => {
    // Relationships
    User_model_1.default.hasMany(Enrollment_model_1.default, { foreignKey: 'userId' });
    Enrollment_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId' });
    Course_model_1.default.hasMany(Enrollment_model_1.default, { foreignKey: 'courseId' });
    Enrollment_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId' });
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
    // CHANGING THE ALIAS HERE TO 'testQuestions' to ensure uniqueness
    Test_model_1.default.hasMany(Question_model_1.default, { foreignKey: 'testId', as: 'testQuestions' });
    Question_model_1.default.belongsTo(Test_model_1.default, { foreignKey: 'testId', as: 'test' });
    Lecture_model_1.default.belongsTo(Course_model_1.default, { foreignKey: 'courseId', as: 'course' });
    Course_model_1.default.hasMany(Lecture_model_1.default, { foreignKey: 'courseId', as: 'lectures' });
};
exports.default = initAssociation;
