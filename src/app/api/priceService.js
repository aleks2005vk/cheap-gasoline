/**
 * Price Service для Cheap Gasoline
 * Oптимистичные обновления, локальная валидация, кэширование
 */

import { apiSlice } from "./apiSlice";

/**
 * UpdateLocalPrice
 * Оптимистично обновляет цену в локальном состоянии ДО запроса к серверу
 *
 * @param {number} stationId - ID АЗС
 * @param {string} fuelType - Тип топлива (92, 95, 98, diesel)
 * @param {number} newPrice - Новая цена
 * @param {Function} dispatch - Redux dispatch
 * @returns {Function} - Функция отката изменений
 */
export const optimisticUpdatePrice = (
  stationId,
  fuelType,
  newPrice,
  dispatch,
) => {
  // Обновить в getStations
  const patchResult = dispatch(
    apiSlice.util.updateQueryData("getStations", undefined, (draft) => {
      const station = draft.find((s) => s.id === stationId);
      if (station) {
        const fuelIndex = station.prices.findIndex((f) => f.id === fuelType);
        if (fuelIndex !== -1) {
          // Сохранить старую цену для отката
          station.prices[fuelIndex].oldPrice = station.prices[fuelIndex].price;
          station.prices[fuelIndex].price = newPrice;
          station.prices[fuelIndex].isUpdating = true; // Флаг что обновляется
        }
      }
    }),
  );

  return patchResult;
};

/**
 * ValidatePrice
 * Валидация цены перед отправкой
 */
export const validatePrice = (price, fuelType) => {
  const errors = [];

  if (!price) {
    errors.push("Price is required");
  }

  if (typeof price !== "number" || price < 0 || price > 300) {
    errors.push("Price must be between 0 and 300 rubles");
  }

  const validFuels = ["92", "95", "98", "diesel", "lpg"];
  if (!validFuels.includes(fuelType)) {
    errors.push(`Fuel type must be one of: ${validFuels.join(", ")}`);
  }

  return errors;
};

/**
 * CachePrice
 * Сохраняет цену в localStorage для оффлайн режима
 */
export const cachePrice = (stationId, fuelType, price) => {
  try {
    const key = `price_${stationId}_${fuelType}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        price,
        timestamp: new Date().toISOString(),
        synced: false, // Не синхронизировано с сервером
      }),
    );
  } catch (e) {
    console.warn("Failed to cache price:", e);
  }
};

/**
 * GetCachedPrice
 * Получает кэшированную цену
 */
export const getCachedPrice = (stationId, fuelType) => {
  try {
    const key = `price_${stationId}_${fuelType}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to get cached price:", e);
  }
  return null;
};

/**
 * CalculatePriceChange
 * Вычисляет изменение цены в процентах
 */
export const calculatePriceChange = (oldPrice, newPrice) => {
  if (!oldPrice || oldPrice === 0) return 0;
  return (((newPrice - oldPrice) / oldPrice) * 100).toFixed(1);
};

/**
 * FormatPrice
 * Форматирует цену для отображения
 */
export const formatPrice = (price) => {
  if (!price) return "—";
  return `₽${(Math.round(price * 100) / 100).toFixed(2)}`;
};

/**
 * GetPriceColor
 * Возвращает цвет цены для визуализации
 * Зелёный = дешевая, красный = дорогая
 */
export const getPriceColor = (price, avgPrice) => {
  if (!avgPrice) return "text-gray-500";

  const diff = ((price - avgPrice) / avgPrice) * 100;

  if (diff < -10) return "text-green-600"; // Намного дешевле
  if (diff < -5) return "text-green-500"; // Дешевле
  if (diff > 10) return "text-red-600"; // Намного дороже
  if (diff > 5) return "text-red-500"; // Дороже

  return "text-gray-600"; // Средняя цена
};

/**
 * SyncPendingPrices
 * Синхронизирует несинхронизированные цены при возврате интернета
 */
export const syncPendingPrices = async (dispatch, updatePriceMutation) => {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith("price_"));

  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!data.synced && data.price) {
        try {
          await updatePriceMutation(data).unwrap();
          // Отметить как синхронизировано
          data.synced = true;
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
          console.warn(`Failed to sync price ${key}:`, e);
        }
      }
    } catch (e) {
      console.warn("Error syncing prices:", e);
    }
  }
};
