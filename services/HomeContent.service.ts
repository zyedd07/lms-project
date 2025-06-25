import HomeContent from '../models/HomeContent.model';
import HttpError from '../utils/httpError';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer'; // Default import

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


export type UpdateHomeContentParams = {
    sliderImages?: string[]; 
    questionOfTheDay?: object;
    aboutUsText?: string;
    customSections?: object[];
};

/**
 * @description Uploads slider images and updates the database record with the new URLs.
 * @param {multer.File[]} files - An array of files from the multipart request, using the type from the declaration shim.
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
        // Assumes a 'slider-images' bucket exists in your Supabase storage.
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

        // Overwrite the existing sliderImages array with the new URLs
        const updatedContent = await content.update({ sliderImages: imageUrls });
        
        return updatedContent;

    } catch (error) {
        console.error("Error during slider image upload:", error);
        if (error instanceof HttpError) throw error;
        throw new HttpError("An error occurred during file upload.", 500);
    }
};


/**
 * @description Get the current home page content.
 */
export const getHomeContentService = async (): Promise<HomeContent> => {
    try {
        let content = await HomeContent.findOne();
        if (!content) {
            content = await HomeContent.create({});
        }
        return content;
    } catch (error) {
        throw new HttpError("Failed to retrieve home content.", 500);
    }
};

/**
 * @description Update the text-based fields of the home page content.
 */
export const updateHomeContentService = async (params: UpdateHomeContentParams): Promise<HomeContent> => {
    try {
        const content = await getHomeContentService();
        const updatedContent = await content.update(params);
        return updatedContent;
    } catch (error) {
        throw new HttpError("Failed to update home content.", 500);
    }
};
