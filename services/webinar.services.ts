// src/services/webinar.services.ts

// Import the specific instance type from your model
import Webinar from '../models/webinar.model'; // Adjust path if needed
import HttpError from '../utils/httpError';
import {
  WebinarInput,
  GetAllWebinarServiceParams,
  GetWebinarFilters,
  WebinarStatus
} from '../utils/types';
import { v4 as uuidv4 } from 'uuid'; // ADDED: Import uuid for generating unique Jitsi room names


/**
 * Creates a new webinar in the database.
 * The jitsiRoomName is now automatically generated by the backend.
 * @param params The data for the new webinar, excluding jitsiRoomName.
 * @returns A promise that resolves to the newly created Webinar instance.
 * @throws {HttpError} If a technical error occurs during creation.
 */
export const createWebinarService = async (params: WebinarInput): Promise<Webinar> => {
  try {
    // Generate a unique, unguessable Jitsi room name
    // Using a UUID ensures high uniqueness and prevents predictable room names.
    const generatedJitsiRoomName = `webinar-${uuidv4().replace(/-/g, '')}`;

    const newWebinar = await Webinar.create({
      ...params,
      status: params.status || WebinarStatus.UPCOMING,
      price: typeof params.price === 'number' ? params.price : 0,
      jitsiRoomName: generatedJitsiRoomName, // ASSIGN THE GENERATED ROOM NAME HERE
    });
    return newWebinar;
  } catch (error) {
    console.error("Error in createWebinarService:", error);
    // Rethrow HttpError if it's already one, otherwise wrap it.
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError("Failed to create webinar due to a server error.", 500); // More generic error
  }
};

/**
 * Fetches a single webinar by its ID.
 * @param id The UUID of the webinar to fetch.
 * @returns A promise that resolves to a Webinar instance or null if not found.
 */
export const getWebinarByIdService = async (id: string): Promise<Webinar | null> => {
  try {
    const webinar = await Webinar.findByPk(id);
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
export const getAllWebinarsService = async (params: GetAllWebinarServiceParams = {}, filters?: GetWebinarFilters): Promise<Webinar[]> => {
  try {
    let whereClause: any = {};

    if (params.status) {
      whereClause.status = params.status;
    }

    const webinars = await Webinar.findAll({
      where: whereClause,
      limit: filters?.limit,
      offset: filters?.offset,
    });
    return webinars;
  } catch (error) {
    console.error("Error in getAllWebinarsService:", error);
    throw error;
  }
};

/**
 * Updates an existing webinar in the database.
 * The jitsiRoomName cannot be updated after creation, ensuring its immutability.
 * @param id The UUID of the webinar to update.
 * @param params The data to update the webinar with.
 * @returns A promise that resolves to the updated Webinar instance or null if not found.
 * @throws {HttpError} If the webinar is not found.
 */
export const updateWebinarService = async (id: string, params: Partial<WebinarInput>): Promise<Webinar | null> => {
  try {
    const webinar = await Webinar.findByPk(id);
    if (!webinar) {
      throw new HttpError('Webinar not found', 404);
    }

    // REMOVED: Jitsi room name uniqueness check and update logic
    // We assume jitsiRoomName is immutable after creation.
    // If params.jitsiRoomName is present, we simply ignore it or warn/throw if strict.
    const dataToUpdate: Partial<WebinarInput> = { ...params };
    delete dataToUpdate.jitsiRoomName; // ENSURE JITSI ROOM NAME IS NOT UPDATED VIA THIS SERVICE

    if (typeof params.price === 'string') {
      dataToUpdate.price = parseFloat(params.price);
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