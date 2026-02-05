import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { apiGet } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Property {
  id: string;
  title: string;
  createdAt: string;
}

interface Application {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "UNDER_REVIEW";
  createdAt: string;
  property?: {
    title: string;
  };
}

interface StatBlock {
  properties: number;
  applications: number;
  contracts: number;
  revenue: string;
}

interface ActivityItem {
  id: string;
  message: string;
  time: string;
  status: "pending" | "completed";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatBlock>({
    properties: 0,
    applications: 0,
    contracts: 0,
    revenue: "—"
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadOwnerData = async () => {
      const response = await apiGet<Property[]>("/properties/owner/my-properties");
      const properties = response.data;
      setStats((prev) => ({
        ...prev,
        properties: properties.length
      }));

      const recent: ActivityItem[] = properties.slice(0, 3).map((property) => ({
        id: property.id,
        message: `Propriété ajoutée: ${property.title}`,
        time: new Date(property.createdAt).toLocaleDateString("fr-FR"),
        status: "completed"
      }));
      setRecentActivity(recent);
    };

    const loadManagerData = async () => {
      const [applicationsResponse, availableResponse] = await Promise.all([
        apiGet<Application[]>("/applications"),
        apiGet<Property[]>("/properties/manager/available")
      ]);

      const applications = applicationsResponse.data;
      const available = availableResponse.data;

      setStats((prev) => ({
        ...prev,
        properties: available.length,
        applications: applications.length
      }));

      const recent: ActivityItem[] = applications.slice(0, 3).map((application) => ({
        id: application.id,
        message: `Candidature ${application.status.toLowerCase()} - ${application.property?.title ?? "Propriété"}`,
        time: new Date(application.createdAt).toLocaleDateString("fr-FR"),
        status: application.status === "APPROVED" ? "completed" : "pending"
      }));
      setRecentActivity(recent);
    };

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (user.role === "OWNER") {
          await loadOwnerData();
        } else {
          await loadManagerData();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  const statsCards = useMemo(
    () => [
      {
        label: "Propriétés",
        value: stats.properties,
        badgeClass: "bg-blue-100",
        iconClass: "text-blue-600"
      },
      {
        label: "Candidatures",
        value: stats.applications,
        badgeClass: "bg-green-100",
        iconClass: "text-green-600"
      },
      {
        label: "Contrats",
        value: stats.contracts,
        badgeClass: "bg-purple-100",
        iconClass: "text-purple-600"
      },
      {
        label: "Revenus",
        value: stats.revenue,
        badgeClass: "bg-yellow-100",
        iconClass: "text-yellow-600"
      }
    ],
    [stats]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Tableau de bord
              </h1>
              <p className="mt-1 text-gray-600">
                Gérez vos propriétés et suivez vos activités
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link to="/properties/new">
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter une propriété
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 ${card.badgeClass} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${card.iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/properties" className="block">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Mes propriétés</h3>
                  <p className="text-sm text-gray-500">Gérer vos annonces</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/applications" className="block">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Candidatures</h3>
                  <p className="text-sm text-gray-500">Examiner les demandes</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/contracts" className="block">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Contrats</h3>
                  <p className="text-sm text-gray-500">Voir et gérer</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-10">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h2>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-gray-500">Chargement...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune activité récente.</p>
              ) : (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.status === 'completed' ? 'Terminé' : 'En attente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
