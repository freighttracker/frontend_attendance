import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceReport: builder.query({
      query: (params) => ({ url: '/reports/attendance', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
    }),
    getLeaveReport: builder.query({
      query: (params) => ({ url: '/reports/leaves', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
    }),
    getSalaryReport: builder.query({
      query: (params) => ({ url: '/reports/salary', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
    }),
    getMonthlySummary: builder.query({
      query: (params) => ({ url: '/reports/monthly-summary', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
    }),
    getLateComersReport: builder.query({
      query: (params) => ({ url: '/reports/late-comers', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAttendanceReportQuery,
  useLazyGetAttendanceReportQuery,
  useGetLeaveReportQuery,
  useLazyGetLeaveReportQuery,
  useGetSalaryReportQuery,
  useLazyGetSalaryReportQuery,
  useGetMonthlySummaryQuery,
  useLazyGetMonthlySummaryQuery,
  useGetLateComersReportQuery,
  useLazyGetLateComersReportQuery,
} = reportsApi;
