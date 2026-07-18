import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showToast(state, action) {
      const message = typeof action.payload === 'string' ? action.payload : action.payload.message;
      const type = typeof action.payload === 'string' ? 'ok' : action.payload.type || 'ok';
      state.toast = { message, type, id: Date.now() };
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;

export const selectToast = (state) => state.ui.toast;
