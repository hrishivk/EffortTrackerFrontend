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
  token: "",
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      state.isError = false;
      state.isLoading = false;
      state.isSuccess = false;
      state.message = "";
      state.user = emptyUser;
      state.token = "";
      state.isLocked = false;
    },
    setLocked: (state, action: { payload: boolean }) => {
      state.isLocked = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
         console.log(action.payload)
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
        const tokenData = action.payload.data.data.token;
        localStorage.setItem("accessToken", tokenData?.accessToken || "");
        localStorage.setItem("refreshToken", tokenData?.refreshToken || "");

        state.isSuccess = true;
        state.isLoading = false;
        state.user = loggedInUser;
        state.token = tokenData?.accessToken || "";
        state.isError = false;
        state.message = "";
      })
      .addCase(login.rejected, (state, action) => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        state.isSuccess = false;
        state.isLoading = false;
        state.isError = true;
        state.user = emptyUser;
        state.token = "";
        state.message = action.error?.message || "Login failed";
        state.isLocked = false;
      })

      .addCase(setTaskLock.fulfilled, (state,) => {
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
