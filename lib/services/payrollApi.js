import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const payrollApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayrollDashboard: builder.query({
      query: (params) => ({ url: '/payroll/dashboard', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['PayrollDashboard'],
    }),

    getSalaryStructures: builder.query({
      query: (params) => ({ url: '/payroll/salary-structures', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['SalaryStructure'],
    }),
    getSalaryStructure: builder.query({
      query: (userId) => `/payroll/salary-structures/${userId}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, userId) => [{ type: 'SalaryStructure', id: userId }],
    }),
    getSalaryStructureHistory: builder.query({
      query: (userId) => `/payroll/salary-structures/${userId}/history`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, userId) => [{ type: 'SalaryStructure', id: `${userId}-history` }],
    }),
    saveSalaryStructure: builder.mutation({
      query: ({ userId, ...body }) => ({ url: `/payroll/salary-structures/${userId}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { userId }) => ['SalaryStructure', { type: 'SalaryStructure', id: userId }],
    }),

    generatePayroll: builder.mutation({
      query: (body) => ({ url: '/payroll/generate', method: 'POST', body }),
      invalidatesTags: ['Salary', 'PayrollDashboard'],
    }),

    getPayrollReport: builder.query({
      query: (params) => ({ url: '/payroll/reports', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
    }),
    exportPayrollReport: builder.mutation({
      query: (params) => ({ url: '/payroll/reports/export', params: cleanParams(params), responseHandler: (response) => response.blob() }),
    }),

    getPayrollSettings: builder.query({
      query: () => '/payroll/settings',
      transformResponse: (response) => response.data,
      providesTags: ['PayrollSettings'],
    }),
    updatePayrollSettings: builder.mutation({
      query: (body) => ({ url: '/payroll/settings', method: 'PUT', body }),
      invalidatesTags: ['PayrollSettings'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPayrollDashboardQuery,
  useGetSalaryStructuresQuery,
  useGetSalaryStructureQuery,
  useGetSalaryStructureHistoryQuery,
  useSaveSalaryStructureMutation,
  useGeneratePayrollMutation,
  useLazyGetPayrollReportQuery,
  useExportPayrollReportMutation,
  useGetPayrollSettingsQuery,
  useUpdatePayrollSettingsMutation,
} = payrollApi;
