import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';

export function validate(schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}

