import { NextFunction, Request, Response } from 'express';
import * as TermsSectionService from '../services/TermsSection.service';
import HttpError from '../utils/httpError';

/**
 * Controller to get all Terms of Service sections.
 */
export const getAllTermsSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = await TermsSectionService.getAllTermsSectionsService();
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    next(new HttpError('Failed to fetch Terms of Service sections', 500));
  }
};

/**
 * Controller to create a new Terms of Service section.
 */
export const createTermsSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, order } = req.body;
    if (!title || !content) {
      throw new HttpError('Title and content are required fields.', 400);
    }
    const newSection = await TermsSectionService.createTermsSectionService({ title, content, order });
    res.status(201).json({ success: true, message: 'Terms of Service section created successfully', data: newSection });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update a Terms of Service section.
 */
export const updateTermsSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    if (isNaN(sectionId)) {
        throw new HttpError('Invalid section ID.', 400);
    }
    const updatedSection = await TermsSectionService.updateTermsSectionService(sectionId, req.body);
    res.status(200).json({ success: true, message: 'Terms of Service section updated successfully', data: updatedSection });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a Terms of Service section.
 */
export const deleteTermsSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    if (isNaN(sectionId)) {
        throw new HttpError('Invalid section ID.', 400);
    }
    await TermsSectionService.deleteTermsSectionService(sectionId);
    res.status(200).json({ success: true, message: 'Terms of Service section deleted successfully' });
  } catch (error) {
    next(error);
  }
};
