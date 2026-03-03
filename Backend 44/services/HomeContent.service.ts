import HomeContent from '../models/HomeContent.model';
import Course from '../models/Course.model';
import TestSeries from '../models/TestSeries.model';
import QuestionBank from '../models/QuestionBank.model';
import HttpError from '../utils/httpError';
import { UpdateHomeContentParams } from '../utils/types'; // Assuming this path is correct

// Supabase client and multer are no longer needed for this service
// You can remove the Supabase client setup and multer imports from this file.

/**
 * @description Get the current home page content.
 * If no content exists, it creates a default entry.
 * @returns {Promise<HomeContent>} The home content instance.
 */
export const getHomeContentService = async (): Promise<HomeContent> => {
    try {
        let content = await HomeContent.findOne();
        if (!content) {
            console.log("No home content found, creating a default entry.");
            content = await HomeContent.create({});
        }
        return content;
    } catch (error) {
        console.error("Error fetching home content:", error);
        throw new HttpError("Failed to retrieve home content.", 500);
    }
};

/**
 * @description Update the home page content.
 * This service now takes an array of image URLs in addition to the other content.
 * @param {UpdateHomeContentParams} params - The fields to update.
 * @returns {Promise<HomeContent>} The updated home content instance.
 */
export const updateHomeContentService = async (params: UpdateHomeContentParams): Promise<HomeContent> => {
    try {
        const content = await getHomeContentService();

        // Prepare a payload with all direct updates, including sliderImages
        const updatePayload: any = {
            questionOfTheDay: params.questionOfTheDay,
            aboutUsText: params.aboutUsText,
            customSections: params.customSections,
            // Include the sliderImages array directly from the request payload
            sliderImages: params.sliderImages,
        };

        // Dynamically fetch and structure Top Rated Courses
        if (params.topRatedCourseNames) {
            const coursePromises = params.topRatedCourseNames.map(name =>
                Course.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'price', 'demoVideoUrl', 'categoryId', 'syllabus', 'contents'] })
            );
            const courses = await Promise.all(coursePromises);
            updatePayload.topRatedCourses = courses.filter(c => c !== null); // Filter out any names that weren't found
        }

        // Dynamically fetch and structure Top Rated Tests
        if (params.topRatedTestNames) {
            const testPromises = params.topRatedTestNames.map(name =>
                TestSeries.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'price'] })
            );
            const tests = await Promise.all(testPromises);
            updatePayload.topRatedTests = tests.filter(t => t !== null);
        }

        // Dynamically fetch and structure Top Rated QBanks
        if (params.topRatedQbankNames) {
            const qbankPromises = params.topRatedQbankNames.map(name =>
                QuestionBank.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'filePath', 'fileName', 'price'] })
            );
            const qbanks = await Promise.all(qbankPromises);
            updatePayload.topRatedQbanks = qbanks.filter(q => q !== null);
        }

        // Update the record with the new data
        const updatedContent = await content.update(updatePayload);
        return updatedContent;
    } catch (error) {
        console.error("Error updating home content:", error);
        throw new HttpError("Failed to update home content.", 500);
    }
};