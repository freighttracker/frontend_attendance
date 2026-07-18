import { apiSlice } from './apiSlice';

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllSettings: builder.query({
      query: () => '/settings',
      transformResponse: (response) => response.data,
      providesTags: ['Setting'],
    }),
    getSetting: builder.query({
      query: (key) => `/settings/${key}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, key) => [{ type: 'Setting', id: key }],
    }),
    createSetting: builder.mutation({
      query: (body) => ({ url: '/settings', method: 'POST', body }),
      invalidatesTags: ['Setting'],
    }),
    updateSetting: builder.mutation({
      query: ({ key, ...body }) => ({ url: `/settings/${key}`, method: 'PUT', body }),
      invalidatesTags: ['Setting'],
    }),
    getAttendanceRules: builder.query({
      query: () => '/settings/attendance-rules',
      transformResponse: (response) => response.data,
      providesTags: ['AttendanceRule'],
    }),
    createAttendanceRule: builder.mutation({
      query: (body) => ({ url: '/settings/attendance-rules', method: 'POST', body }),
      invalidatesTags: ['AttendanceRule'],
    }),
    updateAttendanceRule: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/settings/attendance-rules/${id}`, method: 'PUT', body }),
      invalidatesTags: ['AttendanceRule'],
    }),
    deleteAttendanceRule: builder.mutation({
      query: (id) => ({ url: `/settings/attendance-rules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AttendanceRule'],
    }),
    getSandwichPolicy: builder.query({
      query: () => '/settings/sandwich-policy',
      transformResponse: (response) => response.data,
      providesTags: ['SandwichPolicy'],
    }),
    updateSandwichPolicy: builder.mutation({
      query: (body) => ({ url: '/settings/sandwich-policy', method: 'PUT', body }),
      invalidatesTags: ['SandwichPolicy'],
    }),
    toggleFeature: builder.mutation({
      query: ({ feature, enabled }) => ({ url: `/settings/features/${feature}`, method: 'PUT', body: { enabled } }),
      invalidatesTags: ['Setting'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllSettingsQuery,
  useGetSettingQuery,
  useCreateSettingMutation,
  useUpdateSettingMutation,
  useGetAttendanceRulesQuery,
  useCreateAttendanceRuleMutation,
  useUpdateAttendanceRuleMutation,
  useDeleteAttendanceRuleMutation,
  useGetSandwichPolicyQuery,
  useUpdateSandwichPolicyMutation,
  useToggleFeatureMutation,
} = settingsApi;
