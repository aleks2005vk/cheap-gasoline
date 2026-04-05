import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function StationSearch({ stations, onFilterChange }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFuelTypes, setSelectedFuelTypes] = useState([]);
  const [sortBy, setSortBy] = useState("name");

  const fuelTypes = useMemo(() => {
    const types = new Set();
    stations.forEach((station) => {
      station.prices?.forEach((price) => {
        if (price.fuel_type) types.add(price.fuel_type);
      });
    });
    return Array.from(types);
  }, [stations]);

  const filteredStations = useMemo(() => {
    let filtered = stations.filter((station) => {
      const matchesSearch =
        searchTerm === "" ||
        station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFuel =
        selectedFuelTypes.length === 0 ||
        station.prices?.some(
          (price) =>
            selectedFuelTypes.includes(price.fuel_type) &&
            price.price &&
            price.price !== "—",
        );
      return matchesSearch && matchesFuel;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name?.localeCompare(b.name) || 0;
        case "price": {
          const aPrice = Math.min(
            ...(a.prices
              ?.filter(
                (p) =>
                  p.fuel_type === "Бензин А-95" && p.price && p.price !== "—",
              )
              .map((p) => parseFloat(p.price)) || [Infinity]),
          );
          const bPrice = Math.min(
            ...(b.prices
              ?.filter(
                (p) =>
                  p.fuel_type === "Бензин А-95" && p.price && p.price !== "—",
              )
              .map((p) => parseFloat(p.price)) || [Infinity]),
          );
          return aPrice - bPrice;
        }
        case "distance":
          return (a.distance || 0) - (b.distance || 0);
        default:
          return 0;
      }
    });
    return filtered;
  }, [stations, searchTerm, selectedFuelTypes, sortBy]);

  React.useEffect(() => {
    onFilterChange(filteredStations);
  }, [filteredStations, onFilterChange]);

  const toggleFuelType = (fuelType) => {
    setSelectedFuelTypes((prev) =>
      prev.includes(fuelType)
        ? prev.filter((type) => type !== fuelType)
        : [...prev, fuelType],
    );
  };

  const sortOptions = [
    { value: "name", labelKey: "sortByName" },
    { value: "price", labelKey: "sortByPrice" },
    { value: "distance", labelKey: "sortByDistance" },
  ];

  return (
    <div
      className="p-4 space-y-4"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div className="relative">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
          }}
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: "var(--text-muted)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div>
        <h3
          className="text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("fuelTypes")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {fuelTypes.map((fuelType) => (
            <button
              key={fuelType}
              onClick={() => toggleFuelType(fuelType)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${selectedFuelTypes.includes(fuelType) ? "shadow-md" : ""}`}
              style={{
                backgroundColor: selectedFuelTypes.includes(fuelType)
                  ? "var(--accent-color)"
                  : "var(--bg-tertiary)",
                color: selectedFuelTypes.includes(fuelType)
                  ? "var(--bg-primary)"
                  : "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            >
              {fuelType}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3
          className="text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("sortLabel")}
        </h3>
        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${sortBy === option.value ? "shadow-md" : ""}`}
              style={{
                backgroundColor:
                  sortBy === option.value
                    ? "var(--accent-color)"
                    : "var(--bg-tertiary)",
                color:
                  sortBy === option.value
                    ? "var(--bg-primary)"
                    : "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        {t("foundStations", { count: filteredStations.length })}
        {searchTerm && ` ${t("searchQuery", { term: searchTerm })}`}
      </div>
    </div>
  );
}
