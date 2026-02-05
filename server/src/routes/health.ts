import { Request, Response } from 'express';

export const healthHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'KeyNection API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
};
