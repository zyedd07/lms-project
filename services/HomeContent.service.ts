import HomeContent from '../models/HomeContent.model';
import Course from '../models/Course.model';
import TestSeries from '../models/TestSeries.model';
import QuestionBank from '../models/QuestionBank.model';
import HttpError from '../utils/httpError';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { UpdateHomeContentParams } from '../utils/types';

// --- Supabase client setup using environment variables ---
let supabase: SupabaseClient;

try {
    console.log("[SUPABASE INIT - HomeContent] Attempting to initialize Supabase client...");
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
            },
        });
        console.log("[SUPABASE INIT - HomeContent] Supabase client initialized SUCCESSFULLY.");
    } else {
        console.error("[SUPABASE INIT ERROR - HomeContent] Supabase client NOT initialized. Image upload features will fail.");
    }
} catch (error) {
    console.error("[SUPABASE INIT ERROR - HomeContent] Unexpected error during Supabase client initialization:", error);
}


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
 * This service takes arrays of names for top-rated items, fetches their details,
 * and stores the structured data.
 * @param {UpdateHomeContentParams} params - The fields to update.
 * @returns {Promise<HomeContent>} The updated home content instance.
 */
export const updateHomeContentService = async (params: UpdateHomeContentParams): Promise<HomeContent> => {
    try {
        const content = await getHomeContentService();
        
        // Prepare a payload with the direct updates
        const updatePayload: any = {
            questionOfTheDay: params.questionOfTheDay,
            aboutUsText: params.aboutUsText,
            customSections: params.customSections,
        };

        // Dynamically fetch and structure Top Rated Courses
        if (params.topRatedCourseNames) {
            const coursePromises = params.topRatedCourseNames.map(name => 
                Course.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'price'] })
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
                QuestionBank.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'price'] })
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

/**
 * @description Uploads slider images and updates the database record with the new URLs.
 * @param {multer.File[]} files - An array of files from the multipart request.
 * @returns {Promise<HomeContent>} The updated home content instance.
 */
export const uploadSliderImagesService = async (files: multer.File[]): Promise<HomeContent> => {
    if (!supabase) {
        throw new HttpError("Storage service is not initialized. Cannot upload images.", 500);
    }
    if (!files || files.length === 0) {
        throw new HttpError("No image files were provided for upload.", 400);
    }

    const uploadPromises = files.map(file => {
        const fileName = `${uuidv4()}-${file.originalname}`;
        return supabase.storage.from('slider-images').upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });
    });

    try {
        const uploadResults = await Promise.all(uploadPromises);
        
        const imageUrls: string[] = [];
        for (const result of uploadResults) {
            if (result.error) {
                throw new HttpError(`Failed to upload image: ${result.error.message}`, 500);
            }
            const { data } = supabase.storage.from('slider-images').getPublicUrl(result.data.path);
            imageUrls.push(data.publicUrl);
        }

        const content = await getHomeContentService();
        const updatedContent = await content.update({ sliderImages: imageUrls });
        
        return updatedContent;

    } catch (error) {
        console.error("Error during slider image upload:", error);
        if (error instanceof HttpError) throw error;
        throw new HttpError("An error occurred during file upload.", 500);
    }
};
