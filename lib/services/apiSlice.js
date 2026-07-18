import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../features/authSlice';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshPromise = null;

async function reauthBaseQuery(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const state = api.getState();
    const refreshToken = state.auth.refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('attendance_refresh_token') : null);

    if (refreshToken) {
      if (!refreshPromise) {
        refreshPromise = rawBaseQuery(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          api,
          extraOptions
        ).finally(() => {
          refreshPromise = null;
        });
      }
      const refreshResult = await refreshPromise;
      const newToken = refreshResult.data?.data?.token;

      if (newToken) {
        api.dispatch(setCredentials({ user: state.auth.user, token: newToken }));
        if (typeof window !== 'undefined') localStorage.setItem('attendance_token', newToken);
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
        if (typeof window !== 'undefined') {
          localStorage.removeItem('attendance_token');
          localStorage.removeItem('attendance_refresh_token');
          localStorage.removeItem('attendance_user');
        }
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: reauthBaseQuery,
  tagTypes: [
    'User',
    'Attendance',
    'Correction',
    'Leave',
    'LeaveType',
    'Holiday',
    'Weekend',
    'Salary',
    'Setting',
    'AttendanceRule',
    'SandwichPolicy',
    'Notification',
    'Dashboard',
    'PayrollDashboard',
    'SalaryStructure',
    'Bonus',
    'Reimbursement',
    'Loan',
    'PayrollSettings',
    'SalaryField',
  ],
  endpoints: () => ({}),
});
