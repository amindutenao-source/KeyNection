import dotenv from "dotenv";
dotenv.config();

import express, { type RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import "./types/express";
import logger from "./utils/logger";
import { initMetrics, metricsEndpoint, metricsMiddleware } from "./middleware/metrics";
import prisma from "./lib/prisma";

// Import middleware
import { 
  errorHandler, 
  notFoundHandler, 
  requestLogger,
  handleUnhandledRejection,
  handleUncaughtException
} from "./middleware/errorHandler";

// Import routes
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import applicationRoutes from "./routes/applications";
import contractRoutes from "./routes/contracts";
import notificationRoutes from "./routes/notifications";
import paymentRoutes from "./routes/payments";
import maintenanceRoutes from "./routes/maintenance";
import documentRoutes from "./routes/documents";
import messageRoutes from "./routes/messages";
import reviewRoutes from "./routes/reviews";
import userRoutes from "./routes/users";
import adminRoutes from "./routes/admin";
import { healthHandler } from "./routes/health";

// Environment variables loaded at top of file

const app = express();
const PORT = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KeyNection API",
      version: "1.0.0",
      description: "A comprehensive API for connecting property owners with property managers",
      contact: {
        name: "KeyNection Team",
        email: "support@keynection.com"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production" 
          ? "https://api.keynection.com" 
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === "production" ? "Production server" : "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            role: { type: "string", enum: ["OWNER", "MANAGER", "ADMIN"] },
            status: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"] }
          }
        },
        Property: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            type: { type: "string", enum: ["APARTMENT", "HOUSE", "CONDO", "TOWNHOUSE", "VILLA", "COMMERCIAL", "LAND", "OTHER"] },
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            monthlyRent: { type: "number" }
          }
        },
        Application: {
          type: "object",
          properties: {
            id: { type: "string" },
            propertyId: { type: "string" },
            applicantId: { type: "string" },
            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "UNDER_REVIEW"] }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./src/routes/*.ts", "./src/types/*.ts"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://keynection.com", "https://www.keynection.com"]
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}) as unknown as RequestHandler);

// Compression middleware
app.use(compression() as unknown as RequestHandler);

// Logging middleware (skip in test to reduce noise)
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger as unknown as RequestHandler);
}

// Metrics (optional)
const metricsEnabled = process.env.METRICS_ENABLED === "true";
if (metricsEnabled) {
  initMetrics();
  if (!process.env.METRICS_TOKEN) {
    logger.warn(
      "Metrics enabled without METRICS_TOKEN. The /metrics endpoint is unprotected.",
      { service: "keynection-api" }
    );
  }
  app.use(metricsMiddleware);
  app.get("/metrics", metricsEndpoint);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
    error: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false
}) as unknown as RequestHandler;

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
    error: "AUTH_RATE_LIMIT_EXCEEDED"
  }
}) as unknown as RequestHandler;

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", healthHandler);

// API documentation
app.use("/api-docs", swaggerUi.serve as unknown as RequestHandler[], swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "KeyNection API Documentation"
}) as unknown as RequestHandler);

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "KeyNection API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
    endpoints: {
      auth: "/api/auth",
      properties: "/api/properties",
      applications: "/api/applications",
      contracts: "/api/contracts",
      notifications: "/api/notifications",
      payments: "/api/payments",
      maintenance: "/api/maintenance",
      documents: "/api/documents",
      messages: "/api/messages",
      reviews: "/api/reviews",
      users: "/api/users"
    }
  });
});

// 404 handler
app.use("*", notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Global error handlers
process.on("unhandledRejection", handleUnhandledRejection);
process.on("uncaughtException", handleUncaughtException);

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

// Database connection test
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Database connection failed", { error });
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Start server
    app.listen(PORT, () => {
      logger.info(`KeyNection API server running on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

// Export for testing
export { app, prisma };

// Start server if this file is run directly
if (require.main === module) {
  void startServer();
}

export default app; 
