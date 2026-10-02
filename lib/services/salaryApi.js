import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const salaryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMySalarySlips: builder.query({
      query: (params) => ({ url: '/salary/my-slips', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Salary'],
    }),
    getSalarySlip: builder.query({
      query: (id) => `/salary/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Salary', id }],
    }),
    getAllSalarySlips: builder.query({
      query: (params) => ({ url: '/salary/all', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Salary'],
    }),
    generateSalarySlip: builder.mutation({
      query: (body) => ({ url: '/salary/generate', method: 'POST', body }),
      invalidatesTags: ['Salary'],
    }),
    generateAllSalarySlips: builder.mutation({
      query: (body) => ({ url: '/salary/generate-all', method: 'POST', body }),
      invalidatesTags: ['Salary'],
    }),
    approveSalarySlip: builder.mutation({
      query: (id) => ({ url: `/salary/${id}/approve`, method: 'PUT' }),
      invalidatesTags: ['Salary'],
    }),
    publishSalarySlip: builder.mutation({
      query: (id) => ({ url: `/salary/${id}/publish`, method: 'PUT' }),
      invalidatesTags: ['Salary'],
    }),
    downloadSalarySlip: builder.mutation({
      query: (id) => ({ url: `/salary/${id}/download`, responseHandler: (response) => response.blob() }),
    }),
    markSalaryPaid: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/salary/${id}/pay`, method: 'PUT', body }),
      invalidatesTags: ['Salary'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMySalarySlipsQuery,
  useGetSalarySlipQuery,
  useGetAllSalarySlipsQuery,
  useGenerateSalarySlipMutation,
  useGenerateAllSalarySlipsMutation,
  useApproveSalarySlipMutation,
  usePublishSalarySlipMutation,
  useMarkSalaryPaidMutation,
  useDownloadSalarySlipMutation,
} = salaryApi;
