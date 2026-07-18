import { apiSlice } from './apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => '/dashboard/admin',
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),
    getEmployeeDashboard: builder.query({
      query: () => '/dashboard/employee',
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAdminDashboardQuery, useGetEmployeeDashboardQuery } = dashboardApi;
