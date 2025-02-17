import Categories from "../models/Categories.model";
import Course from "../models/Course.model";
import CourseTeacher from "../models/CourseTeacher.model";
import Teacher from "../models/Teacher.model";
import { CourseTeacherServiceOperation } from "../utils/constants";
import HttpError from "../utils/httpError";
import { CourseTeacherServiceOperationType, CreateCourseServiceParams, GetAllCourseServiceParams, GetCourseFilters, UpdateCourseServiceParams } from "../utils/types";

export const createCourseService = async (params: CreateCourseServiceParams) => {
    try {
        const existingCourse = await Course.findOne({
            where: { name: params.name, categoryId: params.categoryId },
        })
        if (existingCourse) {
            throw new HttpError("Course already exists with the same name and category", 400);
        }

        const newCourse = await Course.create({
            name: params.name,
            description: params.description,
            imageUrl: params.imageUrl,
            categoryId: params.categoryId,
            price: params.price,
            courseType: params.courseType,
            demoVideoUrl: params.demoVideoUrl
        });
        return newCourse;
    } catch (error) {
        throw error;
    }
}

export const updateCourseService = async (id: string, params: UpdateCourseServiceParams) => {
    try {
        const course = await Course.findOne({
            where: { id: id }
        });
        if (!course) {
            throw new HttpError('Course not found', 404);
        }
        await Course.update(params, {
            where: { id: id }
        });
        return { message: 'Course updated successfully' };
    } catch (error) {
        throw error;
    }
}

export const getAllCoursesService = async ({ categoryId, id, active }: GetAllCourseServiceParams, filters?: GetCourseFilters) => {
    try {
        let whereClause: any = {};
        if (id) {
            let whereClause: any = { id };
            if (active === true || active === false) {
                whereClause.active = active;
            }
            const courseData = await Course.findOne({
                where: whereClause,
                include: [
                    {
                        model: Teacher,
                        through: { attributes: [] }, // Exclude CourseTeacher join table fields
                        as: 'teachers',
                        required: false,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Categories,
                        as: 'category',
                        required: false,
                        attributes: ['id', 'name']
                    }
                ],
                limit: filters?.limit,
                offset: filters?.offset
            })
            if (!courseData) {
                throw new HttpError('Course not found', 404);
            }
            return courseData;
        }
        else {
            if (categoryId) {
                whereClause.categoryId = categoryId;
            }
            if (active === true || active === false) {
                whereClause.active = active;
            }
            const courses = await Course.findAll({
                where: whereClause,
                limit: filters?.limit,
                offset: filters?.offset
            });
            return courses;
        }
    } catch (error) {
        throw error;
    }
}

export const getAssignedCourseService = async (teacherId: string, filters?: GetCourseFilters) => {
    try {
        const assignedCourses = await CourseTeacher.findAll({
            where: {
                teacherId
            },
            include: [
                {
                    model: Course,
                    as: 'course',
                    required: true,
                },
                {
                    model: Teacher,
                    as: 'teacher',
                    required: true,
                    attributes: ['id', 'name']
                }
            ],
            limit: filters?.limit,
            offset: filters?.offset,
        });

        const formattedData = assignedCourses.map((course) => {
            const plainCourse = course.get('course', { plain: true }) as any;
            const plainTeacher = course.get('teacher', { plain: true }) as any;
            return {
                ...plainCourse,
                teacher: plainTeacher
            };
        });

        return formattedData;
    } catch (error) {
        throw error;
    }
}

export const deleteCourseService = async (id: string) => {
    try {
        const course = await Course.findOne({
            where: { id }
        })
        if (!course) {
            throw new HttpError('Course not found', 404);
        }
        await course.destroy();
        return { message: 'Course deleted successfully' };
    } catch (error) {
        throw error;
    }
}

export const courseTeacherService = async (courseId: string, teacherId: string, operation: CourseTeacherServiceOperationType) => {
    try {
        const course = await Course.findOne({
            where: { id: courseId }
        });
        if (!course) {
            throw new HttpError('Course not found', 404);
        }

        const isAssigned = await CourseTeacher.findOne({
            where: {
                courseId,
                teacherId
            }
        })
        if (isAssigned && operation === CourseTeacherServiceOperation.ASSIGN) {
            throw new HttpError('Teacher is already assigned to the course', 400);
        }
        if (!isAssigned && operation === CourseTeacherServiceOperation.UNASSIGN) {
            throw new HttpError('Teacher is not assigned to the course', 400);
        }

        if (operation === CourseTeacherServiceOperation.ASSIGN) {
            await CourseTeacher.create({
                courseId,
                teacherId
            });
        }
        if (operation === CourseTeacherServiceOperation.UNASSIGN) {
            await CourseTeacher.destroy({
                where: {
                    courseId,
                    teacherId
                }
            });
        }
        return { message: `Teacher ${operation}ed successfully` };
    } catch (error) {
        throw error;
    }
}