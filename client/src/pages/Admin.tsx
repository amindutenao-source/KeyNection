import React, { useEffect, useMemo, useState } from "react";
import { apiGet, type ApiResponse } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminStats {
  users: number;
  properties: number;
  applications: number;
  contracts: number;
  payments: number;
  maintenance: number;
  documents: number;
  reviews: number;
  revenue: number;
}

interface AdminOverviewResponse {
  stats: AdminStats;
  recentActivity: Array<{ id: string; message: string; time: string; status: "pending" | "completed" }>;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "MANAGER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  method: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface AuditItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

const PAYMENT_METHODS = ["CREDIT_CARD", "BANK_TRANSFER", "PAYPAL", "STRIPE", "CASH"] as const;
const PAYMENT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"] as const;
const USER_ROLES = ["OWNER", "MANAGER", "ADMIN"] as const;
const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"] as const;
const AUDIT_TYPES = [
  "PAYMENT",
  "APPLICATION",
  "CONTRACT",
  "MAINTENANCE",
  "REVIEW",
  "DOCUMENT",
  "USER"
] as const;

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [stats, setStats] = useState<AdminStats | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPagination, setUserPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [userFilters, setUserFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 1,
    limit: 10
  });

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentPagination, setPaymentPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [paymentFilters, setPaymentFilters] = useState({
    status: "",
    method: "",
    page: 1,
    limit: 10
  });

  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [auditFilters, setAuditFilters] = useState({
    type: "",
    search: "",
    limit: 15
  });

  const [isLoading, setIsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statsCards = useMemo(
    () => [
      { label: "Utilisateurs", value: stats?.users ?? 0 },
      { label: "Propriétés", value: stats?.properties ?? 0 },
      { label: "Contrats", value: stats?.contracts ?? 0 },
      {
        label: "Revenus",
        value: new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "USD"
        }).format(stats?.revenue ?? 0)
      }
    ],
    [stats]
  );

  useEffect(() => {
    if (!isAdmin) return;

    const loadOverview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const overviewRes = await apiGet<AdminOverviewResponse>("/admin/overview");
        setStats(overviewRes.data.stats);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverview();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async () => {
      setUsersLoading(true);
      setError(null);
      try {
        const response = await apiGet<AdminUser[]>("/users", {
          page: userFilters.page,
          limit: userFilters.limit,
          role: userFilters.role || undefined,
          status: userFilters.status || undefined,
          search: userFilters.search || undefined
        });

        setUsers(response.data);
        const pagination = (response as ApiResponse<AdminUser[]> & { pagination?: Pagination })
          .pagination;
        if (pagination) {
          setUserPagination(pagination);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [isAdmin, userFilters]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadPayments = async () => {
      setPaymentsLoading(true);
      setError(null);
      try {
        const response = await apiGet<Payment[]>("/payments", {
          page: paymentFilters.page,
          limit: paymentFilters.limit,
          status: paymentFilters.status || undefined,
          method: paymentFilters.method || undefined,
          all: true
        });

        setPayments(response.data);
        const pagination = (response as ApiResponse<Payment[]> & { pagination?: Pagination })
          .pagination;
        if (pagination) {
          setPaymentPagination(pagination);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setPaymentsLoading(false);
      }
    };

    loadPayments();
  }, [isAdmin, paymentFilters]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadAudits = async () => {
      setAuditsLoading(true);
      setError(null);
      try {
        const response = await apiGet<AuditItem[]>("/admin/audits", {
          limit: auditFilters.limit,
          type: auditFilters.type || undefined,
          search: auditFilters.search || undefined
        });

        setAudits(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setAuditsLoading(false);
      }
    };

    loadAudits();
  }, [isAdmin, auditFilters]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Connectez-vous pour accéder à l'administration.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600">Suivi des utilisateurs, paiements et activité récente</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-600">Chargement...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {statsCards.map((card) => (
                <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Utilisateurs</h2>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={userFilters.search}
                      onChange={(event) =>
                        setUserFilters((prev) => ({
                          ...prev,
                          search: event.target.value,
                          page: 1
                        }))
                      }
                      placeholder="Rechercher..."
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                    <select
                      value={userFilters.role}
                      onChange={(event) =>
                        setUserFilters((prev) => ({
                          ...prev,
                          role: event.target.value,
                          page: 1
                        }))
                      }
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Tous les rôles</option>
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <select
                      value={userFilters.status}
                      onChange={(event) =>
                        setUserFilters((prev) => ({
                          ...prev,
                          status: event.target.value,
                          page: 1
                        }))
                      }
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Tous les statuts</option>
                      {USER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {usersLoading ? (
                  <p className="text-sm text-gray-500">Chargement des utilisateurs...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun utilisateur trouvé.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {users.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.firstName} {item.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{item.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{item.role}</p>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Page {userPagination.page} / {userPagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
                      disabled={userPagination.page <= 1}
                      onClick={() =>
                        setUserFilters((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1)
                        }))
                      }
                    >
                      Précédent
                    </button>
                    <button
                      className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
                      disabled={userPagination.page >= userPagination.totalPages}
                      onClick={() =>
                        setUserFilters((prev) => ({
                          ...prev,
                          page: prev.page + 1
                        }))
                      }
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Audits</h2>
                  <div className="flex flex-col gap-2">
                    <input
                      value={auditFilters.search}
                      onChange={(event) =>
                        setAuditFilters((prev) => ({
                          ...prev,
                          search: event.target.value
                        }))
                      }
                      placeholder="Filtrer par mot-clé"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                    <select
                      value={auditFilters.type}
                      onChange={(event) =>
                        setAuditFilters((prev) => ({
                          ...prev,
                          type: event.target.value
                        }))
                      }
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Tous les types</option>
                      {AUDIT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {auditsLoading ? (
                  <p className="text-sm text-gray-500">Chargement des audits...</p>
                ) : audits.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun audit disponible.</p>
                ) : (
                  <ul className="space-y-3">
                    {audits.map((audit) => (
                      <li key={audit.id} className="text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{audit.message}</p>
                        <p className="text-xs text-gray-500">
                          {audit.type} • {new Date(audit.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Paiements</h2>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={paymentFilters.status}
                    onChange={(event) =>
                      setPaymentFilters((prev) => ({
                        ...prev,
                        status: event.target.value,
                        page: 1
                      }))
                    }
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Tous les statuts</option>
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    value={paymentFilters.method}
                    onChange={(event) =>
                      setPaymentFilters((prev) => ({
                        ...prev,
                        method: event.target.value,
                        page: 1
                      }))
                    }
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Toutes les méthodes</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {paymentsLoading ? (
                <p className="text-sm text-gray-500">Chargement des paiements...</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun paiement trouvé.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <div key={payment.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.amount} {payment.currency}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.user?.firstName} {payment.user?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{payment.method}</p>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>
                  Page {paymentPagination.page} / {paymentPagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
                    disabled={paymentPagination.page <= 1}
                    onClick={() =>
                      setPaymentFilters((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1)
                      }))
                    }
                  >
                    Précédent
                  </button>
                  <button
                    className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
                    disabled={paymentPagination.page >= paymentPagination.totalPages}
                    onClick={() =>
                      setPaymentFilters((prev) => ({
                        ...prev,
                        page: prev.page + 1
                      }))
                    }
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
