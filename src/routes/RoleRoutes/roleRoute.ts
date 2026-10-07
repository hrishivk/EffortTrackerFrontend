
import React from 'react'
const Dashboard=React.lazy(()=>import('../../modules/dashboard/components/DashBoard'))
const TeamManagement=React.lazy(()=>import('../../modules/am/components/TeamManagement'))
const userMangement=React.lazy(()=>import('../../modules/sp/components/UserManagement'))
const DomainProject=React.lazy(()=>import('../../modules/sp/components/DomainProject'))
const CreateProject=React.lazy(()=>import('../../modules/sp/components/Create/CreateProject'))
const CreateUser=React.lazy(()=>import('../../modules/sp/components/Create/CreateUser'))
const CreateDomain=React.lazy(()=>import('../../modules/sp/components/Create/CreateDomain'))
const LeaveManagement=React.lazy(()=>import('../../modules/attendance/components/LeaveManagement'))
const Settings=React.lazy(()=>import('../../modules/settings/components/Settings'))
const TaskReports=React.lazy(()=>import('../../modules/settings/components/TaskReports'))
const WorkspaceFlow=React.lazy(()=>import('../../modules/workspace/components/WorkspaceFlow'))
const WorkspaceDetail=React.lazy(()=>import('../../modules/workspace/components/WorkspaceDetail'))
const WorkspaceList=React.lazy(()=>import('../../modules/workspace/components/WorkspaceList'))
const RoomDetail=React.lazy(()=>import('../../modules/workspace/components/RoomDetail'))
const RoomMemberTasks=React.lazy(()=>import('../../modules/workspace/components/RoomMemberTasks'))
const RxSpinnerPreview=React.lazy(()=>import('../../presentation/RxSpinnerPreview'))
const routes = [
  {
    path: '/sp/dashboard',
    name: 'Super Admin Dashboard',
    element: Dashboard,
    roles: ['SP'],
  },
  {
    path: '/sp/userMangement',
    name: 'User Management',
    element: userMangement,
    roles: ['SP'],
  },
  {
    path: '/am/dashboard',
    name: 'Admin Manager Dashboard',
    element: Dashboard,
    roles: ['AM'],
  },
  {
    path: '/am/TeamManagement',
    name: 'Team Management',
    element: TeamManagement,
    roles: ['AM'],
  },
  {
    path: '/:role/workspaces',
    name: 'Workspaces',
    element: WorkspaceList,
    roles: ['SP', 'AM'],
  },
  {
    path: '/:role/workspace-setup',
    name: 'Create Workspace',
    element: WorkspaceFlow,
    roles: ['SP', 'AM'],
  },
  {
    path: '/:role/workspace',
    name: 'Workspace',
    element: WorkspaceDetail,
    roles: ['SP', 'AM', 'USER', 'DEVLOPER'],
  },
  {
    path: '/:role/room',
    name: 'Room',
    element: RoomDetail,
    roles: ['SP', 'AM', 'USER', 'DEVLOPER'],
  },
  {
    path: '/:role/room-tasks',
    name: 'Room Member Tasks',
    element: RoomMemberTasks,
    roles: ['SP', 'AM', 'USER', 'DEVLOPER'],
  },
  {
    path: '/:role/rxspinner',
    name: 'RX Spinner',
    element: RxSpinnerPreview,
    roles: ['SP', 'AM', 'USER', 'DEVLOPER'],
  },
  {
    path: '/:role/domain-project',
    name: 'Department & Projects',
    element: DomainProject,
    roles: ['SP', 'AM', 'USER', 'DEVLOPER'],
  },
  {
    path: '/:role/create-project',
    name: 'Create Project',
    element: CreateProject,
    roles: ['SP', 'AM'],
  },
  {
    path: '/:role/create-user',
    name: 'Create User',
    element: CreateUser,
    roles: ['SP', 'AM'],
  },
  {
    path: '/:role/create-domain',
    name: 'Create Department',
    element: CreateDomain,
    roles: ['SP', 'AM'],
  },
  {
    path: '/user/dashboard',
    name: 'User Dashboard',
    element: Dashboard,
    roles: ['USER', 'DEVLOPER'],
  },
  {
    path: '/:role/settings/task-reports',
    name: 'Task Reports',
    element: TaskReports,
    roles: ['SP', 'AM'],
  },
  {
    path: '/:role/settings',
    name: 'Settings',
    element: Settings,
    roles: ['SP', 'AM'],
  },
  {
    path: '/:role/attendance',
    name: 'Attendance',
    element: LeaveManagement,
    roles: ['SP', 'AM', 'USER', 'DEVLOPER'],
  },
]
export default routes
