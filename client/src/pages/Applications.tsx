import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

interface Application {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "UNDER_REVIEW";
  createdAt: string;
  property?: {
    id: string;
    title: string;
    city?: string | null;
    state?: string | null;
    monthlyRent?: number | null;
    images?: string[];
  };
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRequest<Application[]>("/applications");
        setApplications(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-6">Candidatures</h1>
        <div className="bg-white rounded-lg shadow p-6">
          {isLoading ? (
            <p className="text-gray-600">Chargement des candidatures...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : applications.length === 0 ? (
            <p className="text-gray-600">Aucune candidature pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => {
                const location = [application.property?.city, application.property?.state]
                  .filter(Boolean)
                  .join(", ");
                const createdAt = new Date(application.createdAt).toLocaleDateString("fr-FR");
                const price = application.property?.monthlyRent
                  ? `${application.property.monthlyRent}€ / mois`
                  : "Sur demande";

                return (
                  <div
                    key={application.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-200 rounded-lg p-4"
                  >
                    <div>
                      <p className="text-sm text-gray-500">{createdAt}</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.property?.title ?? "Propriété"}
                      </h3>
                      <p className="text-sm text-gray-600">{location}</p>
                      <p className="text-sm text-blue-600">{price}</p>
                    </div>
                    <span className="mt-4 sm:mt-0 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {application.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
