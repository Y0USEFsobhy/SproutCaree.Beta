import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "nursery_user";

const loadUser = () => {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: loadUser(),
  isAuthenticated: Boolean(loadUser()),
  authInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(action.payload)
      );
    },

    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.authInitialized = true;

      if (action.payload) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(action.payload)
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authInitialized = true;

      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { login, setUser, logout } = authSlice.actions;
export default authSlice.reducer;