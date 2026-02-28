
import React from 'react'
const Dashboard=React.lazy(()=>import('../../modules/dashboard/components/DashBoard'))
const TeamManagement=React.lazy(()=>import('../../modules/am/components/TeamManagement'))
const userMangement=React.lazy(()=>import('../../modules/sp/components/UserManagement'))
const DomainProject=React.lazy(()=>import('../../modules/sp/components/DomainProject'))
const CreateProject=React.lazy(()=>import('../../modules/sp/components/CreateProject'))
const CreateUser=React.lazy(()=>import('../../modules/sp/components/CreateUser'))
const CreateDomain=React.lazy(()=>import('../../modules/sp/components/CreateDomain'))

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
    path: '/:role/domain-project',
    name: 'Domain & Projects',
    element: DomainProject,
    roles: ['SP', 'AM'],
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
    name: 'Create Domain',
    element: CreateDomain,
    roles: ['SP', 'AM'],
  },
  {
    path: '/user/dashboard',
    name: 'User Dashboard',
    element: Dashboard,
    roles: ['USER', 'DEVLOPER'],
  },
]
export default routes
