import { amServiceMethood } from "../services/amService"

export const fetchAmUsers=async()=>{
  try {
    const repsonse=await amServiceMethood.listAllUsers("/list-am-User")
    return repsonse.data
  } catch (error) {
     console.log(error)
  }
}