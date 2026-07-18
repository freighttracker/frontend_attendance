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

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsHydrated = (state) => state.auth.isHydrated;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsAuthenticated = (state) => Boolean(state.auth.token && state.auth.user);
