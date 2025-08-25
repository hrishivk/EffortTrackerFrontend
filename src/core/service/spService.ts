import axios from "axios";
import type { UserData } from "../types";
const API_URL = "http://localhost:7001/auth-role-sp";
const apiservice = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
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
      "Content-Type": "multipart/form-data",
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
  deleteUser:(url:string)=>{return apiservice.get(url,{
    headers: {
      "Content-Type": "application/json",
    },
  })}
};
