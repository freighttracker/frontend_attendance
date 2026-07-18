import { apiSlice } from './apiSlice';

export const weekendsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWeekendConfigs: builder.query({
      query: () => '/weekends',
      transformResponse: (response) => response.data,
      providesTags: ['Weekend'],
    }),
    updateWeekendConfig: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/weekends/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Weekend'],
    }),
    bulkUpdateWeekendConfigs: builder.mutation({
      query: (body) => ({ url: '/weekends/bulk', method: 'PUT', body }),
      invalidatesTags: ['Weekend'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWeekendConfigsQuery,
  useUpdateWeekendConfigMutation,
  useBulkUpdateWeekendConfigsMutation,
} = weekendsApi;
