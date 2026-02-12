import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    // ПРЯМОЙ АДРЕС ТВОЕГО СЕРВЕРА
    baseUrl: "https://cheap-gasoline.onrender.com",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Station", "Price"],
  endpoints: (builder) => ({
    // Здесь будут твои инъекции эндпоинтов из других файлов
  }),
});
