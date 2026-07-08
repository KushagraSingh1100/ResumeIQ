import { createSlice  } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  username: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      if (action.payload.token !== undefined)
        state.token = action.payload.token;
      if (action.payload.username !== undefined)
        state.username = action.payload.username;
    },
    setAccessToken: (state, action) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
    },
  },
});
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const { setCredentials, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
