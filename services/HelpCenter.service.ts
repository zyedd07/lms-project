import HelpCenterSection from '../models/HelpCenter.model';
import { CreateHelpSectionParams, UpdateHelpSectionParams } from '../utils/types';
import HttpError from '../utils/httpError';

/**
 * Service to get all help center sections, ordered by the 'order' field.
 */
export const getAllHelpSectionsService = async () => {
  return HelpCenterSection.findAll({
    order: [['order', 'ASC']],
  });
};

/**
 * Service to create a new help center section.
 */
export const createHelpSectionService = async (params: CreateHelpSectionParams) => {
  const { title, content, order } = params;
  // The 'as any' is used here because sequelize.define returns a generic ModelStatic
  // which doesn't have the specific attributes typed. This is a common workaround.
  const newSection = await (HelpCenterSection as any).create({ title, content, order });
  return newSection;
};

/**
 * Service to update an existing help center section by its ID.
 */
export const updateHelpSectionService = async (id: number, updates: UpdateHelpSectionParams) => {
  const section = await (HelpCenterSection as any).findByPk(id);
  if (!section) {
    throw new HttpError('Help section not found', 404);
  }
  await section.update(updates);
  return section;
};

/**
 * Service to delete a help center section by its ID.
 */
export const deleteHelpSectionService = async (id: number) => {
  const section = await (HelpCenterSection as any).findByPk(id);
  if (!section) {
    throw new HttpError('Help section not found', 404);
  }
  await section.destroy();
  return true;
};
