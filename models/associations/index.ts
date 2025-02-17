import Categories from "../Categories.model";
import Course from "../Course.model";
import CourseLiveLecture from "../CourseLiveLecture.model";
import CourseTeacher from "../CourseTeacher.model";
import CourseTestSeries from "../CourseTestSeries.model";
import Enrollment from "../Enrollment.model";
import Lecture from "../Lecture.model";
import LiveLecture from "../LiveLecture.model";
import Payment from "../Payment.model";
import Teacher from "../Teacher.model";
import TestSeries from "../TestSeries.model";
import User from "../User.model";
import Test from "../Test.model";
import Question from "../Question.model";
import TestOption from "../Option.model"; 

const initAssociation = () => {
    // Relationships
    User.hasMany(Enrollment, { foreignKey: 'userId' });
    Enrollment.belongsTo(User, { foreignKey: 'userId' });

    Course.hasMany(Enrollment, { foreignKey: 'courseId' });
    Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

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
    Test.hasMany(Question, { foreignKey: 'testId', as: 'questions' });
    Question.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

    // Question and Option (using TestOption model)
    Question.hasMany(TestOption, { foreignKey: 'questionId', as: 'options' });
    TestOption.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

    Lecture.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Course.hasMany(Lecture, { foreignKey: 'courseId', as: 'lectures' });
};

export default initAssociation;
