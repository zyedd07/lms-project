// src/services/webinar.service.ts

import Webinar from '../models/webinar.model';
import HttpError from '../utils/httpError';
import {
  WebinarInput,
  GetAllWebinarServiceParams,
  GetWebinarFilters,
  WebinarStatus // New import for the enum type
} from '../utils/types';


/**
 * Creates a new webinar in the database.
 * @param params The data for the new webinar.
 * @returns A promise that resolves to the newly created Webinar instance.
 * @throws {HttpError} If a webinar with the same Jitsi room name already exists.
 */
export const createWebinarService = async (params: WebinarInput): Promise<any> => {
  try {
    const existingWebinar: any = await Webinar.findOne({ where: { jitsiRoomName: params.jitsiRoomName } });
    if (existingWebinar) {
      throw new HttpError('Webinar with this Jitsi room name already exists.', 400);
    }

    const newWebinar: any = await Webinar.create({
      ...params,
      // FIX: Ensure status defaults to WebinarStatus.UPCOMING enum value
      status: params.status || WebinarStatus.UPCOMING,
      // Ensure price is a number, defaulting to 0 if not provided or invalid
      price: typeof params.price === 'number' ? params.price : 0,
    });
    return newWebinar;
  } catch (error) {
    console.error("Error in createWebinarService:", error);
    throw error;
  }
};

/**
 * Fetches a single webinar by its ID.
 * @param id The UUID of the webinar to fetch.
 * @returns A promise that resolves to a Webinar instance or null if not found.
 */
export const getWebinarByIdService = async (id: string): Promise<any | null> => {
  try {
    const webinar: any = await Webinar.findByPk(id);
    if (!webinar) {
      return null;
    }
    return webinar;
  } catch (error) {
    console.error(`Error in getWebinarByIdService (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * Fetches all webinars from the database.
 * @param params Optional parameters for filtering by status.
 * @param filters Optional pagination filters (limit, offset).
 * @returns A promise that resolves to an array of Webinar instances.
 */
export const getAllWebinarsService = async (params: GetAllWebinarServiceParams = {}, filters?: GetWebinarFilters): Promise<any[]> => {
  try {
    let whereClause: any = {};

    // Filter by status if provided in params
    if (params.status) {
      whereClause.status = params.status;
    }

    const webinars: any[] = await Webinar.findAll({
      where: whereClause,
      limit: filters?.limit,
      offset: filters?.offset,
      // include: [], // Add includes if you have associations (e.g., with Speakers or Categories)
    });
    return webinars;
  } catch (error) {
    console.error("Error in getAllWebinarsService:", error);
    throw error;
  }
};

/**
 * Updates an existing webinar in the database.
 * @param id The UUID of the webinar to update.
 * @param params The data to update the webinar with.
 * @returns A promise that resolves to the updated Webinar instance or null if not found.
 * @throws {HttpError} If the webinar is not found or if the Jitsi room name is already in use.
 */
export const updateWebinarService = async (id: string, params: Partial<WebinarInput>): Promise<any | null> => {
  try {
    const webinar: any = await Webinar.findByPk(id);
    if (!webinar) {
      throw new HttpError('Webinar not found', 404);
    }

    // Check if jitsiRoomName is being updated and if it's unique to another webinar
    if (params.jitsiRoomName && params.jitsiRoomName !== webinar.jitsiRoomName) {
      const existingWebinarWithSameRoomName: any = await Webinar.findOne({
        where: { jitsiRoomName: params.jitsiRoomName }
      });
      if (existingWebinarWithSameRoomName && existingWebinarWithSameRoomName.id !== webinar.id) {
        throw new HttpError('Jitsi room name already in use by another webinar.', 400);
      }
    }

    // Prepare data for update, ensuring price is handled correctly
    const dataToUpdate: Partial<WebinarInput> = { ...params };
    if (typeof params.price === 'string') {
      dataToUpdate.price = parseFloat(params.price); // Convert string price to number if it came as string
    } else if (typeof params.price === 'number') {
      dataToUpdate.price = params.price;
    }

    await webinar.update(dataToUpdate);
    return webinar;
  } catch (error) {
    console.error(`Error in updateWebinarService (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * Deletes a webinar from the database by its ID.
 * @param id The UUID of the webinar to delete.
 * @returns A promise that resolves to an object indicating success.
 * @throws {HttpError} If the webinar is not found.
 */
export const deleteWebinarService = async (id: string): Promise<{ message: string }> => {
  try {
    const deletedRowCount = await Webinar.destroy({ where: { id } });
    if (deletedRowCount === 0) {
      throw new HttpError('Webinar not found', 404);
    }
    return { message: 'Webinar deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteWebinarService (ID: ${id}):`, error);
    throw error;
  }
};