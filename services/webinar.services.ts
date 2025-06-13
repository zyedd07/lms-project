// src/services/webinar.services.ts

// Import the specific instance type from your model
import Webinar from '../models/webinar.model'; // Adjust path if needed
// You don't need a separate type import for WebinarInstance if you use `import Webinar from '../models/webinar.model';`
// and `Webinar` itself is the typed class.
import HttpError from '../utils/httpError';
import {
  WebinarInput,
  GetAllWebinarServiceParams,
  GetWebinarFilters,
  WebinarStatus
} from '../utils/types';


/**
 * Creates a new webinar in the database.
 * @param params The data for the new webinar.
 * @returns A promise that resolves to the newly created Webinar instance.
 * @throws {HttpError} If a webinar with the same Jitsi room name already exists.
 */
export const createWebinarService = async (params: WebinarInput): Promise<Webinar> => { // Return type is Webinar (the class itself)
  try {
    const existingWebinar = await Webinar.findOne({ where: { jitsiRoomName: params.jitsiRoomName } });
    if (existingWebinar) {
      throw new HttpError('Webinar with this Jitsi room name already exists.', 400);
    }

    const newWebinar = await Webinar.create({
      ...params,
      status: params.status || WebinarStatus.UPCOMING,
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
export const getWebinarByIdService = async (id: string): Promise<Webinar | null> => { // Return type is Webinar | null
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
export const getAllWebinarsService = async (params: GetAllWebinarServiceParams = {}, filters?: GetWebinarFilters): Promise<Webinar[]> => { // Return type is Webinar[]
  try {
    let whereClause: any = {}; // Still okay for Sequelize `where` options

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
 * @param id The UUID of the webinar to update.
 * @param params The data to update the webinar with.
 * @returns A promise that resolves to the updated Webinar instance or null if not found.
 * @throws {HttpError} If the webinar is not found or if the Jitsi room name is already in use.
 */
export const updateWebinarService = async (id: string, params: Partial<WebinarInput>): Promise<Webinar | null> => { // Return type is Webinar | null
  try {
    const webinar = await Webinar.findByPk(id);
    if (!webinar) {
      throw new HttpError('Webinar not found', 404);
    }

    if (params.jitsiRoomName && params.jitsiRoomName !== webinar.jitsiRoomName) {
      const existingWebinarWithSameRoomName = await Webinar.findOne({
        where: { jitsiRoomName: params.jitsiRoomName }
      });
      if (existingWebinarWithSameRoomName && existingWebinarWithSameRoomName.id !== webinar.id) {
        throw new HttpError('Jitsi room name already in use by another webinar.', 400);
      }
    }

    const dataToUpdate: Partial<WebinarInput> = { ...params };
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