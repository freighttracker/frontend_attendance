import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkIn: builder.mutation({
      query: (body) => ({ url: '/attendance/check-in', method: 'POST', body }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    checkOut: builder.mutation({
      query: (body) => ({ url: '/attendance/check-out', method: 'POST', body }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    getTodayAttendance: builder.query({
      query: () => '/attendance/today',
      transformResponse: (response) => response.data,
      providesTags: ['Attendance'],
    }),
    getAttendanceHistory: builder.query({
      query: (params) => ({ url: '/attendance/history', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Attendance'],
    }),
    getWorkingHours: builder.query({
      query: (params) => ({ url: '/attendance/working-hours', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Attendance'],
    }),
    requestCorrection: builder.mutation({
      query: (body) => ({ url: '/attendance/correction', method: 'POST', body }),
      invalidatesTags: ['Correction'],
    }),
    getMyCorrections: builder.query({
      query: (params) => ({ url: '/attendance/my-corrections', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Correction'],
    }),
    getAllAttendance: builder.query({
      query: (params) => ({ url: '/attendance/all', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Attendance'],
    }),
    getCorrectionRequests: builder.query({
      query: (params) => ({ url: '/attendance/corrections', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Correction'],
    }),
    reviewCorrection: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/attendance/corrections/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Correction', 'Attendance'],
    }),
    lockAttendance: builder.mutation({
      query: (body) => ({ url: '/attendance/lock', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCheckInMutation,
  useCheckOutMutation,
  useGetTodayAttendanceQuery,
  useGetAttendanceHistoryQuery,
  useGetWorkingHoursQuery,
  useRequestCorrectionMutation,
  useGetMyCorrectionsQuery,
  useGetAllAttendanceQuery,
  useGetCorrectionRequestsQuery,
  useReviewCorrectionMutation,
  useLockAttendanceMutation,
} = attendanceApi;
