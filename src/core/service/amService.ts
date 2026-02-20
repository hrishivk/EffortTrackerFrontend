import axios from "axios";
import { API_URL } from "../../config/apiEndpoints";
import { handleAuthError } from "./interceptors";

const apiservice = axios.create({
  baseURL: API_URL.amService,
  headers: {
    "Content-Type":"application/json"
  }, withCredentials: true,
});

apiservice.interceptors.response.use((res) => res, handleAuthError);

export const amServiceMethood = {
    listAllUsers:(url:string)=>{return apiservice.get(url)}
};
