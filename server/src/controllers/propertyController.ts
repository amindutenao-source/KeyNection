import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { deleteFile, getFileUrl } from '../middleware/upload';

const prisma = new PrismaClient();

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseInteger = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const parseStringArray = (value: unknown, fallback?: string[]): string[] | undefined => {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [trimmed];
    }
  }
  return [String(value)];
};

const buildCreateData = (
  body: Record<string, any>,
  ownerId: string,
  imageUrls: string[]
): Prisma.PropertyUncheckedCreateInput => {
  return {
    title: body.title,
    description: body.description,
    type: body.type,
    status: body.status,
    address: body.address,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    country: body.country,
    latitude: parseNumber(body.latitude),
    longitude: parseNumber(body.longitude),
    bedrooms: parseInteger(body.bedrooms),
    bathrooms: parseInteger(body.bathrooms),
    squareFeet: parseNumber(body.squareFeet),
    yearBuilt: parseInteger(body.yearBuilt),
    parkingSpaces: parseInteger(body.parkingSpaces),
    furnished: parseBoolean(body.furnished) ?? false,
    petsAllowed: parseBoolean(body.petsAllowed) ?? false,
    smokingAllowed: parseBoolean(body.smokingAllowed) ?? false,
    monthlyRent: parseNumber(body.monthlyRent),
    securityDeposit: parseNumber(body.securityDeposit),
    utilitiesIncluded: parseBoolean(body.utilitiesIncluded) ?? false,
    propertyTax: parseNumber(body.propertyTax),
    insurance: parseNumber(body.insurance),
    features: parseStringArray(body.features, []) || [],
    amenities: parseStringArray(body.amenities, []) || [],
    images: imageUrls,
    ownerId
  };
};

const buildUpdateData = (body: Record<string, any>): Prisma.PropertyUpdateInput => {
  const features = parseStringArray(body.features);
  const amenities = parseStringArray(body.amenities);
  const managerId = body.managerId;
  const manager =
    managerId === null || managerId === ''
      ? { disconnect: true }
      : managerId
        ? { connect: { id: String(managerId) } }
        : undefined;

  return {
    title: body.title,
    description: body.description,
    type: body.type,
    status: body.status,
    address: body.address,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    country: body.country,
    latitude: parseNumber(body.latitude),
    longitude: parseNumber(body.longitude),
    bedrooms: parseInteger(body.bedrooms),
    bathrooms: parseInteger(body.bathrooms),
    squareFeet: parseNumber(body.squareFeet),
    yearBuilt: parseInteger(body.yearBuilt),
    parkingSpaces: parseInteger(body.parkingSpaces),
    furnished: parseBoolean(body.furnished),
    petsAllowed: parseBoolean(body.petsAllowed),
    smokingAllowed: parseBoolean(body.smokingAllowed),
    monthlyRent: parseNumber(body.monthlyRent),
    securityDeposit: parseNumber(body.securityDeposit),
    utilitiesIncluded: parseBoolean(body.utilitiesIncluded),
    propertyTax: parseNumber(body.propertyTax),
    insurance: parseNumber(body.insurance),
    features: features ? { set: features } : undefined,
    amenities: amenities ? { set: amenities } : undefined,
    manager
  };
};

export class PropertyController {
  /**
   * @route   GET /api/properties
   * @desc    Obtenir toutes les propriétés avec filtres
   * @access  Public
   */
  static getAllProperties = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      type,
      status,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      furnished,
      petsAllowed,
      smokingAllowed,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      propertyType,
      minBedrooms
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const resolvedType = (type ?? propertyType) as string | undefined;
    const resolvedBedrooms = (bedrooms ?? minBedrooms) as string | undefined;

    const where: Prisma.PropertyWhereInput = {
      listedAt: { not: null }
    };

    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (state) where.state = { contains: state as string, mode: 'insensitive' };
    if (resolvedType) where.type = resolvedType as any;
    if (status) where.status = status as any;
    if (minPrice || maxPrice) {
      where.monthlyRent = {
        gte: parseNumber(minPrice),
        lte: parseNumber(maxPrice)
      };
    }
    if (resolvedBedrooms) where.bedrooms = { gte: parseInteger(resolvedBedrooms) };
    if (bathrooms) where.bathrooms = { gte: parseInteger(bathrooms) };
    if (furnished !== undefined) where.furnished = parseBoolean(furnished);
    if (petsAllowed !== undefined) where.petsAllowed = parseBoolean(petsAllowed);
    if (smokingAllowed !== undefined) where.smokingAllowed = parseBoolean(smokingAllowed);

    const allowedSortFields = ['createdAt', 'monthlyRent', 'bedrooms', 'bathrooms'];
    const sortField = allowedSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy = { [sortField]: sortDirection } as Prisma.PropertyOrderByWithRelationInput;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.property.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/properties/search
   * @desc    Rechercher des propriétés
   * @access  Public
   */
  static searchProperties = asyncHandler(async (req: Request, res: Response) => {
    const { q, city, state, type, status, minPrice, maxPrice } = req.query;

    const where: Prisma.PropertyWhereInput = {
      listedAt: { not: null }
    };

    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { address: { contains: q as string, mode: 'insensitive' } },
        { city: { contains: q as string, mode: 'insensitive' } },
        { state: { contains: q as string, mode: 'insensitive' } },
        { zipCode: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (state) where.state = { contains: state as string, mode: 'insensitive' };
    if (type) where.type = type as any;
    if (status) where.status = status as any;
    if (minPrice || maxPrice) {
      where.monthlyRent = {
        gte: parseNumber(minPrice),
        lte: parseNumber(maxPrice)
      };
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      take: 20
    });

    return res.json({
      success: true,
      data: properties
    });
  });

  /**
   * @route   GET /api/properties/:id
   * @desc    Obtenir une propriété par ID
   * @access  Public
   */
  static getPropertyById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            city: true,
            state: true,
            country: true
          }
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            applications: true,
            contracts: true
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée'
      });
    }

    return res.json({
      success: true,
      data: property
    });
  });

  /**
   * @route   POST /api/properties
   * @desc    Créer une nouvelle propriété
   * @access  Private (Owner)
   */
  static createProperty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const imageUrls = files ? files.map((file) => getFileUrl(file.filename)) : [];

    const propertyData = buildCreateData(req.body, req.user!.id, imageUrls);

    const property = await prisma.property.create({
      data: propertyData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Propriété créée avec succès',
      data: property
    });
  });

  /**
   * @route   PUT /api/properties/:id
   * @desc    Mettre à jour une propriété
   * @access  Private (Owner)
   */
  static updateProperty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingProperty = await prisma.property.findFirst({
      where: { id, ownerId: userId }
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée ou accès non autorisé'
      });
    }

    const updateData = buildUpdateData(req.body);

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Propriété mise à jour avec succès',
      data: property
    });
  });

  /**
   * @route   DELETE /api/properties/:id
   * @desc    Supprimer une propriété
   * @access  Private (Owner)
   */
  static deleteProperty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const property = await prisma.property.findFirst({
      where: { id, ownerId: userId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée ou accès non autorisé'
      });
    }

    for (const imageUrl of property.images) {
      const filename = imageUrl.split('/').pop();
      if (filename) {
        try {
          await deleteFile(filename);
        } catch (error) {
          console.error('Erreur suppression image:', error);
        }
      }
    }

    await prisma.property.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Propriété supprimée avec succès'
    });
  });

  /**
   * @route   POST /api/properties/:id/images
   * @desc    Ajouter des images à une propriété
   * @access  Private (Owner)
   */
  static addImages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    const property = await prisma.property.findFirst({
      where: { id, ownerId: userId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée ou accès non autorisé'
      });
    }

    const newImageUrls = files.map((file) => getFileUrl(file.filename));
    const updatedImages = [...property.images, ...newImageUrls];

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { images: { set: updatedImages } },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Images ajoutées avec succès',
      data: updatedProperty
    });
  });

  /**
   * @route   DELETE /api/properties/:id/images/:imageIndex
   * @desc    Supprimer une image d'une propriété
   * @access  Private (Owner)
   */
  static removeImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id, imageIndex } = req.params;
    const userId = req.user!.id;
    const index = parseInt(imageIndex, 10);

    const property = await prisma.property.findFirst({
      where: { id, ownerId: userId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée ou accès non autorisé'
      });
    }

    if (index < 0 || index >= property.images.length) {
      return res.status(400).json({
        success: false,
        message: "Index d'image invalide"
      });
    }

    const imageUrl = property.images[index];
    const filename = imageUrl.split('/').pop();
    if (filename) {
      try {
        await deleteFile(filename);
      } catch (error) {
        console.error('Erreur suppression image:', error);
      }
    }

    const updatedImages = property.images.filter((_: string, i: number) => i !== index);

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { images: { set: updatedImages } },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Image supprimée avec succès',
      data: updatedProperty
    });
  });

  /**
   * @route   PUT /api/properties/:id/publish
   * @desc    Publier une propriété
   * @access  Private (Owner)
   */
  static publishProperty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const property = await prisma.property.findFirst({
      where: { id, ownerId: userId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée ou accès non autorisé'
      });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { listedAt: new Date() },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Propriété publiée avec succès',
      data: updatedProperty
    });
  });

  /**
   * @route   PUT /api/properties/:id/unpublish
   * @desc    Dépublier une propriété
   * @access  Private (Owner)
   */
  static unpublishProperty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const property = await prisma.property.findFirst({
      where: { id, ownerId: userId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée ou accès non autorisé'
      });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { listedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Propriété dépubliée avec succès',
      data: updatedProperty
    });
  });

  /**
   * @route   GET /api/properties/owner/my-properties
   * @desc    Obtenir les propriétés de l'utilisateur connecté
   * @access  Private (Owner)
   */
  static getMyProperties = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: {
              applications: true,
              contracts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.property.count({ where: { ownerId: userId } })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/properties/manager/available
   * @desc    Obtenir les propriétés disponibles pour les gestionnaires
   * @access  Private (Manager)
   */
  static getAvailableProperties = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: {
          listedAt: { not: null },
          status: 'AVAILABLE',
          applications: {
            none: {
              applicantId: userId
            }
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.property.count({
        where: {
          listedAt: { not: null },
          status: 'AVAILABLE',
          applications: {
            none: {
              applicantId: userId
            }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });
}
