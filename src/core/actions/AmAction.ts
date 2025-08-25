import { amServiceMethood } from "../service/amService"

export const fetchAmUsers=async(id:string)=>{
  try {
    const repsonse=await amServiceMethood.listAllUsers(`/list-am-User?id=${id}`)
    return repsonse.data
  } catch (error) {
     console.log(error)
  }
}