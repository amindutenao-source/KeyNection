import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, JWTPayload, UserRole, UserStatus } from '../types';

const prisma = new PrismaClient();

export interface AuthOptions {
  required?: boolean;
  roles?: UserRole[];
}

/**
 * JWT Authentication Middleware
 */
export const authenticate = (options: AuthOptions = {}) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required !== false) {
          return res.status(401).json({
            success: false,
            message: 'Access token is required',
            error: 'UNAUTHORIZED'
          });
        }
        return next();
      }

      const token = authHeader.substring(7);
      
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          bio: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          dateOfBirth: true,
          identificationNumber: true,
          taxId: true,
          bankAccount: true,
          emergencyContact: true,
          emergencyPhone: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          error: 'UNAUTHORIZED'
        });
      }

      if (user.status !== UserStatus.ACTIVE) {
        return res.status(403).json({
          success: false,
          message: 'Account is not active',
          error: 'FORBIDDEN'
        });
      }

      // Check role permissions
      if (options.roles && !options.roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'FORBIDDEN'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: 'UNAUTHORIZED'
        });
      }

      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          error: 'TOKEN_EXPIRED'
        });
      }

      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};

/**
 * Require authentication
 */
export const requireAuth = authenticate({ required: true });
export const authenticateToken = requireAuth;

/**
 * Optional authentication
 */
export const optionalAuth = authenticate({ required: false });

/**
 * Require specific roles
 */
export const requireRole = (roles: UserRole[]) => authenticate({ required: true, roles });

/**
 * Require owner role
 */
export const requireOwner = requireRole([UserRole.OWNER]);

/**
 * Require manager role
 */
export const requireManager = requireRole([UserRole.MANAGER]);

/**
 * Require admin role
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Require owner or manager role
 */
export const requireOwnerOrManager = requireRole([UserRole.OWNER, UserRole.MANAGER]);

/**
 * Require owner or admin role
 */
export const requireOwnerOrAdmin = requireRole([UserRole.OWNER, UserRole.ADMIN]);

/**
 * Require manager or admin role
 */
export const requireManagerOrAdmin = requireRole([UserRole.MANAGER, UserRole.ADMIN]);

/**
 * Verify email middleware
 */
export const requireEmailVerification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'EMAIL_NOT_VERIFIED'
    });
  }

  return next();
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  }
};

/**
 * Password strength validation middleware
 */
export const validatePasswordStrength = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      error: 'VALIDATION_ERROR'
    });
  }

  // Password strength requirements
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet requirements',
      error: 'VALIDATION_ERROR',
      details: errors
    });
  }

  return next();
};

/**
 * Check if user owns the resource
 */
export const requireOwnership = (resourceType: 'property' | 'application' | 'contract') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }

    const resourceId = req.params.id || req.params.propertyId || req.params.applicationId || req.params.contractId;
    
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID is required',
        error: 'BAD_REQUEST'
      });
    }

    try {
      switch (resourceType) {
        case 'property': {
          const property = await prisma.property.findUnique({
            where: { id: resourceId },
            select: { ownerId: true, managerId: true }
          });

          if (!property) {
            return res.status(404).json({
              success: false,
              message: 'Resource not found',
              error: 'NOT_FOUND'
            });
          }

          const hasAccess = property.ownerId === req.user.id || property.managerId === req.user.id;
          if (!hasAccess && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({
              success: false,
              message: 'Access denied',
              error: 'FORBIDDEN'
            });
          }

          return next();
        }
        case 'application': {
          const application = await prisma.application.findUnique({
            where: { id: resourceId },
            select: {
              applicantId: true,
              property: { select: { ownerId: true, managerId: true } }
            }
          });

          if (!application) {
            return res.status(404).json({
              success: false,
              message: 'Resource not found',
              error: 'NOT_FOUND'
            });
          }

          const hasAccess =
            application.applicantId === req.user.id ||
            application.property.ownerId === req.user.id ||
            application.property.managerId === req.user.id;

          if (!hasAccess && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({
              success: false,
              message: 'Access denied',
              error: 'FORBIDDEN'
            });
          }

          return next();
        }
        case 'contract': {
          const contract = await prisma.contract.findUnique({
            where: { id: resourceId },
            select: { ownerId: true, managerId: true, tenantId: true }
          });

          if (!contract) {
            return res.status(404).json({
              success: false,
              message: 'Resource not found',
              error: 'NOT_FOUND'
            });
          }

          const hasAccess =
            contract.ownerId === req.user.id ||
            contract.managerId === req.user.id ||
            contract.tenantId === req.user.id;

          if (!hasAccess && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({
              success: false,
              message: 'Access denied',
              error: 'FORBIDDEN'
            });
          }

          return next();
        }
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type',
            error: 'BAD_REQUEST'
          });
      }
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};
