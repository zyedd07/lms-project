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
import UserWebinar from "../UserWebinar.model";
import Webinar from "../webinar.model";
import Order from "../Order.model";

const initAssociation = () => {

    // ============================================
    // ORDER ASSOCIATIONS
    // ============================================
    
    // Order belongs to User
    Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

    // Order belongs to Products (one of these will be filled per order)
    Order.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Course.hasMany(Order, { foreignKey: 'courseId', as: 'orders' });

    Order.belongsTo(QuestionBank, { foreignKey: 'qbankId', as: 'qbank' });
    QuestionBank.hasMany(Order, { foreignKey: 'qbankId', as: 'orders' });

    Order.belongsTo(TestSeries, { foreignKey: 'testSeriesId', as: 'testSeries' });
    TestSeries.hasMany(Order, { foreignKey: 'testSeriesId', as: 'orders' });

    Order.belongsTo(Webinar, { foreignKey: 'webinarId', as: 'webinar' });
    Webinar.hasMany(Order, { foreignKey: 'webinarId', as: 'orders' });

    // Order has many Payments
    Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });

    // ============================================
    // PAYMENT ASSOCIATIONS
    // ============================================
    
    // Payment belongs to User
    Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });

    // Payment belongs to Order
    Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

    // Payment belongs to Products (duplicated from order for quick reference)
    Payment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Course.hasMany(Payment, { foreignKey: 'courseId', as: 'payments' });

    Payment.belongsTo(QuestionBank, { foreignKey: 'qbankId', as: 'qbank' });
    QuestionBank.hasMany(Payment, { foreignKey: 'qbankId', as: 'payments' });

    Payment.belongsTo(TestSeries, { foreignKey: 'testSeriesId', as: 'testSeries' });
    TestSeries.hasMany(Payment, { foreignKey: 'testSeriesId', as: 'payments' });

    Payment.belongsTo(Webinar, { foreignKey: 'webinarId', as: 'webinar' });
    Webinar.hasMany(Payment, { foreignKey: 'webinarId', as: 'payments' });

    // Payment verified by Admin (User)
    Payment.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });
    User.hasMany(Payment, { foreignKey: 'verifiedBy', as: 'verifiedPayments' });

    // ============================================
    // USER WEBINAR ASSOCIATIONS
    // ============================================
    
    UserWebinar.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(UserWebinar, { foreignKey: 'userId', as: 'webinarEnrollments' });

    UserWebinar.belongsTo(Webinar, { foreignKey: 'webinarId', as: 'webinar' });
    Webinar.hasMany(UserWebinar, { foreignKey: 'webinarId', as: 'enrollments' });

    UserWebinar.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
    Payment.hasOne(UserWebinar, { foreignKey: 'paymentId', as: 'webinarEnrollment' });

    // ============================================
    // USER COURSE ASSOCIATIONS
    // ============================================
    
    UserCourse.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(UserCourse, { foreignKey: 'userId', as: 'courseEnrollments' });

    UserCourse.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Course.hasMany(UserCourse, { foreignKey: 'courseId', as: 'enrollments' });

    UserCourse.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
    Payment.hasOne(UserCourse, { foreignKey: 'paymentId', as: 'courseEnrollment' });

    // ============================================
    // USER TEST SERIES ASSOCIATIONS
    // ============================================
    
    UserTestSeries.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(UserTestSeries, { foreignKey: 'userId', as: 'testSeriesEnrollments' });

    UserTestSeries.belongsTo(TestSeries, { foreignKey: 'testSeriesId', as: 'testSeries' });
    TestSeries.hasMany(UserTestSeries, { foreignKey: 'testSeriesId', as: 'enrollments' });

    UserTestSeries.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
    Payment.hasOne(UserTestSeries, { foreignKey: 'paymentId', as: 'testSeriesEnrollment' });

    // ============================================
    // USER QBANK ASSOCIATIONS
    // ============================================
    
    UserQbank.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(UserQbank, { foreignKey: 'userId', as: 'qbankEnrollments' });

    UserQbank.belongsTo(QuestionBank, { foreignKey: 'qbankId', as: 'qbank' });
    QuestionBank.hasMany(UserQbank, { foreignKey: 'qbankId', as: 'enrollments' });

    UserQbank.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
    Payment.hasOne(UserQbank, { foreignKey: 'paymentId', as: 'qbankEnrollment' });

    // ============================================
    // COURSE ASSOCIATIONS
    // ============================================

    // Course and LiveLecture relationship
    Course.belongsToMany(LiveLecture, { through: CourseLiveLecture, foreignKey: 'courseId', as: 'liveLectures' });
    LiveLecture.belongsToMany(Course, { through: CourseLiveLecture, foreignKey: 'liveLectureId', as: 'courses' });

    // Course and TestSeries relationship
    Course.belongsToMany(TestSeries, { through: CourseTestSeries, foreignKey: 'courseId', as: 'testSeries' });
    TestSeries.belongsToMany(Course, { through: CourseTestSeries, foreignKey: 'testSeriesId', as: 'courses' });

    // Course and Teacher relationship
    Course.belongsToMany(Teacher, { through: CourseTeacher, foreignKey: 'courseId', as: 'teachers' });
    Teacher.belongsToMany(Course, { through: CourseTeacher, foreignKey: 'teacherId', as: 'courses' });

    Course.hasMany(CourseTeacher, { foreignKey: 'courseId', as: 'courseTeachers' });
    CourseTeacher.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

    Teacher.hasMany(CourseTeacher, { foreignKey: 'teacherId', as: 'teacherCourses' });
    CourseTeacher.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

    // Course and Category
    Course.belongsTo(Categories, { foreignKey: 'categoryId', as: 'category' });
    Categories.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

    // Course and Lectures
    Course.hasMany(Lecture, { foreignKey: 'courseId', as: 'lectures' });
    Lecture.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

    // Course uploader
    Course.belongsTo(User, { foreignKey: 'uploaderId', as: 'uploader' });
    User.hasMany(Course, { foreignKey: 'uploaderId', as: 'uploadedCourses' });

    // ============================================
    // TEST SERIES ASSOCIATIONS
    // ============================================
    
    // TestSeries and Test
    TestSeries.hasMany(Test, { foreignKey: 'testSeriesId', as: 'tests' });
    Test.belongsTo(TestSeries, { foreignKey: 'testSeriesId', as: 'testSeries' });

    // TestSeries creator
    TestSeries.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    User.hasMany(TestSeries, { foreignKey: 'createdBy', as: 'createdTestSeries' });

    // ============================================
    // TEST AND QUESTION ASSOCIATIONS
    // ============================================
    
    // Test and Question
    Test.hasMany(Question, { foreignKey: 'testId', as: 'testQuestions' });
    Question.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

    // ============================================
    // QUESTION BANK ASSOCIATIONS
    // ============================================
    
    // QuestionBank uploader
    QuestionBank.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
    User.hasMany(QuestionBank, { foreignKey: 'uploadedBy', as: 'uploadedQbanks' });

    // ============================================
    // BRAND ASSOCIATIONS
    // ============================================
    
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

    // ============================================
    // NOTIFICATION ASSOCIATIONS
    // ============================================
    
    User.hasMany(Notification, {
        foreignKey: 'userId',
        as: 'notifications'
    });

    Notification.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user'
    });

    // ============================================
    // DRUG INDEX ASSOCIATIONS
    // ============================================
    
    Drug.belongsTo(DrugCategory, {
        foreignKey: 'categoryId',
        as: 'category'
    });

    DrugCategory.hasMany(Drug, {
        foreignKey: 'categoryId',
        as: 'drugs'
    });
};

export default initAssociation;