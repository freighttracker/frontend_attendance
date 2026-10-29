import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

// Keeps pagination for paged lists (plain `response.data` would drop it);
// unwrapList() reads the `items` key.
const paged = (response) => ({ items: response.data || [], pagination: response.pagination || null });

export const geoApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOfficeLocations: builder.query({
      query: (params) => ({ url: '/office-locations', params: cleanParams(params) }),
      transformResponse: paged,
      providesTags: ['OfficeLocation'],
    }),
    createOfficeLocation: builder.mutation({
      query: (body) => ({ url: '/office-locations', method: 'POST', body }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['OfficeLocation', 'GeoAudit'],
    }),
    updateOfficeLocation: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/office-locations/${id}`, method: 'PUT', body }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['OfficeLocation', 'OfficeAssignment', 'GeoAudit'],
    }),
    setOfficeLocationStatus: builder.mutation({
      query: ({ id, isActive }) => ({ url: `/office-locations/${id}/status`, method: 'PUT', body: { isActive } }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['OfficeLocation', 'OfficeAssignment', 'GeoAudit'],
    }),

    getMyGeoPermissions: builder.query({
      query: () => '/office-locations/my-permissions',
      transformResponse: (response) => response.data,
      providesTags: ['GeoPermission'],
    }),
    getAdminGeoPermissions: builder.query({
      query: (params) => ({ url: '/office-locations/admin-permissions', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['GeoPermission'],
    }),
    setAdminGeoPermission: builder.mutation({
      query: ({ userId, ...body }) => ({ url: `/office-locations/admin-permissions/${userId}`, method: 'PUT', body }),
      invalidatesTags: ['GeoPermission', 'GeoAudit'],
    }),
    resetAdminGeoPermission: builder.mutation({
      query: (userId) => ({ url: `/office-locations/admin-permissions/${userId}`, method: 'DELETE' }),
      invalidatesTags: ['GeoPermission', 'GeoAudit'],
    }),

    getOfficeAssignments: builder.query({
      query: ({ userId, ...params }) => ({ url: `/users/${userId}/office-assignments`, params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, { userId }) => [{ type: 'OfficeAssignment', id: userId }],
    }),
    setOfficeAssignments: builder.mutation({
      query: ({ userId, assignments }) => ({ url: `/users/${userId}/office-assignments`, method: 'PUT', body: { assignments } }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { userId }) => [{ type: 'OfficeAssignment', id: userId }, 'OfficeLocation', 'GeoAudit'],
    }),

    getGeoPolicy: builder.query({
      query: (params) => ({ url: '/attendance/geo-policy', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['GeoPolicy'],
    }),
    updateGeoPolicy: builder.mutation({
      query: ({ companyId, ...body }) => ({ url: '/attendance/geo-policy', method: 'PUT', body, params: cleanParams({ companyId }) }),
      transformResponse: (response) => response.data,
      // The employee dashboard's /today payload carries the policy too.
      invalidatesTags: ['GeoPolicy', 'Attendance', 'GeoAudit'],
    }),

    getAttendanceLocations: builder.query({
      query: (params) => ({ url: '/attendance/locations', params: cleanParams(params) }),
      transformResponse: paged,
      providesTags: ['Attendance'],
    }),
    getAttendanceLocation: builder.query({
      query: (id) => `/attendance/${id}/location`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Attendance', id }],
    }),
    reviewAttendanceLocation: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/attendance/${id}/location-review`, method: 'PUT', body }),
      invalidatesTags: ['Attendance', 'GeoAudit', 'Dashboard'],
    }),

    getGeoAuditLogs: builder.query({
      query: (params) => ({ url: '/attendance/geo-audit-logs', params: cleanParams(params) }),
      transformResponse: paged,
      providesTags: ['GeoAudit'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOfficeLocationsQuery,
  useCreateOfficeLocationMutation,
  useUpdateOfficeLocationMutation,
  useSetOfficeLocationStatusMutation,
  useGetMyGeoPermissionsQuery,
  useGetAdminGeoPermissionsQuery,
  useSetAdminGeoPermissionMutation,
  useResetAdminGeoPermissionMutation,
  useGetOfficeAssignmentsQuery,
  useSetOfficeAssignmentsMutation,
  useGetGeoPolicyQuery,
  useUpdateGeoPolicyMutation,
  useGetAttendanceLocationsQuery,
  useGetAttendanceLocationQuery,
  useReviewAttendanceLocationMutation,
  useGetGeoAuditLogsQuery,
} = geoApi;
