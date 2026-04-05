import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../../config";
import { auth } from "./firebaseAuth";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: async (headers) => {
    // Получить Firebase ID token
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      headers.set("authorization", `Bearer ${idToken}`);
    }
    return headers;
  },
});

/**
 * Базовый query с Firebase ID token
 */
const baseQueryWithFirebase = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Если 401, возможно токен истек - Firebase сам обновит
    // Повторить запрос
    result = await baseQuery(args, api, extraOptions);
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithFirebase,
  tagTypes: ["Station", "User", "Profile", "Contributions", "History", "Points"],

  endpoints: (builder) => ({
    // ============ STATIONS ============

    getStations: builder.query({
      query: () => "/api/stations",
      providesTags: ["Station"],
    }),

    getPoints: builder.query({
      query: () => "/api/stations",
      providesTags: ["Points"],
    }),

    getStationByID: builder.query({
      query: (id) => `/api/station/${id}`,
      providesTags: (result, error, id) => [{ type: "Station", id }],
    }),

    // ============ BEST PRICE ============

    getBestPrice: builder.query({
      query: ({ latitude, longitude, radius_km = 5, fuel_type = "95" }) => ({
        url: "/api/station/best-price",
        method: "POST",
        body: { latitude, longitude, radius_km, fuel_type },
      }),
    }),

    // ============ PRICE HISTORY ============

    getPriceHistory: builder.query({
      query: ({ stationId, fuelType, days = 30 }) =>
        `/api/station/${stationId}/price-history/${fuelType}?days=${days}`,
      providesTags: (result, error, { stationId, fuelType }) => [
        { type: "History", id: `${stationId}_${fuelType}` },
      ],
    }),

    // ============ AUTHENTICATION ============
    // Register и Login теперь через Firebase (firebaseAuth.js)

    // ============ USER PROFILE ============

    getProfile: builder.query({
      query: () => "/api/user/profile",
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation({
      query: (payload) => ({
        url: "/api/user/profile",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Profile"],
    }),

    getContributions: builder.query({
      query: ({ skip = 0, limit = 20 }) =>
        `/api/user/contributions?skip=${skip}&limit=${limit}`,
      providesTags: ["Contributions"],
    }),

    // ============ PRICES ============

    updatePrice: builder.mutation({
      query: (payload) => ({
        url: "/api/price/update",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Station", "Contributions", "History"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        /**
         * ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ:
         * Обновляем UI ДО получения ответа с сервера
         */
        const { stationId, fuel_type, price } = arg;

        // Обновить список станций оптимистично
        const patchResult = dispatch(
          apiSlice.util.updateQueryData("getStations", undefined, (draft) => {
            const station = draft.find((s) => s.id === stationId);
            if (station) {
              const fuelIndex = station.prices.findIndex(
                (f) => f.id === fuel_type,
              );
              if (fuelIndex !== -1) {
                draft[draft.indexOf(station)].prices[fuelIndex].price = price;
              }
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          // Откатить изменения если запрос не удался
          patchResult.undo();
        }
      },
    }),

    confirmPrice: builder.mutation({
      query: ({ priceId, isCorrect }) => ({
        url: `/api/price/confirm/${priceId}`,
        method: "POST",
        body: { is_correct: isCorrect },
      }),
      invalidatesTags: ["Contributions"],
    }),

    // ============ ADMIN ============

    getModerationList: builder.query({
      query: ({ limit = 50 }) => `/api/admin/moderation/recent?limit=${limit}`,
    }),

    flagPrice: builder.mutation({
      query: ({ priceId, reason }) => ({
        url: `/api/admin/price/${priceId}/flag`,
        method: "POST",
        body: { reason },
      }),
    }),
  }),
});

export const {
  useGetStationsQuery,
  useGetPointsQuery,
  useGetStationByIDQuery,
  useGetBestPriceQuery,
  useGetPriceHistoryQuery,
  useRegisterMutation,
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetContributionsQuery,
  useUpdatePriceMutation,
  useConfirmPriceMutation,
  useGetModerationListQuery,
  useFlagPriceMutation,
} = apiSlice;
