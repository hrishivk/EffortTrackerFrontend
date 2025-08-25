import  React,{useState} from "react"
import { useCallback, useEffect } from "react"
import { fetchAllUsers } from "../../../core/actions/spAction"
import type { formUserData } from "../../../shared/Table/types"
import type { AccountManagerViewProps } from "../views/types"

const TeamMangerOverView: React.FC <AccountManagerViewProps>= ({Dates}) => {
  const [data,setData]=useState<formUserData[]>([])
  console.log(data)
  const listData=useCallback(async()=>{
    try {
    const response=await fetchAllUsers()
    const AmUser=[]
    for(const user of response.data){
      if(user.role === "AM") AmUser.push(user)
    }
  setData(AmUser)
    } catch (error) {
      console.error("Error fetching team data:", error)
    }

  },[])
  useEffect(()=>{
    listData()
  }, [listData,Dates])


  // const getStatusBadge = (start: number, inprogress: number, complete: number) => {
  //   if (start === 0 && inprogress === 0) {
  //     return (
  //       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  //         All Complete
  //       </span>
  //     )
  //   } else if (start > inprogress) {
  //     return (
  //       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  //         Behind Schedule
  //       </span>
  //     )
  //   } else if (inprogress > 0) {
  //     return (
  //       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  //         In Progress
  //       </span>
  //     )
  //   }
  //   return (
  //     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
  //       Pending
  //     </span>
  //   )
  // }

  // const getCompletionPercentage = (complete: number, total: number) => {
  //   return Math.round((complete / total) * 100)
  // }

  // const ProgressBar = ({ value }: { value: number }) => (
  //   <div className="flex items-center space-x-2">
  //     <div className="flex-1 bg-gray-200 rounded-full h-2">
  //       <div
  //         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
  //         style={{ width: `${Math.min(value, 100)}%` }}
  //       />
  //     </div>
  //     <span className="text-sm font-medium text-gray-600 min-w-[40px]">{value}%</span>
  //   </div>
  // )

  const UserAvatar = ({ user, avatar }: { user: string ;avatar: string|undefined }) => {
    return (
      <div className="flex items-center space-x-3">
        <div className="relative h-8 w-8">
          <img
            src={avatar || "/placeholder.svg"}
            alt={user}
            className="h-8 w-8 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div
            className="absolute inset-0 bg-blue-100 text-blue-600 text-sm font-medium rounded-full items-center justify-center hidden"
          >
            
          </div>
        </div>
        <span className="font-medium text-gray-900">{user}</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="!text-3xl font-bold text-gray-900">Team mangers Overview</h1>
          <p className="text-gray-600 mt-1">Track managers progress and task distribution</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
          {data.length} Team Members
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden">
       
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="font-semibold text-gray-700 py-4 px-6 text-left">User</th>
                <th className="font-semibold text-gray-700 py-4 px-4 text-left">Assigned Projects</th>
                <th className="font-semibold text-gray-700 py-4 px-4 text-center">Yet to Start</th>
                <th className="font-semibold text-gray-700 py-4 px-4 text-center">In Progress</th>
                <th className="font-semibold text-gray-700 py-4 px-4 text-center">Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.map((member, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                  <td className="py-4 px-6">
                    <UserAvatar user={member.fullName} avatar={member.image} />
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                      {member.Project.name}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm font-medium min-w-[24px]">
                        {/* {member.start} */}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium min-w-[24px]">
                       
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium min-w-[24px]">
                  
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {/* <ProgressBar value={getCompletionPercentage(member.complete, member.total)} /> */}
                  </td>
                
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>   
    </div>
  )
}

export default TeamMangerOverView


