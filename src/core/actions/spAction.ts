import { spserviceMethood } from "../service/spService";
import type { UserData } from "../types";

export const addDomain = async (data: { [key: string]: string | number }) => {
  try {
    const response = await spserviceMethood.addDomain("/addDomain", data);
    return response.data;
  } catch (error) {
    throw error
   }
};
export const fetchExistDomains=async()=>{
  try {
    const repsonse=await spserviceMethood.listAllDomain("/list-domain")
    return repsonse.data
  } catch (error) {
     console.log(error)
  }
}
export const fetchExistProjects=async()=>{
  try {
    const repsonse=await spserviceMethood.listAllProject("/list-projects")
    return repsonse.data
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
    const repsonse=await spserviceMethood.listUser("/list-User")
    return repsonse.data
  } catch (error) {
     throw error
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
    const response=await spserviceMethood.addProject("/addProject",data)
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