import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "CONDO"
  | "TOWNHOUSE"
  | "VILLA"
  | "COMMERCIAL"
  | "LAND"
  | "OTHER";

interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  monthlyRent?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  images: string[];
}

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  CONDO: "Condo",
  TOWNHOUSE: "Townhouse",
  VILLA: "Villa",
  COMMERCIAL: "Commercial",
  LAND: "Terrain",
  OTHER: "Autre"
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRequest<Property>(`/properties/${id}`);
        setProperty(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="text-center text-gray-600">Chargement en cours...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : !property ? (
          <div className="text-center text-gray-600">Aucune propriété trouvée.</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              <div>
                {property.images?.[0] ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-80 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    Aucune image disponible
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {PROPERTY_TYPE_LABELS[property.type] ?? "Autre"}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {property.monthlyRent ? `${property.monthlyRent}€ / mois` : "Sur demande"}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">{property.title}</h1>
                <p className="text-gray-600 mb-4">
                  {[property.address, property.city, property.state, property.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>

                <p className="text-gray-700 mb-6">{property.description}</p>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-900">{property.bedrooms ?? 0}</p>
                    <p>Chambres</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{property.bathrooms ?? 0}</p>
                    <p>Salles de bain</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{property.squareFeet ?? 0} m²</p>
                    <p>Surface</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
