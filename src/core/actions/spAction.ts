import { spserviceMethood } from "../services/spService";
import { amServiceMethood } from "../services/amService";
import { userServiceMethood } from "../services/userService";
import { store } from "../../store/configureStore";
import type {
  EditProjectPayload,
  EditUserPayload,
  ProjectDetail,
  UserData,
} from "../types";

const isAmRole = () =>
  store.getState()?.user?.user?.role?.toUpperCase() === "AM";

export const addDomain = async (data: { [key: string]: string | number | string[] | undefined }) => {
  try {
    const response = isAmRole()
      ? await amServiceMethood.addDomain("/domain", data)
      : await spserviceMethood.addDomain("/domain", data);
    return response.data;
  } catch (error) {
    throw error
   }
};
export const deleteDomain = async (id: string) => {
  try {
    const response = isAmRole()
      ? await amServiceMethood.deleteDomain(`/domain?id=${id}`)
      : await spserviceMethood.deleteDomain(`/domain?id=${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Departments.
 *
 * `pagination` is for the list page, which draws ten at a time and has a pager
 * to feed. The callers that fill a dropdown pass nothing and keep getting the
 * whole set, because a picker missing half its options is worse than a long
 * one.
 */
export const fetchExistDomains=async(
  isShared?: boolean,
  pagination?: { page?: number; limit?: number }
)=>{
  try {
    const url = isShared ? "/list-domains?isShared=true" : "/list-domains"
    const repsonse = isAmRole()
      ? await amServiceMethood.listAllDomain(url, pagination)
      : await spserviceMethood.listAllDomain(url, pagination)
    return repsonse.data
  } catch (error) {
     console.log(error)
  }
}
export const fetchExistProjects=async()=>{
  try {
    const repsonse=await spserviceMethood.listAllProject("/project-domain")
    console.log('response',repsonse.data)
    return repsonse.data; 
  } catch (error) {
     throw error
  }
}
export const fetchAllExistProjects=async(search?:string, pagination?: { page?: number; limit?: number })=>{
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const repsonse=await userServiceMethood.listProjects(`/list-projects${query}`, pagination)
    return repsonse.data;
  } catch (error) {
     throw error
  }
}

export const fetchUser=async()=>{
  try {
    const response= await spserviceMethood.getOneuser(`/user`)
    return response.data
  } catch (error) {
   throw error
  }
}

export const fetchUserDetails=async(id:string)=>{
  try {
    const response = await spserviceMethood.getUserDetails(
      `/user-details?id=${encodeURIComponent(id)}`
    )
    return response.data.data as import("../../shared/types/User").UserDetails
  } catch (error) {
    throw error
  }
}
export const fetchAllUsers=async()=>{
  try {
    const repsonse=await spserviceMethood.listUser("/list-users")
    return { data: repsonse.data.data.users }
  } catch (error) {
     throw error
  }
}

export interface FetchUsersParams {
  search?: string;
  role?: string;
  project_id?: string;
  isBlocked?: string;
  page?: number;
  limit?: number;
}

export const fetchUsers = async (params: FetchUsersParams = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.role) query.set("role", params.role);
    if (params.project_id) query.set("project_id", params.project_id);
    if (params.isBlocked) query.set("isBlocked", params.isBlocked);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    const url = `/list-users${qs ? `?${qs}` : ""}`;
    const response = await spserviceMethood.listUser(url);
    return response.data.data as {
      users: import("../../shared/types/User").formUserData[];
      totalRecords: number;
      totalPages: number;
      currentPage: number;
    };
  } catch (error) {
    throw error;
  }
}
export const fetfchTaskCount=async(data:string,role:string,id:number)=>{
  try{
    const repsonse=await spserviceMethood.getTaskCount(`/task-count?role=${role}&date=${data}&id=${id}`)
    return repsonse.data
  }catch(error){
    throw error
  }
}

export const addProject=async(data:{[key:string]:string|number})=>{
  try {
    const response=await spserviceMethood.addProject("/project",data)
    return response.data
  } catch (error) {
   throw error
    
  }
}

/**
 * One project, whole, by id.
 *
 * What the edit form opens on. Before this it was built out of whatever row the
 * list happened to be holding, which stopped working the moment that list was
 * paged: a project on page two was not in memory to edit. The response also
 * carries `members`, which is what retires the old way of answering "who is on
 * this project" — fetch every user and filter on their `projects[]`.
 *
 * `404` covers both an unknown id and one this caller has no claim on: a `403`
 * would confirm the project exists, and no screen acts on the difference.
 */
export const fetchProject=async(projectId:string|number)=>{
  const url = `/project?id=${encodeURIComponent(String(projectId))}`
  const response = isAmRole()
    ? await amServiceMethood.getProject(url)
    : await spserviceMethood.getProject(url)
  return response.data?.data as ProjectDetail
}

export const updateProject=async(projectId:string|number,data:EditProjectPayload)=>{
  try {
    const response=await spserviceMethood.updateProject(`/project?id=${encodeURIComponent(String(projectId))}`,data)
    return response.data
  } catch (error) {
    throw error
  }
}
export const edituser=async(data:UserData|EditUserPayload)=>{
  try {
    const response=await spserviceMethood.editUser("/edit-user",data)
    return response.data
  } catch (error) {
    throw error
    
  }
}
export const Deletetuser=async(id:string)=>{
  try {
    const response=await spserviceMethood.deleteUser(`/delete-user?id=${id}`,)
    return response.data
  } catch (error) {
    throw error
    
  }
}
export const UnblockUser=async(id:string)=>{
  try {
    console.log("unblock")
    const response=await spserviceMethood.unBlock(`/unBlock-user?id=${id}`,)
    return response.data
  } catch (error) {
    throw error
    
  }
}
export const BlockUser=async(id:string)=>{
  try {
       console.log("block")
    const response=await spserviceMethood.Block(`/block-user?id=${id}`,)
    return response.data
  } catch (error) {
    throw error

  }
}
export const fetchProjectMembers=async(projectId:string)=>{
  try {
    const response=await spserviceMethood.getProjectMembers(`/project-members?project_id=${projectId}`)
    return response.data
  } catch (error) {
    throw error
  }
}
export const assignProjectMembers=async(projectId:string,userIds:string[])=>{
  try {
    const response=await spserviceMethood.assignProjectMembers("/project-members",{project_id:projectId,user_ids:userIds})
    return response.data
  } catch (error) {
    throw error
  }
}
export const removeProjectMembers=async(projectId:string,userIds:string[])=>{
  try {
    const response=await spserviceMethood.removeProjectMembers("/project-members",{project_id:projectId,user_ids:userIds})
    return response.data
  } catch (error) {
    throw error
  }
}
export const updateProjectStatus=async(projectId:string,status:string)=>{
  try {
    const response=await spserviceMethood.updateProjectStatus(`/project-status?id=${projectId}`,{status})
    return response.data
  } catch (error) {
    throw error
  }
}
export const fetchProjectStats=async()=>{
  try {
    const response=await spserviceMethood.getProjectStats("/project-stats")
    return response.data
  } catch (error) {
    throw error
  }
}