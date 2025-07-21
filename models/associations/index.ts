import Categories from "../Categories.model";
import Course from "../Course.model";
import CourseLiveLecture from "../CourseLiveLecture.model";
import CourseTeacher from "../CourseTeacher.model";
import CourseTestSeries from "../CourseTestSeries.model";
// UserCourse is the new join table, replacing Enrollment
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



const initAssociation = () => {

    Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Order.belongsTo(QuestionBank, { foreignKey: 'qbankId', as: 'qbank' });
Order.belongsTo(TestSeries, { foreignKey: 'testSeriesId', as: 'testSeries' });
Order.belongsTo(Webinar, { foreignKey: 'webinarId', as: 'webinar' });
UserWebinar.belongsTo(User, { foreignKey: 'userId' });
// A UserWebinar belongs to a Webinar
UserWebinar.belongsTo(Webinar, { foreignKey: 'webinarId' });

// Define inverse associations (optional, but good for comprehensive model relationships)
// A User can have many UserWebinars
User.hasMany(UserWebinar, { foreignKey: 'userId' });
// A Webinar can have many UserWebinars
Webinar.hasMany(UserWebinar, { foreignKey: 'webinarId' });


    User.hasMany(UserCourse, { foreignKey: 'userId' });
    UserCourse.belongsTo(User, { foreignKey: 'userId' });
    Course.hasMany(UserCourse, { foreignKey: 'courseId' });
    UserCourse.belongsTo(Course, { foreignKey: 'courseId' });

    // --- User and Test Series Enrollment ---
    User.hasMany(UserTestSeries, { foreignKey: 'userId' });
    UserTestSeries.belongsTo(User, { foreignKey: 'userId' });
    TestSeries.hasMany(UserTestSeries, { foreignKey: 'testSeriesId' });
    UserTestSeries.belongsTo(TestSeries, { foreignKey: 'testSeriesId' });

    // --- User and Q-Bank Enrollment ---
    User.hasMany(UserQbank, { foreignKey: 'userId' });
    UserQbank.belongsTo(User, { foreignKey: 'userId' });
    QuestionBank.hasMany(UserQbank, { foreignKey: 'qbankId' });
    UserQbank.belongsTo(QuestionBank, { foreignKey: 'qbankId' });

    User.hasMany(Payment, { foreignKey: 'userId' });
    Payment.belongsTo(User, { foreignKey: 'userId' });

    Course.hasMany(Payment, { foreignKey: 'courseId' });
    Payment.belongsTo(Course, { foreignKey: 'courseId' });

    // Course and LiveLecture relationship
    Course.belongsToMany(LiveLecture, { through: CourseLiveLecture, foreignKey: 'courseId' });
    LiveLecture.belongsToMany(Course, { through: CourseLiveLecture, foreignKey: 'liveLectureId' });

    // Course and TestSeries relationship
    Course.belongsToMany(TestSeries, { through: CourseTestSeries, foreignKey: 'courseId' });
    TestSeries.belongsToMany(Course, { through: CourseTestSeries, foreignKey: 'testSeriesId' });

    // Course and Teacher relationship
    Course.belongsToMany(Teacher, { through: CourseTeacher, foreignKey: 'courseId', as: 'teachers' });
    Teacher.belongsToMany(Course, { through: CourseTeacher, foreignKey: 'teacherId', as: 'courses' });

    Course.hasMany(CourseTeacher, { foreignKey: 'courseId', as: 'courses' });
    CourseTeacher.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

    Teacher.hasMany(CourseTeacher, { foreignKey: 'teacherId', as: 'teacher' });
    CourseTeacher.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

    Course.belongsTo(Categories, { foreignKey: 'categoryId', as: 'category' });
    Categories.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

    // TestSeries and Test
    TestSeries.hasMany(Test, { foreignKey: 'testSeriesId', as: 'tests' });
    Test.belongsTo(TestSeries, { foreignKey: 'testSeriesId', as: 'testSeries' });

    // Test and Question
    Test.hasMany(Question, { foreignKey: 'testId', as: 'testQuestions' });
    Question.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

    Lecture.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Course.hasMany(Lecture, { foreignKey: 'courseId', as: 'lectures' });

    // --- NEW ASSOCIATIONS FOR BRAND, BRANDCATEGORY, AND COMPANY ---
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
    // --- END NEW ASSOCIATIONS ---

    // --- NOTIFICATION ASSOCIATIONS ---
    User.hasMany(Notification, {
        foreignKey: 'userId',
        as: 'notifications'
    });

    Notification.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user'
    });
    // --- END NOTIFICATION ASSOCIATIONS ---

    // --- DRUG INDEX ASSOCIATIONS ---
    Drug.belongsTo(DrugCategory, {
        foreignKey: 'categoryId',
        as: 'category'
    });

    DrugCategory.hasMany(Drug, {
        foreignKey: 'categoryId',
        as: 'drugs'
    });
    // --- END DRUG INDEX ASSOCIATIONS ---

    // --- FIX: ASSOCIATIONS FOR UPLOADER/CREATOR ---
    // Course uploader
    Course.belongsTo(User, { foreignKey: 'uploaderId', as: 'uploader' });
    // TestSeries creator
    TestSeries.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    // QuestionBank uploader
    QuestionBank.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
    // Question creator (assuming Question has a createdBy field referencing User)
    // If your Question model has a 'createdBy' field that links to User, add this:
    // Question.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    // --- END FIX ---
};

export default initAssociation;
