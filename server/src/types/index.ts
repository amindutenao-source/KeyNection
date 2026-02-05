import { Request } from 'express';
import {
  ApplicationStatus,
  ContractStatus,
  NotificationStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PropertyStatus,
  PropertyType,
  UserRole,
  UserStatus
} from '@prisma/client';

type Nullable<T> = T | null;

// User Types
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: Nullable<string>;
  avatar?: Nullable<string>;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationToken?: Nullable<string>;
  resetPasswordToken?: Nullable<string>;
  resetPasswordExpires?: Nullable<Date>;
  lastLoginAt?: Nullable<Date>;
  bio?: Nullable<string>;
  address?: Nullable<string>;
  city?: Nullable<string>;
  state?: Nullable<string>;
  zipCode?: Nullable<string>;
  country?: Nullable<string>;
  dateOfBirth?: Nullable<Date>;
  identificationNumber?: Nullable<string>;
  taxId?: Nullable<string>;
  bankAccount?: Nullable<string>;
  emergencyContact?: Nullable<string>;
  emergencyPhone?: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: Date;
  identificationNumber?: string;
  taxId?: string;
  bankAccount?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

// Property Types
export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: Nullable<number>;
  longitude?: Nullable<number>;
  bedrooms?: Nullable<number>;
  bathrooms?: Nullable<number>;
  squareFeet?: Nullable<number>;
  yearBuilt?: Nullable<number>;
  parkingSpaces?: Nullable<number>;
  furnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  monthlyRent?: Nullable<number>;
  securityDeposit?: Nullable<number>;
  utilitiesIncluded: boolean;
  propertyTax?: Nullable<number>;
  insurance?: Nullable<number>;
  features: string[];
  amenities: string[];
  images: string[];
  ownerId: string;
  managerId?: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
  listedAt?: Nullable<Date>;
  lastMaintenance?: Nullable<Date>;
  owner?: User;
  manager?: Nullable<User>;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  monthlyRent?: number;
  securityDeposit?: number;
  utilitiesIncluded?: boolean;
  propertyTax?: number;
  insurance?: number;
  features?: string[];
  amenities?: string[];
}

export interface UpdatePropertyRequest {
  title?: string;
  description?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  monthlyRent?: number;
  securityDeposit?: number;
  utilitiesIncluded?: boolean;
  propertyTax?: number;
  insurance?: number;
  features?: string[];
  amenities?: string[];
  managerId?: string;
}

// Application Types
export interface Application {
  id: string;
  propertyId: string;
  applicantId: string;
  status: ApplicationStatus;
  moveInDate?: Nullable<Date>;
  leaseTerm?: Nullable<number>;
  monthlyIncome?: Nullable<number>;
  employmentStatus?: Nullable<string>;
  employerName?: Nullable<string>;
  employerPhone?: Nullable<string>;
  currentAddress?: Nullable<string>;
  currentLandlord?: Nullable<string>;
  currentLandlordPhone?: Nullable<string>;
  reasonForMoving?: Nullable<string>;
  additionalInfo?: Nullable<string>;
  creditScore?: Nullable<number>;
  annualIncome?: Nullable<number>;
  bankReferences?: Nullable<string>;
  personalReferences: string[];
  personalReferencePhones: string[];
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Nullable<Date>;
  reviewedBy?: Nullable<string>;
  property?: Property;
  applicant?: User;
}

export interface CreateApplicationRequest {
  propertyId: string;
  moveInDate?: Date;
  leaseTerm?: number;
  monthlyIncome?: number;
  employmentStatus?: string;
  employerName?: string;
  employerPhone?: string;
  currentAddress?: string;
  currentLandlord?: string;
  currentLandlordPhone?: string;
  reasonForMoving?: string;
  additionalInfo?: string;
  creditScore?: number;
  annualIncome?: number;
  bankReferences?: string;
  personalReferences?: string[];
  personalReferencePhones?: string[];
}

export interface UpdateApplicationRequest {
  status?: ApplicationStatus;
  moveInDate?: Date;
  leaseTerm?: number;
  monthlyIncome?: number;
  employmentStatus?: string;
  employerName?: string;
  employerPhone?: string;
  currentAddress?: string;
  currentLandlord?: string;
  currentLandlordPhone?: string;
  reasonForMoving?: string;
  additionalInfo?: string;
  creditScore?: number;
  annualIncome?: number;
  bankReferences?: string;
  personalReferences?: string[];
  personalReferencePhones?: string[];
}

// Contract Types
export interface Contract {
  id: string;
  propertyId: string;
  applicationId?: Nullable<string>;
  ownerId: string;
  managerId?: Nullable<string>;
  tenantId?: Nullable<string>;
  status: ContractStatus;
  startDate?: Nullable<Date>;
  endDate?: Nullable<Date>;
  monthlyRent?: Nullable<number>;
  securityDeposit?: Nullable<number>;
  utilitiesIncluded: boolean;
  lateFee?: Nullable<number>;
  gracePeriod?: Nullable<number>;
  contractType?: Nullable<string>;
  terms?: Nullable<string>;
  specialConditions?: Nullable<string>;
  ownerSignedAt?: Nullable<Date>;
  managerSignedAt?: Nullable<Date>;
  tenantSignedAt?: Nullable<Date>;
  contractDocument?: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  application?: Nullable<Application>;
  owner?: User;
  manager?: Nullable<User>;
  tenant?: Nullable<User>;
}

export interface CreateContractRequest {
  propertyId: string;
  applicationId?: string;
  managerId?: string;
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  monthlyRent?: number;
  securityDeposit?: number;
  utilitiesIncluded?: boolean;
  lateFee?: number;
  gracePeriod?: number;
  contractType?: string;
  terms?: string;
  specialConditions?: string;
}

export interface UpdateContractRequest {
  status?: ContractStatus;
  startDate?: Date;
  endDate?: Date;
  monthlyRent?: number;
  securityDeposit?: number;
  utilitiesIncluded?: boolean;
  lateFee?: number;
  gracePeriod?: number;
  contractType?: string;
  terms?: string;
  specialConditions?: string;
  managerId?: string;
  tenantId?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  data?: any;
  propertyId?: Nullable<string>;
  applicationId?: Nullable<string>;
  contractId?: Nullable<string>;
  paymentId?: Nullable<string>;
  createdAt: Date;
  readAt?: Nullable<Date>;
  user?: User;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  propertyId?: Nullable<string>;
  applicationId?: string;
  contractId?: Nullable<string>;
  paymentId?: string;
}

// Payment Types
export interface Payment {
  id: string;
  contractId?: Nullable<string>;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description?: Nullable<string>;
  transactionId?: Nullable<string>;
  receiptUrl?: Nullable<string>;
  failureReason?: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Nullable<Date>;
  contract?: Nullable<Contract>;
  user?: User;
}

export interface CreatePaymentRequest {
  contractId?: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  description?: string;
}

// Maintenance Request Types
export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  contractId?: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category?: Nullable<string>;
  estimatedCost?: Nullable<number>;
  actualCost?: Nullable<number>;
  scheduledDate?: Nullable<Date>;
  completedDate?: Nullable<Date>;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  contract?: Nullable<Contract>;
}

export interface CreateMaintenanceRequestRequest {
  propertyId: string;
  contractId?: string;
  title: string;
  description: string;
  priority: string;
  category?: string;
  estimatedCost?: number;
  scheduledDate?: Date;
}

// Document Types
export interface Document {
  id: string;
  userId: string;
  propertyId?: string;
  name: string;
  type: string;
  url: string;
  size?: Nullable<number>;
  mimeType?: Nullable<string>;
  createdAt: Date;
  user?: User;
  property?: Nullable<Property>;
}

export interface CreateDocumentRequest {
  userId: string;
  propertyId?: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  mimeType?: string;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject?: Nullable<string>;
  content: string;
  read: boolean;
  createdAt: Date;
  readAt?: Nullable<Date>;
  sender?: User;
  recipient?: User;
}

export interface CreateMessageRequest {
  recipientId: string;
  subject?: string;
  content: string;
}

// Review Types
export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  rating: number;
  title?: Nullable<string>;
  comment?: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  user?: User;
}

export interface CreateReviewRequest {
  propertyId: string;
  rating: number;
  title?: string;
  comment?: string;
}

// Enums
export {
  ApplicationStatus,
  ContractStatus,
  NotificationStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PropertyStatus,
  PropertyType,
  UserRole,
  UserStatus
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Request with User
export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

// File Upload Types
export interface FileUploadResponse {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}

// Search and Filter Types
export interface PropertySearchFilters {
  type?: PropertyType;
  status?: PropertyStatus;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
}

export interface ApplicationSearchFilters {
  status?: ApplicationStatus;
  propertyId?: string;
  applicantId?: string;
  reviewedBy?: string;
}

// Email Types
export interface EmailTemplate {
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

// JWT Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
} 
