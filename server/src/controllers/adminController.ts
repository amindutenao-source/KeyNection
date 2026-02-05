import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

const buildActivity = (
  items: Array<{ id: string; createdAt: Date; message: string; status: 'pending' | 'completed' }>
) => items;

export class AdminController {
  /**
   * @route   GET /api/admin/overview
   * @desc    Obtenir les statistiques globales et activités récentes
   * @access  Private (Admin)
   */
  static getOverview = asyncHandler(async (_req: AuthenticatedRequest, res) => {
    const [
      userCount,
      propertyCount,
      applicationCount,
      contractCount,
      paymentCount,
      maintenanceCount,
      documentCount,
      reviewCount,
      completedPayments,
      latestUsers,
      latestProperties,
      latestApplications,
      latestContracts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.application.count(),
      prisma.contract.count(),
      prisma.payment.count(),
      prisma.maintenanceRequest.count(),
      prisma.document.count(),
      prisma.review.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, firstName: true, lastName: true, createdAt: true }
      }),
      prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true, createdAt: true }
      }),
      prisma.application.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, createdAt: true }
      }),
      prisma.contract.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, createdAt: true }
      })
    ]);

    const revenue = completedPayments._sum.amount ?? 0;

    const activity = [
      ...buildActivity(
        latestUsers.map((user) => ({
          id: user.id,
          createdAt: user.createdAt,
          message: `Nouvel utilisateur: ${user.firstName} ${user.lastName}`,
          status: 'completed' as const
        }))
      ),
      ...buildActivity(
        latestProperties.map((property) => ({
          id: property.id,
          createdAt: property.createdAt,
          message: `Nouvelle propriété: ${property.title}`,
          status: 'completed' as const
        }))
      ),
      ...buildActivity(
        latestApplications.map((application) => ({
          id: application.id,
          createdAt: application.createdAt,
          message: `Candidature ${application.status.toLowerCase()}`,
          status: application.status === 'APPROVED' ? 'completed' : 'pending'
        }))
      ),
      ...buildActivity(
        latestContracts.map((contract) => ({
          id: contract.id,
          createdAt: contract.createdAt,
          message: `Contrat ${contract.status.toLowerCase()}`,
          status: contract.status === 'ACTIVE' ? 'completed' : 'pending'
        }))
      )
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((entry) => ({
        id: entry.id,
        message: entry.message,
        time: entry.createdAt.toISOString(),
        status: entry.status
      }));

    return res.json({
      success: true,
      data: {
        stats: {
          users: userCount,
          properties: propertyCount,
          applications: applicationCount,
          contracts: contractCount,
          payments: paymentCount,
          maintenance: maintenanceCount,
          documents: documentCount,
          reviews: reviewCount,
          revenue
        },
        recentActivity: activity
      }
    });
  });

  /**
   * @route   GET /api/admin/audits
   * @desc    Obtenir les événements d'audit récents
   * @access  Private (Admin)
   */
  static getAudits = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
    const typeFilter = (req.query.type as string | undefined)?.toUpperCase() || '';
    const search = (req.query.search as string | undefined)?.toLowerCase() || '';

    const [
      payments,
      applications,
      contracts,
      maintenanceRequests,
      reviews,
      documents,
      users
    ] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, amount: true, currency: true, status: true, createdAt: true }
      }),
      prisma.application.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, createdAt: true }
      }),
      prisma.contract.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, createdAt: true }
      }),
      prisma.maintenanceRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, status: true, createdAt: true }
      }),
      prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, rating: true, createdAt: true }
      }),
      prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, createdAt: true }
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, firstName: true, lastName: true, createdAt: true }
      })
    ]);

    let audits = [
      ...payments.map((payment) => ({
        id: payment.id,
        type: 'PAYMENT',
        message: `Paiement ${payment.status.toLowerCase()} - ${payment.amount} ${payment.currency}`,
        createdAt: payment.createdAt
      })),
      ...applications.map((application) => ({
        id: application.id,
        type: 'APPLICATION',
        message: `Candidature ${application.status.toLowerCase()}`,
        createdAt: application.createdAt
      })),
      ...contracts.map((contract) => ({
        id: contract.id,
        type: 'CONTRACT',
        message: `Contrat ${contract.status.toLowerCase()}`,
        createdAt: contract.createdAt
      })),
      ...maintenanceRequests.map((request) => ({
        id: request.id,
        type: 'MAINTENANCE',
        message: `Maintenance ${request.status.toLowerCase()} - ${request.title}`,
        createdAt: request.createdAt
      })),
      ...reviews.map((review) => ({
        id: review.id,
        type: 'REVIEW',
        message: `Avis ${review.rating}/5`,
        createdAt: review.createdAt
      })),
      ...documents.map((document) => ({
        id: document.id,
        type: 'DOCUMENT',
        message: `Document ${document.name}`,
        createdAt: document.createdAt
      })),
      ...users.map((user) => ({
        id: user.id,
        type: 'USER',
        message: `Nouvel utilisateur: ${user.firstName} ${user.lastName}`,
        createdAt: user.createdAt
      }))
    ];

    if (typeFilter) {
      audits = audits.filter((entry) => entry.type === typeFilter);
    }

    if (search) {
      audits = audits.filter((entry) => {
        const message = entry.message.toLowerCase();
        const type = entry.type.toLowerCase();
        return message.includes(search) || type.includes(search);
      });
    }

    const response = audits
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((entry) => ({
        id: entry.id,
        type: entry.type,
        message: entry.message,
        createdAt: entry.createdAt.toISOString()
      }));

    return res.json({
      success: true,
      data: response
    });
  });
}
