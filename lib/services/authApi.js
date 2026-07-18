import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
      transformResponse: (response) => response.data,
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['User'],
    }),
    refreshToken: builder.mutation({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', body }),
      transformResponse: (response) => response.data,
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      transformResponse: (response) => response.data,
      providesTags: ['User'],
    }),
    updatePassword: builder.mutation({
      query: (body) => ({ url: '/auth/password', method: 'PUT', body }),
    }),
    logoutApi: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdatePasswordMutation,
  useLogoutApiMutation,
} = authApi;
