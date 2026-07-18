import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const loanApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query({
      query: (params) => ({ url: '/loans', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Loan'],
    }),
    getLoan: builder.query({
      query: (id) => `/loans/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Loan', id }],
    }),
    createLoan: builder.mutation({
      query: (body) => ({ url: '/loans', method: 'POST', body }),
      invalidatesTags: ['Loan', 'PayrollDashboard'],
    }),
    recordLoanPayment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/payments`, method: 'POST', body }),
      invalidatesTags: (result, error, { id }) => ['Loan', 'PayrollDashboard', { type: 'Loan', id }],
    }),
    closeLoan: builder.mutation({
      query: (id) => ({ url: `/loans/${id}/close`, method: 'PUT' }),
      invalidatesTags: ['Loan', 'PayrollDashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useCreateLoanMutation,
  useRecordLoanPaymentMutation,
  useCloseLoanMutation,
} = loanApi;
