import { apiSlice } from './apiSlice';

export const salaryFieldsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalaryFields: builder.query({
      query: (params) => ({ url: '/salary-fields', params }),
      transformResponse: (response) => response.data,
      providesTags: ['SalaryField'],
    }),
    createSalaryField: builder.mutation({
      query: (body) => ({ url: '/salary-fields', method: 'POST', body }),
      invalidatesTags: ['SalaryField'],
    }),
    updateSalaryField: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/salary-fields/${id}`, method: 'PUT', body }),
      invalidatesTags: ['SalaryField'],
    }),
    deleteSalaryField: builder.mutation({
      query: (id) => ({ url: `/salary-fields/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SalaryField'],
    }),
    reorderSalaryFields: builder.mutation({
      query: (order) => ({ url: '/salary-fields/reorder', method: 'PUT', body: { order } }),
      invalidatesTags: ['SalaryField'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSalaryFieldsQuery,
  useCreateSalaryFieldMutation,
  useUpdateSalaryFieldMutation,
  useDeleteSalaryFieldMutation,
  useReorderSalaryFieldsMutation,
} = salaryFieldsApi;
