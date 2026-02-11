import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Создаем базу для запросов
const baseQuery = fetchBaseQuery({
  // ИСПРАВЛЕНО: Теперь запросы летят к твоему Python, а не на тестовый сайт
  baseUrl: "http://127.0.0.1:8001",
  prepareHeaders: (headers, { getState }) => {
    // Достаем токен из Redux (authSlice)
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Мы пока убираем сложную логику Reauth, так как в бэкенде нет эндпоинта /refresh
// Это заставляло систему "зависать" при ошибках
export const apiSlice = createApi({
  baseQuery: baseQuery,
  endpoints: (builder) => ({}),
});
