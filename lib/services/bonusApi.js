import { apiSlice } from './apiSlice';
import { cleanParams } from '../utils/queryParams';

export const bonusApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBonuses: builder.query({
      query: (params) => ({ url: '/bonuses', params: cleanParams(params) }),
      transformResponse: (response) => response.data,
      providesTags: ['Bonus'],
    }),
    createBonus: builder.mutation({
      query: (body) => ({ url: '/bonuses', method: 'POST', body }),
      invalidatesTags: ['Bonus', 'PayrollDashboard'],
    }),
    updateBonus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/bonuses/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Bonus', 'PayrollDashboard'],
    }),
    approveBonus: builder.mutation({
      query: (id) => ({ url: `/bonuses/${id}/approve`, method: 'PUT' }),
      invalidatesTags: ['Bonus', 'PayrollDashboard'],
    }),
    deleteBonus: builder.mutation({
      query: (id) => ({ url: `/bonuses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Bonus', 'PayrollDashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBonusesQuery,
  useCreateBonusMutation,
  useUpdateBonusMutation,
  useApproveBonusMutation,
  useDeleteBonusMutation,
} = bonusApi;
