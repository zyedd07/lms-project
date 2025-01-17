import Batch from "../Batch.model";
import Course from "../Course.model";
import CourseDemoVideo from "../CourseDemoVideos.model";
import CourseLiveLecture from "../CourseLiveLecture.model";
import CourseTeacher from "../CourseTeacher.model";
import CourseTestSeries from "../CourseTestSeries.model";
import DemoVideo from "../DemoVideos.model";
import Enrollment from "../Enrollment.model";
import LiveLecture from "../LiveLecture.model";
import Payment from "../Payment.model";
import Teacher from "../Teacher.model";
import TestSeries from "../TestSeries.model";
import User from "../User.model";

const initAssociation = () => {
    // Relationships
    User.hasMany(Enrollment, { foreignKey: 'userId' });
    Enrollment.belongsTo(User, { foreignKey: 'userId' });

    Course.hasMany(Enrollment, { foreignKey: 'courseId' });
    Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

    Course.hasMany(Batch, { foreignKey: 'courseId' });
    Batch.belongsTo(Course, { foreignKey: 'courseId' });

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

    // Course and DemoVideo relationship
    Course.belongsToMany(DemoVideo, { through: CourseDemoVideo, foreignKey: 'courseId' });
    DemoVideo.belongsToMany(Course, { through: CourseDemoVideo, foreignKey: 'demoVideoId' });

    // Course and Teacher relationship
    Course.belongsToMany(Teacher, { through: CourseTeacher, foreignKey: 'courseId' });
    Teacher.belongsToMany(Course, { through: CourseTeacher, foreignKey: 'teacherId' });



}

export default initAssociation;