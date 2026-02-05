import Categories from "../Categories.model";
import Course from "../Course.model";
import CourseLiveLecture from "../CourseLiveLecture.model";
import CourseTeacher from "../CourseTeacher.model";
import CourseTestSeries from "../CourseTestSeries.model";
import UserCourse from "../UserCourse.model"; 
import Lecture from "../Lecture.model";
import LiveLecture from "../LiveLecture.model";
import Payment from "../Payment.model";
import Teacher from "../Teacher.model";
import TestSeries from "../TestSeries.model";
import User from "../User.model";
import Test from "../Test.model";
import Question from "../Question.model";
import Brand from '../Brand.model';
import BrandCategory from '../BrandCategory.model';
import Company from '../Company.model';
import Notification from "../Notification.model";
import Drug from "../Drug.model"; 
import DrugCategory from "../DrugCategory.model"; 
import UserTestSeries from "../UserTestSeries.model";
import UserQbank from "../UserQbank.model";
import QuestionBank from "../QuestionBank.model";
import TermsSection from "../TermsOfService.model";
import HelpCenterSection from "../HelpCenter.model";
import UserWebinar from "../UserWebinar.model"
import Webinar from "../webinar.model"
import Order from "../Order.model";
import Result from '../Result.model';
import UserTestAttempt from '../UserTestAttempt.model';

const initAssociation = () => {
 Result.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Result.belongsTo(Test, { foreignKey: 'testId', as: 'test' });
    User.hasMany(Result, { foreignKey: 'userId', as: 'results' });
    Test.hasMany(Result, { foreignKey: 'testId', as: 'results' });

UserTestAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserTestAttempt.belongsTo(Test, { foreignKey: 'testId', as: 'test' });
UserTestAttempt.belongsTo(User, { foreignKey: 'grantedBy', as: 'admin' });

User.hasMany(UserTestAttempt, { foreignKey: 'userId' });
Test.hasMany(UserTestAttempt, { foreignKey: 'testId' });

    // ===== ORDER ASSOCIATIONS (MUST BE FIRST) =====
    // Order belongs to User
    Order.belongsTo(User, { foreignKey: 'userid', as: 'user' });
    User.hasMany(Order, { foreignKey: 'userid', as: 'orders' });

    // Order belongs to Products (only one will be filled per order)
    Order.belongsTo(Course, { foreignKey: 'courseid', as: 'course' });
    Order.belongsTo(QuestionBank, { foreignKey: 'qbankid', as: 'qbank' });
    Order.belongsTo(TestSeries, { foreignKey: 'testseriesid', as: 'testSeries' });
    Order.belongsTo(Webinar, { foreignKey: 'webinarid', as: 'webinar' });

    // ===== PAYMENT ASSOCIATIONS =====
    // Payment belongs to Order
    Payment.belongsTo(Order, { foreignKey: 'orderid', as: 'order' });
    Order.hasMany(Payment, { foreignKey: 'orderid', as: 'payments' });

    // Payment belongs to User
    Payment.belongsTo(User, { foreignKey: 'userid', as: 'user' });
    User.hasMany(Payment, { foreignKey: 'userid', as: 'payments' });

    // Payment verified by Admin (User)
    Payment.belongsTo(User, { foreignKey: 'verifiedby', as: 'verifier' });

    // Legacy Payment-Course association (if needed for backward compatibility)
    Course.hasMany(Payment, { foreignKey: 'courseid' });
    Payment.belongsTo(Course, { foreignKey: 'courseid' });

    // ===== USER WEBINAR ASSOCIATIONS =====
    UserWebinar.belongsTo(User, { foreignKey: 'userId' });
    UserWebinar.belongsTo(Webinar, { foreignKey: 'webinarId' });
    User.hasMany(UserWebinar, { foreignKey: 'userId' });
    Webinar.hasMany(UserWebinar, { foreignKey: 'webinarId' });

    // ===== USER COURSE ASSOCIATIONS =====
    User.hasMany(UserCourse, { foreignKey: 'userId' });
    UserCourse.belongsTo(User, { foreignKey: 'userId' });
    Course.hasMany(UserCourse, { foreignKey: 'courseId' });
    UserCourse.belongsTo(Course, { foreignKey: 'courseId' });

    // ===== USER TEST SERIES ASSOCIATIONS =====
    User.hasMany(UserTestSeries, { foreignKey: 'userId' });
    UserTestSeries.belongsTo(User, { foreignKey: 'userId' });
    TestSeries.hasMany(UserTestSeries, { foreignKey: 'testSeriesId' });
    UserTestSeries.belongsTo(TestSeries, { foreignKey: 'testSeriesId' });

    // ===== USER QBANK ASSOCIATIONS =====
    User.hasMany(UserQbank, { foreignKey: 'userId' });
    UserQbank.belongsTo(User, { foreignKey: 'userId' });
    QuestionBank.hasMany(UserQbank, { foreignKey: 'qbankId' });
    UserQbank.belongsTo(QuestionBank, { foreignKey: 'qbankId' });

    // ===== COURSE ASSOCIATIONS =====
    Course.belongsToMany(LiveLecture, { through: CourseLiveLecture, foreignKey: 'courseId' });
    LiveLecture.belongsToMany(Course, { through: CourseLiveLecture, foreignKey: 'liveLectureId' });

    Course.belongsToMany(TestSeries, { through: CourseTestSeries, foreignKey: 'courseId' });
    TestSeries.belongsToMany(Course, { through: CourseTestSeries, foreignKey: 'testSeriesId' });

    Course.belongsToMany(Teacher, { through: CourseTeacher, foreignKey: 'courseId', as: 'teachers' });
    Teacher.belongsToMany(Course, { through: CourseTeacher, foreignKey: 'teacherId', as: 'courses' });

    Course.hasMany(CourseTeacher, { foreignKey: 'courseId', as: 'courses' });
    CourseTeacher.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

    Teacher.hasMany(CourseTeacher, { foreignKey: 'teacherId', as: 'teacher' });
    CourseTeacher.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

    Course.belongsTo(Categories, { foreignKey: 'categoryId', as: 'category' });
    Categories.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

    // ===== TEST SERIES ASSOCIATIONS =====
    TestSeries.hasMany(Test, { foreignKey: 'testSeriesId', as: 'tests' });
    Test.belongsTo(TestSeries, { foreignKey: 'testSeriesId', as: 'testSeries' });

    // ===== TEST AND QUESTION ASSOCIATIONS =====
    Test.hasMany(Question, { foreignKey: 'testId', as: 'testQuestions' });
    Question.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

    // ===== LECTURE ASSOCIATIONS =====
    Lecture.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Course.hasMany(Lecture, { foreignKey: 'courseId', as: 'lectures' });

    // ===== BRAND ASSOCIATIONS =====
    Brand.belongsTo(BrandCategory, {
        foreignKey: 'brandCategoryId',
        as: 'brandCategory'
    });

    BrandCategory.hasMany(Brand, {
        foreignKey: 'brandCategoryId',
        as: 'brands'
    });

    Brand.belongsTo(Company, {
        foreignKey: 'companyId',
        as: 'company'
    });

    Company.hasMany(Brand, {
        foreignKey: 'companyId',
        as: 'brands'
    });

    // ===== NOTIFICATION ASSOCIATIONS =====
    User.hasMany(Notification, {
        foreignKey: 'userId',
        as: 'notifications'
    });

    Notification.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user'
    });

    // ===== DRUG INDEX ASSOCIATIONS =====
    Drug.belongsTo(DrugCategory, {
        foreignKey: 'categoryId',
        as: 'category'
    });

    DrugCategory.hasMany(Drug, {
        foreignKey: 'categoryId',
        as: 'drugs'
    });

    // ===== UPLOADER/CREATOR ASSOCIATIONS =====
    Course.belongsTo(User, { foreignKey: 'uploaderId', as: 'uploader' });
    TestSeries.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    QuestionBank.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
};

export default initAssociation;