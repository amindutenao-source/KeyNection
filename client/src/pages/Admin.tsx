import React, { useEffect, useState } from "react";
import { apiGet } from "../services/api";
import { useAuth } from "../context/AuthContext";

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

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [overviewRes, usersRes, paymentsRes, auditsRes] = await Promise.all([
          apiGet<AdminOverviewResponse>("/admin/overview"),
          apiGet<AdminUser[]>("/users", { limit: 10 }),
          apiGet<Payment[]>("/payments", { limit: 10, all: true }),
          apiGet<AuditItem[]>("/admin/audits", { limit: 15 })
        ]);

        setStats(overviewRes.data.stats);
        setUsers(usersRes.data);
        setPayments(paymentsRes.data);
        setAudits(auditsRes.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Connectez-vous pour accéder à l'administration.</p>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
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
              {[
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
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs récents</h2>
                {users.length === 0 ? (
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
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Audits récents</h2>
                {audits.length === 0 ? (
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Paiements récents</h2>
              {payments.length === 0 ? (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
