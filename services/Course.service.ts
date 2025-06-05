// src/services/Course.service.ts

import Categories from "../models/Categories.model";
import Course from "../models/Course.model";
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
    // --- NEW IMPORTS FOR CONTENT MANAGEMENT ---
    AddCourseContentParams,
    UpdateCourseContentParams,
    CourseContentItem // Used for type hinting when returning items
    // --- END NEW IMPORTS ---
} from "../utils/types";

// --- NEW IMPORT FOR GENERATING UUIDs for content items ---
import { v4 as uuidv4 } from 'uuid';
// --- END NEW IMPORT ---

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
            // The 'contents' field will be defaulted to [] by the model, no need to pass it here unless you want to initialize it
            contents: params.contents || [], // Include if you want to allow initial contents on creation
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

        // Sequelize will automatically handle updates to the 'contents' JSONB column
        // if 'params' contains a 'contents' field with the entire new array.
        // This is important: to update contents, you must send the *entire new array*
        // for `contents` if you are using this generic update service for it.
        // The specialized content services below are for granular additions/updates/deletions.
        await Course.update(params, {
            where: { id: id }
        });

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
        return courseData; // This will now include the syllabus and contents fields automatically
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
            whereClause = { id }; // Re-declaring whereClause here is problematic. It should be outside this if or merged.
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
                // Include `contents` here if you need it on the list view.
                // Be mindful of payload size if contents can be very large.
                // Generally, full contents are fetched with getCourseByIdService.
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
                    // The 'contents' field will automatically be included here if present on the Course model
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

// --- NEW SERVICE FUNCTIONS FOR COURSE CONTENT MANAGEMENT ---

/**
 * Adds a new content item to a specific course's `contents` array.
 * @param courseId The ID of the course to which content will be added.
 * @param contentParams The parameters for the new content item (title, video_url, etc.).
 * @returns The newly added content item.
 * @throws HttpError if course not found or other database errors.
 */
export const addCourseContentService = async (courseId: string, contentParams: AddCourseContentParams): Promise<CourseContentItem | null> => {
    try {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new HttpError('Course not found', 404);
        }

        // Ensure contents is an array; it should be by model definition, but safe check
        const existingContents: CourseContentItem[] = (course.contents as CourseContentItem[]) || [];

        const newContentItem: CourseContentItem = {
            id: uuidv4(), // Generate a unique ID for the content item
            title: contentParams.title,
            video_url: contentParams.video_url,
            description: contentParams.description !== undefined ? contentParams.description : null, // Ensure explicit null for absence
            order: contentParams.order !== undefined ? contentParams.order : existingContents.length, // Default order to end
            type: contentParams.type || 'video', // Default type to 'video'
            created_at: new Date().toISOString(), // Timestamp of creation
        };

        const updatedContents = [...existingContents, newContentItem];

        // Sort contents by order to maintain consistent display order
        updatedContents.sort((a, b) => a.order - b.order);

        await course.update({ contents: updatedContents });

        // Fetch the updated course to get the latest state and return the added item
        // This ensures the returned item is exactly what's in the DB, including potential DB-side transformations.
        const updatedCourse = await Course.findByPk(courseId);
        const addedItem = updatedCourse?.contents?.find(item => item.id === newContentItem.id);
        return addedItem || null; // Return null if for some reason it's not found after update (unlikely)

    } catch (error) {
        console.error("Error in addCourseContentService:", error);
        throw error;
    }
};

/**
 * Updates an existing content item within a specific course's `contents` array.
 * @param courseId The ID of the course containing the content item.
 * @param contentId The ID of the specific content item to update.
 * @param updates Partial updates for the content item (title, video_url, etc.).
 * @returns The updated content item.
 * @throws HttpError if course or content item not found.
 */
export const updateCourseContentService = async (courseId: string, contentId: string, updates: UpdateCourseContentParams): Promise<CourseContentItem | null> => {
    try {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new HttpError('Course not found', 404);
        }

        if (!Array.isArray(course.contents)) {
            // This case should ideally not happen if model is correctly set with defaultValue: []
            throw new HttpError('Course content is not in a valid array format', 500);
        }

        let contentFound = false;
        const updatedContents = course.contents.map(item => {
            if (item.id === contentId) {
                contentFound = true;
                // Merge updates with existing item.
                // Explicitly keep 'id' and 'created_at' from the original item to prevent accidental changes.
                const updatedItem: CourseContentItem = {
                    ...item,
                    ...updates,
                    id: item.id, // Ensure ID is immutable
                    created_at: item.created_at // Ensure creation timestamp is immutable
                };
                // Handle optional fields that might be explicitly set to undefined or null in updates
                if (updates.description === undefined && item.description !== undefined) {
                    updatedItem.description = item.description;
                }
                return updatedItem;
            }
            return item;
        });

        if (!contentFound) {
            throw new HttpError('Content item not found within this course', 404);
        }

        // Re-sort contents by order in case the 'order' field was updated
        updatedContents.sort((a, b) => a.order - b.order);

        await course.update({ contents: updatedContents });

        // Fetch the updated course to return the specific updated item
        const updatedCourse = await Course.findByPk(courseId);
        const updatedItem = updatedCourse?.contents?.find(item => item.id === contentId);
        return updatedItem || null;

    } catch (error) {
        console.error("Error in updateCourseContentService:", error);
        throw error;
    }
};

/**
 * Deletes a specific content item from a course's `contents` array.
 * @param courseId The ID of the course from which to delete content.
 * @param contentId The ID of the specific content item to delete.
 * @returns A success message upon deletion.
 * @throws HttpError if course or content item not found.
 */
export const deleteCourseContentService = async (courseId: string, contentId: string) => {
    try {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new HttpError('Course not found', 404);
        }

        if (!Array.isArray(course.contents)) {
            throw new HttpError('Course content is not in a valid array format', 500);
        }

        const initialLength = course.contents.length;
        const updatedContents = course.contents.filter(item => item.id !== contentId);

        if (updatedContents.length === initialLength) {
            throw new HttpError('Content item not found within this course', 404);
        }

        // Note: No need to sort after deletion unless you explicitly re-order.
        // The 'order' field might become non-consecutive but still correct relative order.
        // If strict consecutive ordering is needed, you'd iterate and reassign orders.
        // For most cases, filtering is enough.

        await course.update({ contents: updatedContents });

        return { message: 'Content item deleted successfully' };

    } catch (error) {
        console.error("Error in deleteCourseContentService:", error);
        throw error;
    }
};
