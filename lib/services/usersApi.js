import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({ url: '/users', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: (result) => {
        const items = result?.users || result?.items || (Array.isArray(result) ? result : []);
        return [
          ...items.map((u) => ({ type: 'User', id: u._id })),
          { type: 'User', id: 'LIST' },
        ];
      },
    }),
    getDepartments: builder.query({
      query: () => '/users/departments/list',
      transformResponse: (response) => response.data,
    }),
    getMyProfile: builder.query({
      query: () => '/users/profile/me',
      transformResponse: (response) => response.data,
      providesTags: ['User'],
    }),
    updateMyProfile: builder.mutation({
      query: (body) => ({ url: '/users/profile/me', method: 'PUT', body }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['User'],
    }),
    uploadAvatar: builder.mutation({
      query: (formData) => ({ url: '/users/avatar', method: 'POST', body: formData }),
      invalidatesTags: ['User'],
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createEmployee: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    bulkUploadEmployees: builder.mutation({
      query: (formData) => ({ url: '/users/bulk-upload', method: 'POST', body: formData }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useGetDepartmentsQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadAvatarMutation,
  useGetUserQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useBulkUploadEmployeesMutation,
} = usersApi;
