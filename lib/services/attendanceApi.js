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
    // Admin-only: fix any employee's day directly (time and/or forced
    // status), without needing a correction request from them first.
    correctAttendance: builder.mutation({
      query: (body) => ({ url: '/attendance/correct', method: 'PUT', body }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Correction', 'Attendance'],
    }),
    lockAttendance: builder.mutation({
      query: (body) => ({ url: '/attendance/lock', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),

    getMonthlyAttendanceReport: builder.query({
      query: (params) => ({ url: '/attendance/report/monthly', params: cleanParams(params) }),
      transformResponse: (response) => ({ ...response.data, pagination: response.pagination }),
      providesTags: ['Attendance'],
    }),
    exportMonthlyAttendanceReportPdf: builder.mutation({
      query: (params) => ({ url: '/attendance/report/monthly/pdf', params: cleanParams(params), responseHandler: (response) => response.blob() }),
    }),
    getEmployeeAttendanceReport: builder.query({
      query: ({ userId, ...params }) => ({ url: `/attendance/report/employee/${userId}`, params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Attendance'],
    }),
    getAttendanceDashboard: builder.query({
      query: (params) => ({ url: '/attendance/dashboard', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Attendance', 'Dashboard'],
    }),
    // Day-by-day calendar for one employee (self or admin) - one entry per
    // calendar day, used to render an actual month grid rather than a list.
    getAttendanceCalendar: builder.query({
      query: ({ userId, ...params }) => ({ url: `/attendance/calendar/${userId}`, params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Attendance'],
    }),

    // Single-employee raw attendance record list (self or admin).
    getEmployeeAttendance: builder.query({
      query: ({ userId, ...params }) => ({ url: `/attendance/employee/${userId}`, params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Attendance'],
    }),

    // The one "default" attendance rule, exposed as a friendlier singleton
    // settings endpoint - edits the same AttendanceRule doc the Attendance
    // Rules list manages, so both stay in sync (shared 'AttendanceRule' tag).
    getAttendanceSettings: builder.query({
      query: () => '/attendance/settings',
      transformResponse: (response) => response.data,
      providesTags: ['AttendanceRule'],
    }),
    updateAttendanceSettings: builder.mutation({
      query: (body) => ({ url: '/attendance/settings', method: 'PUT', body }),
      invalidatesTags: ['AttendanceRule'],
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
  useCorrectAttendanceMutation,
  useLockAttendanceMutation,
  useGetMonthlyAttendanceReportQuery,
  useLazyGetMonthlyAttendanceReportQuery,
  useExportMonthlyAttendanceReportPdfMutation,
  useGetEmployeeAttendanceReportQuery,
  useGetAttendanceDashboardQuery,
  useGetAttendanceCalendarQuery,
  useGetEmployeeAttendanceQuery,
  useGetAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
} = attendanceApi;
