import TermsSection from '../models/TermsOfService.model'; // Ensure the path is correct
import { CreateTermsSectionParams, UpdateTermsSectionParams } from '../utils/types';
import HttpError from '../utils/httpError';

/**
 * Service to get all Terms of Service sections, ordered correctly.
 */
export const getAllTermsSectionsService = async () => {
  return TermsSection.findAll({
    order: [['order', 'ASC']],
  });
};

/**
 * Service to create a new Terms of Service section.
 */
export const createTermsSectionService = async (params: CreateTermsSectionParams) => {
  const { title, content, order } = params;
  // The 'as any' cast is a common workaround when using sequelize.define without a class
  const newSection = await (TermsSection as any).create({ title, content, order });
  return newSection;
};

/**
 * Service to update an existing Terms of Service section by its ID.
 */
export const updateTermsSectionService = async (id: number, updates: UpdateTermsSectionParams) => {
  const section = await (TermsSection as any).findByPk(id);
  if (!section) {
    throw new HttpError('Terms of Service section not found', 404);
  }
  await section.update(updates);
  return section;
};

/**
 * Service to delete a Terms of Service section by its ID.
 */
export const deleteTermsSectionService = async (id: number) => {
  const section = await (TermsSection as any).findByPk(id);
  if (!section) {
    throw new HttpError('Terms of Service section not found', 404);
  }
  await section.destroy();
  return true;
};
