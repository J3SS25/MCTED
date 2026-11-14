import type { Request, Response, NextFunction } from 'express';
import { ToolsService } from './tools.service.js';
import { CreateToolSchema, UpdateToolSchema, ToolFilterSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';
import { saveUploadFile } from '../../utils/fileStorage.js';

export class ToolsController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters = ToolFilterSchema.parse(req.query);
      const result = ToolsService.getTools(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Tool ID is required');

      const tool = ToolsService.getToolById(id);
      res.json(tool);
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      
      const rawImage = req.body.image_url || req.body.photo_url;
      const imageUrl = rawImage ? saveUploadFile(rawImage, 'tools') : undefined;

      const validated = CreateToolSchema.parse({
        ...req.body,
        name: req.body.name || req.body.title,
        rental_fee_centavos: req.body.rental_fee_centavos ?? req.body.daily_rate_centavos ?? req.body.daily_rate,
        user_id: req.user.id,
        image_url: imageUrl,
      });

      const tool = ToolsService.createTool(validated, {
        id: req.user.id,
        name: req.user.full_name,
      });
      res.status(201).json(tool);
    } catch (error) {
      next(error);
    }
  }

  static delete(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Tool ID is required');

      ToolsService.deleteTool(id, {
        id: req.user.id,
        role: req.user.role,
        name: req.user.full_name,
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Tool ID is required');

      const validated = UpdateToolSchema.parse(req.body);
      const tool = ToolsService.updateTool(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });
      res.json(tool);
    } catch (error) {
      next(error);
    }
  }

  static archive(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Tool ID is required');

      const tool = ToolsService.archiveTool(id, {
        id: req.user.id,
        name: req.user.full_name,
      });
      res.json(tool);
    } catch (error) {
      next(error);
    }
  }
}

