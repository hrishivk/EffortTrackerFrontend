import axios from "axios";
import type { UserData } from "../types";
import { API_URL } from "../../config/apiEndpoints";
import { handleAuthError, handleResponse } from "./interceptors";

const apiservice = axios.create({
  baseURL: API_URL.spService,
  withCredentials: true,
});

apiservice.interceptors.response.use(handleResponse, handleAuthError);
export const spserviceMethood = {
 addDomain: (url: string, data: { [key: string]: string | number }) => {
  return apiservice.post(url, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
},
  listAllDomain:(url:string)=>{
    return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })
  },
  listAllProject:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  getTaskCount:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  getUserTaskCount:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  listUser:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  getOneuser:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  editUser:(url:string,data:UserData)=>{return apiservice.post(url,data,{
    headers: {
     "Content-Type": "application/json",
    },
  })},
  unBlock:(url:string,)=>{return apiservice.patch(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  Block:(url:string,)=>{return apiservice.patch(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  addProject:(url:string,data:{[key:string]:string|number})=>{return apiservice.post(url,data,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  deleteUser:(url:string)=>{return apiservice.delete(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  deleteDomain:(url:string)=>{return apiservice.delete(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  addUser:(url:string,data:any)=>{return apiservice.post(url,data,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  getProjectMembers:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  assignProjectMembers:(url:string,data:{project_id:string;user_ids:string[]})=>{return apiservice.post(url,data,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  removeProjectMembers:(url:string,data:{project_id:string;user_ids:string[]})=>{return apiservice.delete(url,{
    headers: {
      "Content-Type": "application/json",
    },
    data,
  })},
  updateProjectStatus:(url:string,data:{status:string})=>{return apiservice.patch(url,data,{
    headers: {
      "Content-Type": "application/json",
    },
  })},
  getProjectStats:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })}
};
