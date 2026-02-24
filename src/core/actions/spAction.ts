import { spserviceMethood } from "../service/spService";
import { userServiceMethood } from "../service/userService";
import type { UserData } from "../types";

export const addDomain = async (data: { [key: string]: string | number }) => {
  try {
    const response = await spserviceMethood.addDomain("/domain", data);
    return response.data;
  } catch (error) {
    throw error
   }
};
export const deleteDomain = async (id: string) => {
  try {
    const response = await spserviceMethood.deleteDomain(`/domain?id=${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const fetchExistDomains=async()=>{
  try {
    const repsonse=await spserviceMethood.listAllDomain("/list-domains")
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
export const fetchAllExistProjects=async(search?:string)=>{
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const repsonse=await userServiceMethood.listProjects(`/list-projects${query}`)
    return repsonse.data;
  } catch (error) {
     throw error
  }
}

export const fetchUser=async(id:string)=>{
  try {
    const response= await spserviceMethood.getOneuser(`/user?id=${id}`)
    return response.data
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
      users: import("../../shared/User/types").formUserData[];
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
export const edituser=async(data:UserData)=>{
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