import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiserviceMethood } from "../service/apiService";
import { userServiceMethood } from "../service/userService";
import type { UserData } from "../types";
import type { taskList } from "../../modules/user/types";

export const login = createAsyncThunk(
  "auth/login",
  async (data: any, { rejectWithValue }) => {
    try {
      const respnse = await apiserviceMethood.login("/login", data);
      return respnse;
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const adduser = async (data: UserData) => {
  try {
    const response = await apiserviceMethood.createUser("/addUser", data);
    return response.data;
  } catch (error) {
     throw error
  }
};

export const authLogout = async (id:string) => {
  try {
    const response = await apiserviceMethood.logout(`/logout?id=${id}`);
    return response.data;
  } catch (error) {
   throw error;
  }
};

export const addTask=async(data:taskList)=>{
  try {
    const response= await userServiceMethood.createTask("/task",data)
    return response.data
  } catch (error) {
    throw error
  }
}
export const fetchTask = async (date: Date, id: string) => {
  try {
    const response = await userServiceMethood.listTask('/task-list', date, id);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const setTaskLock = createAsyncThunk(
  "task/setLock",
  async ({ date, id }: { date: Date; id: string }, {rejectWithValue}) => {
    try {
      console.log("Locking with date:", date);
      const response = await userServiceMethood.taskLock(`/task-lock?id=${id}`, date);
      return response.data;
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateTaskStatus=async(taskId:string, newStatus:string)=>{
  try {
    const response= await userServiceMethood.editTask(`/updateTask?id=${taskId}`,newStatus,)
    return response.data
  } catch (error) {
    throw error
  }
}

