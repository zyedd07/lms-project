import { NextFunction, Request, Response } from 'express';
import * as HelpCenterService from '../services/HelpCenter.service';
import HttpError from '../utils/httpError';

/**
 * Controller to get all help center sections.
 */
export const getAllHelpSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = await HelpCenterService.getAllHelpSectionsService();
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    next(new HttpError('Failed to fetch help sections', 500));
  }
};

/**
 * Controller to create a new help center section.
 */
export const createHelpSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, order } = req.body;
    if (!title || !content) {
      throw new HttpError('Title and content are required fields.', 400);
    }
    const newSection = await HelpCenterService.createHelpSectionService({ title, content, order });
    res.status(201).json({ success: true, message: 'Help section created successfully', data: newSection });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update a help center section.
 */
export const updateHelpSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    if (isNaN(sectionId)) {
        throw new HttpError('Invalid section ID.', 400);
    }
    const updatedSection = await HelpCenterService.updateHelpSectionService(sectionId, req.body);
    res.status(200).json({ success: true, message: 'Help section updated successfully', data: updatedSection });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a help center section.
 */
export const deleteHelpSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    if (isNaN(sectionId)) {
        throw new HttpError('Invalid section ID.', 400);
    }
    await HelpCenterService.deleteHelpSectionService(sectionId);
    res.status(200).json({ success: true, message: 'Help section deleted successfully' });
  } catch (error) {
    next(error);
  }
};
