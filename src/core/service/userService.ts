import axios from "axios";
import type { taskList } from "../../modules/user/types";


const API_URL = "http://localhost:7001/user";

const apiservice = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});
export const userServiceMethood = {

  createTask: (url: string, data:taskList) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
listTask: (url: string, date: Date, id: number) => {
  return apiservice.get(url, {
    params: {
      date: date.toISOString(),
      id: id,
    },
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store", 
    },
  });
},

 taskLock: (url: string, date: Date) => {
  console.log("date", date);
  return apiservice.patch(url, {}, {
    params: { date: date.toISOString() },
    headers: { "Content-Type": "application/json" },
  });
}
,
 editTask: (url: string, newStatus: string) => {
    return apiservice.patch(url,{ status: newStatus },{
      headers: { "Content-Type": "application/json" },
    });
  },

};
