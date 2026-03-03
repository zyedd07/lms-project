// src/services/Course.service.ts

import Categories from "../models/Categories.model";
import Course from "../models/Course.model"; // Ensure this import is correct and brings in the typed Course model
import User from "../models/User.model"; // Import the User model to include it in queries

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

// Extend CreateCourseServiceParams to include uploaderId
interface CreateCourseServiceParamsWithUploader extends CreateCourseServiceParams {
    uploaderId: string; // The ID of the user who is uploading the course
}

export const createCourseService = async (params: CreateCourseServiceParamsWithUploader) => {
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
            contents: params.contents || [],
            uploaderId: params.uploaderId, // Assign the uploaderId from params
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
                },
                { // FIX: Include the User model for uploader information
                    model: User,
                    as: 'uploader', // This alias must match the 'as' in your Course model association
                    required: false, // Set to true if a course MUST have an uploader
                    attributes: ['id', 'name', 'email'] // Select specific user attributes
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
        let includeClause: any[] = [ // Define common include clause
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
            },
            { // FIX: Include the User model for uploader information
                model: User,
                as: 'uploader', // This alias must match the 'as' in your Course model association
                required: false,
                attributes: ['id', 'name', 'email']
            }
        ];

        if (id) {
            whereClause = { id }; 
            if (active === true || active === false) {
                whereClause.active = active;
            }
            const courseData = await Course.findOne({
                where: whereClause,
                include: includeClause, // Use the defined include clause
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
                include: includeClause // Use the defined include clause
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
                    // FIX: Include uploader in the nested Course model
                    include: [{
                        model: User,
                        as: 'uploader',
                        required: false,
                        attributes: ['id', 'name', 'email']
                    }],
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
