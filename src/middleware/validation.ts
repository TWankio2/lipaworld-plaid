import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const linkTokenValidation = [
  body('user_id').isString().notEmpty(),
  body('client_name').isString().notEmpty(),
  body('country_codes').isArray().notEmpty(),
  body('language').isString().notEmpty(),
  body('products').isArray().notEmpty(),
  validateRequest
];

export const exchangeTokenValidation = [
  body('public_token').isString().notEmpty(),
  body('user_id').isString().notEmpty(),
  validateRequest
];

export const accessTokenValidation = [
  body('access_token').isString().notEmpty(),
  validateRequest
];

export const transactionsValidation = [
  body('access_token').isString().notEmpty(),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('count').optional().isInt({ min: 1, max: 500 }),
  body('offset').optional().isInt({ min: 0 }),
  validateRequest
];