
import React from 'react'
import RxLoader from '../../presentation/Loader'
const Dashboard=React.lazy(()=>import('../../modules/dashboard/DashBoard'))
const TeamManagement=React.lazy(()=>import('../../modules/am/TeamManagement'))
const userMangement=React.lazy(()=>import('../../modules/sp/UserManagement'))
const TaskList=React.lazy(()=>import('../../modules/user/TaskList'))

const routes = [
  {
    path: '/Sp/dashboard',
    name: 'Super Admin Dashboard',
    element: Dashboard,
    role: 'SP',
  },
  {
    path: '/Sp/loader',
    name: 'Super Admin Dashboard',
    element: RxLoader,
    role: 'SP',
  },
  {
    path: '/Sp/userMangement',
    name: 'Super Admin Dashboard',
    element: userMangement,
    role: 'SP',
  },
  {
    path: '/Am/dashboard',
    name: 'Admin_Manager',
    element: Dashboard,
    role: 'AM',
  },
  {
    path: '/Am/TeamManagement',
    name: 'Admin_Manager',
    element: TeamManagement,
    role: 'AM',
  },
  {
    path: '/Am/TaskList',
    name: 'Admin_Manager',
    element: TaskList,
    role: 'AM',
  },
 {
  path: '/*/dashboard',
  name: 'User Dashboard',
  element: Dashboard,
  roles: ['USER', 'DEVLOPER'],
},
 {
  path: '/taskList/:id?',
  name: 'User Dashboard',
  element: TaskList,
  roles: ['USER', 'DEVLOPER','AM'],
}
]
export default routes