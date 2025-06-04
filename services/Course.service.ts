// src/services/Course.service.ts

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
        });
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
            demoVideoUrl: params.demoVideoUrl,
            active: params.active, // <--- ADDED active here, assuming it can be set on creation
            syllabus: params.syllabus || [], // <--- ADDED this line. Default to empty array if not provided.
        });
        return newCourse;
    } catch (error) {
        throw error;
    }
};

export const updateCourseService = async (id: string, params: UpdateCourseServiceParams) => {
    try {
        const course = await Course.findOne({
            where: { id: id }
        });
        if (!course) {
            throw new HttpError('Course not found', 404);
        }

        // --- MODIFIED LINE: Pass all params, including syllabus ---
        await Course.update(params, {
            where: { id: id }
        });
        // --- END MODIFIED LINE ---

        // Fetch the updated course to return it, as Sequelize's update returns [affectedRows]
        const updatedCourse = await Course.findByPk(id);
        return updatedCourse; // Return the actual updated course object
    } catch (error) {
        throw error;
    }
};

export const getCourseByIdService = async (id: string) => {
    try {
        const courseData = await Course.findOne({
            where: { id: id },
            include: [
                {
                    model: Teacher,
                    through: { attributes: [] },
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
            ]
        });

        if (!courseData) {
            return null;
        }
        return courseData; // This will now include the syllabus field automatically
    } catch (error) {
        console.error("Error in getCourseByIdService:", error);
        throw error;
    }
};

export const getAllCoursesService = async ({ categoryId, id, active }: GetAllCourseServiceParams, filters?: GetCourseFilters) => {
    try {
        let whereClause: any = {};
        if (id) {
            // If ID is provided, it's a specific course lookup, which should ideally use getCourseByIdService
            // This block in getAllCoursesService seems redundant if getCourseByIdService exists
            // However, if you intend for getAllCourses to fetch a single course by ID with additional filters, keep it.
            // But usually, getCourseByIdService is for direct lookup.
            let whereClause: any = { id }; // Re-declaring whereClause here is problematic. It should be outside this if or merged.
            if (active === true || active === false) {
                whereClause.active = active;
            }
            const courseData = await Course.findOne({
                where: whereClause,
                include: [
                    {
                        model: Teacher,
                        through: { attributes: [] },
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
            return courseData; // Returns a single object if ID is present
        } else {
            // This is the intended path for getting ALL courses with category/active filters
            if (categoryId) {
                whereClause.categoryId = categoryId;
            }
            if (active === true || active === false) {
                whereClause.active = active;
            }
            const courses = await Course.findAll({
                where: whereClause,
                limit: filters?.limit,
                offset: filters?.offset,
                // Include syllabus in getAllCoursesService if you need it on the list view
                // include: [
                //     {
                //         model: Teacher,
                //         through: { attributes: [] },
                //         as: 'teachers',
                //         required: false,
                //         attributes: ['id', 'name']
                //     },
                //     {
                //         model: Categories,
                //         as: 'category',
                //         required: false,
                //         attributes: ['id', 'name']
                //     }
                // ]
            });

            return courses; // Returns an array of objects
        }
    } catch (error) {
        throw error;
    }
};

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
};

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
};

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
};
