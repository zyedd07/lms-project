// src/services/Course.service.ts

import Categories from "../models/Categories.model";
import Course from "../models/Course.model"; // Ensure this import is correct and brings in the typed Course model
import CourseTeacher from "../models/CourseTeacher.model";
import Teacher from "../models/Teacher.model";
import { CourseTeacherServiceOperation } from "../utils/constants";
import HttpError from "../utils/httpError";
import { 
    CourseTeacherServiceOperationType, 
    CreateCourseServiceParams, 
    GetAllCourseServiceParams, 
    GetCourseFilters, 
    UpdateCourseServiceParams,
    // Import your custom Course model type if you explicitly defined it
    // e.g., if you created an interface `CourseInstance` in Course.model.ts and exported it:
    // CourseInstance 
} from "../utils/types"; // Make sure your custom CourseInstance type is accessible, or use a direct cast

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
            active: params.active, 
            syllabus: params.syllabus || [], 
            contents: params.contents || [], // Ensure contents is also passed here
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

        // --- CORRECTED LINES ---
        // To safely access properties like 'syllabus' and 'contents' on the 'course' object
        // without TypeScript complaining about `Model<any, any>`, you can use:
        // 1. Explicitly casting `course` to the correct type (e.g., `Course & { syllabus: any[]; contents: any[]; }`)
        // 2. Using `course.get('propertyName')` method which is type-safe
        // 3. Ensuring your Sequelize model definition uses the correct instance typing (as provided in the last response for Course.model.ts)

        // Assuming your Course.model.ts now properly types the instance:
        // No explicit cast is needed IF your model typing is perfect and accessible.
        // However, if the error persists, a simple type assertion like `as any` or a more specific type
        // can temporarily resolve it while you refine your model's instance typing.

        // Let's use `as any` for quick fix, but the best long-term solution is strong model typing.
        const currentSyllabus = (course as any).syllabus || [];
        const currentContents = (course as any).contents || [];
        
        await Course.update(
            {
                ...params, // Spread all parameters from the update request
                // Use provided syllabus/contents if available, otherwise fallback to existing data
                syllabus: params.syllabus !== undefined ? params.syllabus : currentSyllabus,
                contents: params.contents !== undefined ? params.contents : currentContents,
            },
            {
                where: { id: id }
            }
        );
        // --- END CORRECTED LINES ---

        const updatedCourse = await Course.findByPk(id);
        return updatedCourse; 
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
        return courseData; 
    } catch (error) {
        console.error("Error in getCourseByIdService:", error);
        throw error;
    }
};

export const getAllCoursesService = async ({ categoryId, id, active }: GetAllCourseServiceParams, filters?: GetCourseFilters) => {
    try {
        let whereClause: any = {};
        if (id) {
            whereClause = { id }; 
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
            return courseData; 
        } else {
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

            return courses; 
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
