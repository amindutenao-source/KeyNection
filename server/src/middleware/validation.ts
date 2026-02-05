import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../types';

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    phone: Joi.string().pattern(/^\+?[\d\s()-]+$/).optional().messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    role: Joi.string().valid('OWNER', 'MANAGER', 'ADMIN').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  update: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s()-]+$/).optional(),
    avatar: Joi.string().uri().optional(),
    bio: Joi.string().max(500).optional(),
    address: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    zipCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    identificationNumber: Joi.string().max(50).optional(),
    taxId: Joi.string().max(50).optional(),
    bankAccount: Joi.string().max(100).optional(),
    emergencyContact: Joi.string().max(100).optional(),
    emergencyPhone: Joi.string().pattern(/^\+?[\d\s()-]+$/).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
  })
};

// Property validation schemas
export const propertySchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    type: Joi.string().valid('APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'VILLA', 'COMMERCIAL', 'LAND', 'OTHER').required(),
    address: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    zipCode: Joi.string().max(20).required(),
    country: Joi.string().min(2).max(100).required(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    bedrooms: Joi.number().integer().min(0).max(20).optional(),
    bathrooms: Joi.number().integer().min(0).max(20).optional(),
    squareFeet: Joi.number().positive().optional(),
    yearBuilt: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
    parkingSpaces: Joi.number().integer().min(0).max(20).optional(),
    furnished: Joi.boolean().optional(),
    petsAllowed: Joi.boolean().optional(),
    smokingAllowed: Joi.boolean().optional(),
    monthlyRent: Joi.number().positive().optional(),
    securityDeposit: Joi.number().positive().optional(),
    utilitiesIncluded: Joi.boolean().optional(),
    propertyTax: Joi.number().positive().optional(),
    insurance: Joi.number().positive().optional(),
    features: Joi.array().items(Joi.string().max(100)).optional(),
    amenities: Joi.array().items(Joi.string().max(100)).optional()
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    type: Joi.string().valid('APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'VILLA', 'COMMERCIAL', 'LAND', 'OTHER').optional(),
    status: Joi.string().valid('AVAILABLE', 'RENTED', 'MAINTENANCE', 'SOLD', 'PENDING').optional(),
    address: Joi.string().min(5).max(200).optional(),
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().min(2).max(100).optional(),
    zipCode: Joi.string().max(20).optional(),
    country: Joi.string().min(2).max(100).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    bedrooms: Joi.number().integer().min(0).max(20).optional(),
    bathrooms: Joi.number().integer().min(0).max(20).optional(),
    squareFeet: Joi.number().positive().optional(),
    yearBuilt: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
    parkingSpaces: Joi.number().integer().min(0).max(20).optional(),
    furnished: Joi.boolean().optional(),
    petsAllowed: Joi.boolean().optional(),
    smokingAllowed: Joi.boolean().optional(),
    monthlyRent: Joi.number().positive().optional(),
    securityDeposit: Joi.number().positive().optional(),
    utilitiesIncluded: Joi.boolean().optional(),
    propertyTax: Joi.number().positive().optional(),
    insurance: Joi.number().positive().optional(),
    features: Joi.array().items(Joi.string().max(100)).optional(),
    amenities: Joi.array().items(Joi.string().max(100)).optional(),
    managerId: Joi.string().min(1).optional()
  }),

  search: Joi.object({
    type: Joi.string().valid('APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'VILLA', 'COMMERCIAL', 'LAND', 'OTHER').optional(),
    status: Joi.string().valid('AVAILABLE', 'RENTED', 'MAINTENANCE', 'SOLD', 'PENDING').optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    bedrooms: Joi.number().integer().min(0).optional(),
    bathrooms: Joi.number().integer().min(0).optional(),
    furnished: Joi.boolean().optional(),
    petsAllowed: Joi.boolean().optional(),
    smokingAllowed: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'monthlyRent', 'bedrooms', 'bathrooms').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

// Application validation schemas
export const applicationSchemas = {
  create: Joi.object({
    propertyId: Joi.string().min(1).required(),
    moveInDate: Joi.date().min('now').optional(),
    leaseTerm: Joi.number().integer().min(1).max(60).optional(),
    monthlyIncome: Joi.number().positive().optional(),
    employmentStatus: Joi.string().max(50).optional(),
    employerName: Joi.string().max(100).optional(),
    employerPhone: Joi.string().pattern(/^\+?[\d\s()-]+$/).optional(),
    currentAddress: Joi.string().max(200).optional(),
    currentLandlord: Joi.string().max(100).optional(),
    currentLandlordPhone: Joi.string().pattern(/^\+?[\d\s()-]+$/).optional(),
    reasonForMoving: Joi.string().max(500).optional(),
    additionalInfo: Joi.string().max(1000).optional(),
    creditScore: Joi.number().integer().min(300).max(850).optional(),
    annualIncome: Joi.number().positive().optional(),
    bankReferences: Joi.string().max(200).optional(),
    personalReferences: Joi.array().items(Joi.string().max(100)).max(5).optional(),
    personalReferencePhones: Joi.array().items(Joi.string().pattern(/^\+?[\d\s()-]+$/)).max(5).optional()
  }),

  update: Joi.object({
    status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'UNDER_REVIEW').optional(),
    moveInDate: Joi.date().min('now').optional(),
    leaseTerm: Joi.number().integer().min(1).max(60).optional(),
    monthlyIncome: Joi.number().positive().optional(),
    employmentStatus: Joi.string().max(50).optional(),
    employerName: Joi.string().max(100).optional(),
    employerPhone: Joi.string().pattern(/^\+?[\d\s()-]+$/).optional(),
    currentAddress: Joi.string().max(200).optional(),
    currentLandlord: Joi.string().max(100).optional(),
    currentLandlordPhone: Joi.string().pattern(/^\+?[\d\s()-]+$/).optional(),
    reasonForMoving: Joi.string().max(500).optional(),
    additionalInfo: Joi.string().max(1000).optional(),
    creditScore: Joi.number().integer().min(300).max(850).optional(),
    annualIncome: Joi.number().positive().optional(),
    bankReferences: Joi.string().max(200).optional(),
    personalReferences: Joi.array().items(Joi.string().max(100)).max(5).optional(),
    personalReferencePhones: Joi.array().items(Joi.string().pattern(/^\+?[\d\s()-]+$/)).max(5).optional()
  }),

  search: Joi.object({
    status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'UNDER_REVIEW').optional(),
    propertyId: Joi.string().min(1).optional(),
    applicantId: Joi.string().min(1).optional(),
    reviewedBy: Joi.string().min(1).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

// Contract validation schemas
export const contractSchemas = {
  create: Joi.object({
    propertyId: Joi.string().min(1).required(),
    applicationId: Joi.string().min(1).optional(),
    managerId: Joi.string().min(1).optional(),
    tenantId: Joi.string().min(1).optional(),
    startDate: Joi.date().min('now').optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    monthlyRent: Joi.number().positive().optional(),
    securityDeposit: Joi.number().positive().optional(),
    utilitiesIncluded: Joi.boolean().optional(),
    lateFee: Joi.number().positive().optional(),
    gracePeriod: Joi.number().integer().min(0).max(30).optional(),
    contractType: Joi.string().max(50).optional(),
    terms: Joi.string().max(5000).optional(),
    specialConditions: Joi.string().max(1000).optional()
  }),

  update: Joi.object({
    status: Joi.string().valid('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING_SIGNATURE').optional(),
    startDate: Joi.date().min('now').optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    monthlyRent: Joi.number().positive().optional(),
    securityDeposit: Joi.number().positive().optional(),
    utilitiesIncluded: Joi.boolean().optional(),
    lateFee: Joi.number().positive().optional(),
    gracePeriod: Joi.number().integer().min(0).max(30).optional(),
    contractType: Joi.string().max(50).optional(),
    terms: Joi.string().max(5000).optional(),
    specialConditions: Joi.string().max(1000).optional(),
    managerId: Joi.string().min(1).optional(),
    tenantId: Joi.string().min(1).optional()
  })
};

// Payment validation schemas
export const paymentSchemas = {
  create: Joi.object({
    contractId: Joi.string().min(1).optional(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('USD').optional(),
    method: Joi.string().valid('CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH').required(),
    description: Joi.string().max(200).optional()
  })
};

// Maintenance request validation schemas
export const maintenanceRequestSchemas = {
  create: Joi.object({
    propertyId: Joi.string().min(1).required(),
    contractId: Joi.string().min(1).optional(),
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(1000).required(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').required(),
    category: Joi.string().max(50).optional(),
    estimatedCost: Joi.number().positive().optional(),
    scheduledDate: Joi.date().min('now').optional()
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(1000).optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
    category: Joi.string().max(50).optional(),
    estimatedCost: Joi.number().positive().optional(),
    actualCost: Joi.number().positive().optional(),
    scheduledDate: Joi.date().min('now').optional(),
    completedDate: Joi.date().min('now').optional()
  })
};

// Message validation schemas
export const messageSchemas = {
  create: Joi.object({
    recipientId: Joi.string().min(1).required(),
    subject: Joi.string().max(200).optional(),
    content: Joi.string().min(1).max(2000).required()
  })
};

// Review validation schemas
export const reviewSchemas = {
  create: Joi.object({
    propertyId: Joi.string().min(1).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(200).optional(),
    comment: Joi.string().max(1000).optional()
  })
};

// Generic validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Replace req.body with validated data
    req.body = value;
    return next();
  };
};

// Query validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        error: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Replace req.query with validated data
    req.query = value;
    return next();
  };
};

// Params validation middleware
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        error: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Replace req.params with validated data
    req.params = value;
    return next();
  };
};

// ID validation schema
export const idSchema = Joi.object({
  id: Joi.string().min(1).required()
});

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional()
});

// File upload validation
export const fileUploadSchema = Joi.object({
  maxSize: Joi.number().max(10 * 1024 * 1024), // 10MB
  allowedTypes: Joi.array().items(Joi.string()).default(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  maxFiles: Joi.number().max(10)
});

// Email validation schema
export const emailSchema = Joi.object({
  email: Joi.string().email().required()
});

// Phone validation schema
export const phoneSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[\d\s()-]+$/).required()
});

// Export validation functions for specific schemas
export const validateUser = {
  register: validate(userSchemas.register),
  login: validate(userSchemas.login),
  update: validate(userSchemas.update),
  changePassword: validate(userSchemas.changePassword),
  forgotPassword: validate(userSchemas.forgotPassword),
  resetPassword: validate(userSchemas.resetPassword)
};

export const validateProperty = {
  create: validate(propertySchemas.create),
  update: validate(propertySchemas.update),
  search: validateQuery(propertySchemas.search)
};

export const validateApplication = {
  create: validate(applicationSchemas.create),
  update: validate(applicationSchemas.update),
  search: validateQuery(applicationSchemas.search)
};

export const validateContract = {
  create: validate(contractSchemas.create),
  update: validate(contractSchemas.update)
};

export const validatePayment = {
  create: validate(paymentSchemas.create)
};

export const validateMaintenanceRequest = {
  create: validate(maintenanceRequestSchemas.create),
  update: validate(maintenanceRequestSchemas.update)
};

export const validateMessage = {
  create: validate(messageSchemas.create)
};

export const validateReview = {
  create: validate(reviewSchemas.create)
};

export const validateId = validateParams(idSchema);
export const validatePagination = validateQuery(paginationSchema);
export const validateEmail = validate(emailSchema);
export const validatePhone = validate(phoneSchema); 
