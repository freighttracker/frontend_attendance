import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const reimbursementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReimbursements: builder.query({
      query: (params) => ({ url: '/reimbursements', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Reimbursement'],
    }),
    createReimbursement: builder.mutation({
      query: (body) => ({ url: '/reimbursements', method: 'POST', body }),
      invalidatesTags: ['Reimbursement', 'PayrollDashboard'],
    }),
    approveReimbursement: builder.mutation({
      query: (id) => ({ url: `/reimbursements/${id}/approve`, method: 'PUT' }),
      invalidatesTags: ['Reimbursement', 'PayrollDashboard'],
    }),
    rejectReimbursement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/reimbursements/${id}/reject`, method: 'PUT', body }),
      invalidatesTags: ['Reimbursement', 'PayrollDashboard'],
    }),
    deleteReimbursement: builder.mutation({
      query: (id) => ({ url: `/reimbursements/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reimbursement', 'PayrollDashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetReimbursementsQuery,
  useCreateReimbursementMutation,
  useApproveReimbursementMutation,
  useRejectReimbursementMutation,
  useDeleteReimbursementMutation,
} = reimbursementApi;
