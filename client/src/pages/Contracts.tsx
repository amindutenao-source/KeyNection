import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

interface Contract {
  id: string;
  status: string;
  createdAt?: string;
  property?: {
    title: string;
  };
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRequest<Contract[]>("/contracts");
        setContracts(response.data);
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
        <h1 className="text-3xl font-bold mb-6">Contrats</h1>
        <div className="bg-white rounded-lg shadow p-6">
          {isLoading ? (
            <p className="text-gray-600">Chargement des contrats...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : contracts.length === 0 ? (
            <p className="text-gray-600">Aucun contrat disponible pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-200 rounded-lg p-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.property?.title ?? "Contrat"}
                    </h3>
                    {contract.createdAt && (
                      <p className="text-sm text-gray-500">
                        {new Date(contract.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <span className="mt-4 sm:mt-0 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {contract.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
