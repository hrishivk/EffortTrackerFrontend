import axios from "axios";
import { API_URL } from "../../config/apiEndpoints";


// const API_URL = "http://localhost:7001/auth-role-Am";

const apiservice = axios.create({
  baseURL: API_URL.amService,
  headers: {
    "Content-Type":"application/json"
  }, withCredentials: true,
});
export const amServiceMethood = {
    listAllUsers:(url:string)=>{return apiservice.get(url)}
};
