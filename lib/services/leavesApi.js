import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const leavesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    applyLeave: builder.mutation({
      query: (body) => ({ url: '/leaves/apply', method: 'POST', body }),
      invalidatesTags: ['Leave'],
    }),
    getMyLeaves: builder.query({
      query: (params) => ({ url: '/leaves/my-leaves', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Leave'],
    }),
    getLeaveBalance: builder.query({
      query: (params) => ({ url: '/leaves/balance', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Leave'],
    }),
    cancelLeave: builder.mutation({
      query: (id) => ({ url: `/leaves/${id}/cancel`, method: 'PUT' }),
      invalidatesTags: ['Leave'],
    }),
    getAllLeaves: builder.query({
      query: (params) => ({ url: '/leaves/all', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Leave'],
    }),
    reviewLeave: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leaves/${id}/status`, method: 'PUT', body }),
      invalidatesTags: ['Leave'],
    }),
    getLeaveTypes: builder.query({
      query: () => '/leaves/types',
      transformResponse: (response) => response.data,
      providesTags: ['LeaveType'],
    }),
    createLeaveType: builder.mutation({
      query: (body) => ({ url: '/leaves/types', method: 'POST', body }),
      invalidatesTags: ['LeaveType'],
    }),
    updateLeaveType: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leaves/types/${id}`, method: 'PUT', body }),
      invalidatesTags: ['LeaveType'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useApplyLeaveMutation,
  useGetMyLeavesQuery,
  useGetLeaveBalanceQuery,
  useCancelLeaveMutation,
  useGetAllLeavesQuery,
  useReviewLeaveMutation,
  useGetLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
} = leavesApi;
