import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const companiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyStats: builder.query({
      query: () => '/companies/stats',
      transformResponse: (response) => response.data,
      providesTags: ['Company'],
    }),
    getCompanies: builder.query({
      query: (params) => ({ url: '/companies', params: cleanParams(params) }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: (result) => [
        ...(result?.items || []).map((c) => ({ type: 'Company', id: c._id })),
        { type: 'Company', id: 'LIST' },
      ],
    }),
    getCompany: builder.query({
      query: (id) => `/companies/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Company', id }],
    }),
    createCompany: builder.mutation({
      query: (body) => ({ url: '/companies', method: 'POST', body }),
      invalidatesTags: [{ type: 'Company', id: 'LIST' }],
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/companies/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Company', id }, { type: 'Company', id: 'LIST' }],
    }),
    setCompanyStatus: builder.mutation({
      query: ({ id, isActive }) => ({ url: `/companies/${id}/status`, method: 'PUT', body: { isActive } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Company', id }, { type: 'Company', id: 'LIST' }, { type: 'SubCompany', id: 'LIST' }],
    }),
    archiveCompany: builder.mutation({
      query: (id) => ({ url: `/companies/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Company', id: 'LIST' }],
    }),
    getCompanyUsers: builder.query({
      query: ({ id, ...params }) => ({ url: `/companies/${id}/users`, params: cleanParams(params) }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: (result, error, { id }) => [{ type: 'Company', id: `${id}-users` }],
    }),

    getSubCompanies: builder.query({
      query: (params) => ({ url: '/subcompanies', params: cleanParams(params) }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: (result) => [
        ...(result?.items || []).map((s) => ({ type: 'SubCompany', id: s._id })),
        { type: 'SubCompany', id: 'LIST' },
      ],
    }),
    getSubCompany: builder.query({
      query: (id) => `/subcompanies/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'SubCompany', id }],
    }),
    createSubCompany: builder.mutation({
      query: (body) => ({ url: '/subcompanies', method: 'POST', body }),
      invalidatesTags: [{ type: 'SubCompany', id: 'LIST' }, { type: 'Company', id: 'LIST' }],
    }),
    updateSubCompany: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/subcompanies/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'SubCompany', id }, { type: 'SubCompany', id: 'LIST' }],
    }),
    setSubCompanyStatus: builder.mutation({
      query: ({ id, isActive }) => ({ url: `/subcompanies/${id}/status`, method: 'PUT', body: { isActive } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'SubCompany', id }, { type: 'SubCompany', id: 'LIST' }],
    }),
    archiveSubCompany: builder.mutation({
      query: (id) => ({ url: `/subcompanies/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'SubCompany', id: 'LIST' }],
    }),
    getSubCompanyUsers: builder.query({
      query: ({ id, ...params }) => ({ url: `/subcompanies/${id}/users`, params: cleanParams(params) }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: (result, error, { id }) => [{ type: 'SubCompany', id: `${id}-users` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCompanyStatsQuery,
  useGetCompaniesQuery,
  useGetCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useSetCompanyStatusMutation,
  useArchiveCompanyMutation,
  useGetCompanyUsersQuery,
  useGetSubCompaniesQuery,
  useGetSubCompanyQuery,
  useCreateSubCompanyMutation,
  useUpdateSubCompanyMutation,
  useSetSubCompanyStatusMutation,
  useArchiveSubCompanyMutation,
  useGetSubCompanyUsersQuery,
} = companiesApi;
