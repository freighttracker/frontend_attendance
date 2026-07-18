import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const holidaysApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHolidays: builder.query({
      query: (params) => ({ url: '/holidays', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Holiday'],
    }),
    getHoliday: builder.query({
      query: (id) => `/holidays/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Holiday', id }],
    }),
    createHoliday: builder.mutation({
      query: (body) => ({ url: '/holidays', method: 'POST', body }),
      invalidatesTags: ['Holiday'],
    }),
    bulkCreateHolidays: builder.mutation({
      query: (body) => ({ url: '/holidays/bulk', method: 'POST', body }),
      invalidatesTags: ['Holiday'],
    }),
    updateHoliday: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/holidays/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Holiday'],
    }),
    deleteHoliday: builder.mutation({
      query: (id) => ({ url: `/holidays/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Holiday'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetHolidaysQuery,
  useGetHolidayQuery,
  useCreateHolidayMutation,
  useBulkCreateHolidaysMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} = holidaysApi;
