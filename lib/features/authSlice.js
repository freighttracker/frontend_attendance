import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isHydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token, refreshToken } = action.payload;
      state.user = user ?? state.user;
      state.token = token ?? state.token;
      if (refreshToken !== undefined) state.refreshToken = refreshToken;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    setHydrated(state) {
      state.isHydrated = true;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    },
  },
});

export const { setCredentials, setUser, setHydrated, logout } = authSlice.actions;
export default authSlice.reducer;

const ADMIN_TIER_ROLES = ['superadmin', 'admin', 'company_admin', 'subcompany_admin'];

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsHydrated = (state) => state.auth.isHydrated;
// admin/company_admin/subcompany_admin all reach the admin panel - the
// backend scopes what data they actually see/can touch to their own
// company. Only 'superadmin' is unscoped platform-wide (it manages
// companies themselves, not any one company's data), so it's the only role
// that should ever see a cross-company picker in the UI.
export const selectIsAdmin = (state) => ADMIN_TIER_ROLES.includes(state.auth.user?.role);
export const selectIsSuperAdmin = (state) => state.auth.user?.role === 'superadmin';
export const selectIsAuthenticated = (state) => Boolean(state.auth.token && state.auth.user);
