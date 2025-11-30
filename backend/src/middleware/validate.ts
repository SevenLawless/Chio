import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { HttpError } from '../utils/errors';

type ParsedRequest = {
  body?: Request['body'];
  params?: Request['params'];
  query?: Request['query'];
};

export const validate =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      }) as ParsedRequest;

      if (parsed.body) {
        req.body = parsed.body;
      }
      if (parsed.params) {
        Object.assign(req.params, parsed.params);
      }
      if (parsed.query) {
        Object.assign(req.query as Record<string, unknown>, parsed.query);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((issue) => issue.message).join(', ');
        return next(new HttpError(400, message));
      }

      return next(error);
    }
  };

