import { createSlice } from "@reduxjs/toolkit";
import { login, setTaskLock } from "../core/actions/action";
import type { AuthState, UserInfo } from "./types";


const emptyUser: UserInfo = {
  role: "",
  email: "",
  fullName: "",
  image: "",
};

const initialState: AuthState = {
  user: emptyUser,
  isError: false,
  isLocked: false,
  isLoading: false,
  isSuccess: false,
  message: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isError = false;
      state.isLoading = false;
      state.isSuccess = false;
      state.message = "";
      state.user = emptyUser;
      state.isLocked = false;
    },
    setLocked: (state, action: { payload: boolean }) => {
      state.isLocked = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        const loggedInUser = action.payload.data.data.user;
        const today = new Date().toISOString().split("T")[0];
        const lockedUserId = localStorage.getItem("lockedUserId");
        const lockedDate = localStorage.getItem("lockedDate");

        if (
          lockedUserId === loggedInUser.id.toString() &&
          lockedDate === today
        ) {
          state.isLocked = true;
        } else {
          state.isLocked = false;
          localStorage.removeItem("isLocked");
          localStorage.removeItem("lockedUserId");
          localStorage.removeItem("lockedDate");
        }
        state.isSuccess = true;
        state.isLoading = false;
        state.user = loggedInUser;
        state.isError = false;
        state.message = "";
      })
      .addCase(login.rejected, (state, action) => {
        state.isSuccess = false;
        state.isLoading = false;
        state.isError = true;
        state.user = emptyUser;
        state.message = action.error?.message || "Login failed";
        state.isLocked = false;
      })

      .addCase(setTaskLock.fulfilled, (state, action) => {
        state.isLocked = true;
        if (state.user && state.user.id) {
          localStorage.setItem("isLocked", "true");
          localStorage.setItem("lockedUserId", state.user.id.toString());
          localStorage.setItem(
            "lockedDate",
            new Date().toISOString().split("T")[0]
          );
        }
      });
  },
});

export const { reset, setLocked } = authSlice.actions;
export default authSlice.reducer;
