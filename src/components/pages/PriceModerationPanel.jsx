import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../app/api/authSlice";
import { API_URL } from "../../config";
import { useTranslation } from "react-i18next";

export default function PriceModerationPanel() {
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  const [pendingPrices, setPendingPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const canModerate =
    user?.role === "admin" || user?.role === "moderator" || user?.is_admin;

  useEffect(() => {
    if (canModerate) fetchPendingPrices();
  }, [canModerate]);

  const fetchPendingPrices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pending-prices`);
      if (response.ok) {
        const data = await response.json();
        setPendingPrices(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceAction = async (priceId, action) => {
    try {
      const response = await fetch(`${API_URL}/api/moderate-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: priceId,
          action,
          moderator_id: user.id,
        }),
      });
      if (response.ok)
        setPendingPrices((prev) => prev.filter((p) => p.id !== priceId));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredPrices = pendingPrices.filter(
    (price) => filter === "all" || price.status === filter,
  );

  const filterOptions = [
    { value: "all", labelKey: "filterAll" },
    { value: "pending", labelKey: "filterPending" },
    { value: "approved", labelKey: "filterApproved" },
    { value: "rejected", labelKey: "filterRejected" },
  ];

  const getStatusLabel = (status) => {
    if (status === "pending") return t("statusPending");
    if (status === "approved") return t("statusApproved");
    return t("statusRejected");
  };

  if (!canModerate) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("accessDenied")}</h1>
          <p>{t("noAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("moderationPanel")}
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {t("managePricesDesc")}
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          {filterOptions.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-lg transition-all ${filter === value ? "shadow-md" : ""}`}
              style={{
                backgroundColor:
                  filter === value
                    ? "var(--accent-color)"
                    : "var(--bg-tertiary)",
                color:
                  filter === value
                    ? "var(--bg-primary)"
                    : "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            >
              {t(labelKey)} (
              {
                pendingPrices.filter(
                  (p) => value === "all" || p.status === value,
                ).length
              }
              )
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              statusFilter: "pending",
              labelKey: "awaitingMod",
              colorVar: "--accent-color",
            },
            {
              statusFilter: "approved",
              labelKey: "approvedToday",
              colorVar: "--success-color",
            },
            {
              statusFilter: "rejected",
              labelKey: "rejectedToday",
              colorVar: "--error-color",
            },
            {
              statusFilter: null,
              labelKey: "totalRecords",
              colorVar: "--text-primary",
            },
          ].map(({ statusFilter, labelKey, colorVar }) => (
            <div
              key={labelKey}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: `var(${colorVar})` }}
              >
                {statusFilter
                  ? pendingPrices.filter((p) => p.status === statusFilter)
                      .length
                  : pendingPrices.length}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>
                {t(labelKey)}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: "var(--accent-color)" }}
            ></div>
            <p className="mt-4" style={{ color: "var(--text-secondary)" }}>
              {t("loading")}
            </p>
          </div>
        ) : filteredPrices.length === 0 ? (
          <div
            className="text-center py-12"
            style={{ color: "var(--text-secondary)" }}
          >
            <p>{t("noPrices")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrices.map((price) => (
              <div
                key={price.id}
                className="p-6 rounded-lg"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "0 2px 8px var(--shadow-color)",
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {price.station_name}
                    </h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {price.station_address}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      price.status === "pending"
                        ? "text-yellow-600 bg-yellow-100"
                        : price.status === "approved"
                          ? "text-green-600 bg-green-100"
                          : "text-red-600 bg-red-100"
                    }`}
                  >
                    {getStatusLabel(price.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {t("fuelType")}
                    </span>
                    <p style={{ color: "var(--text-primary)" }}>
                      {price.fuel_type}
                    </p>
                  </div>
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {t("suggestedPrice")}
                    </span>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "var(--accent-color)" }}
                    >
                      {price.price} ₾
                    </p>
                  </div>
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {t("suggestedBy")}
                    </span>
                    <p style={{ color: "var(--text-primary)" }}>
                      {price.user_name}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div style={{ color: "var(--text-muted)" }}>
                    {new Date(price.created_at).toLocaleString()}
                  </div>
                  {price.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePriceAction(price.id, "approve")}
                        className="px-4 py-2 rounded-lg transition-all hover:scale-105"
                        style={{
                          backgroundColor: "var(--success-color)",
                          color: "white",
                        }}
                      >
                        {t("approve")}
                      </button>
                      <button
                        onClick={() => handlePriceAction(price.id, "reject")}
                        className="px-4 py-2 rounded-lg transition-all hover:scale-105"
                        style={{
                          backgroundColor: "var(--error-color)",
                          color: "white",
                        }}
                      >
                        {t("reject")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
