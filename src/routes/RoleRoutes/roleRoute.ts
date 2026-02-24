
import React from 'react'
const Dashboard=React.lazy(()=>import('../../modules/dashboard/DashBoard'))
const TeamManagement=React.lazy(()=>import('../../modules/am/TeamManagement'))
const userMangement=React.lazy(()=>import('../../modules/sp/UserManagement'))
const DomainProject=React.lazy(()=>import('../../modules/sp/DomainProject'))
const CreateProject=React.lazy(()=>import('../../modules/sp/CreateProject'))
const CreateUser=React.lazy(()=>import('../../modules/sp/CreateUser'))
const CreateDomain=React.lazy(()=>import('../../modules/sp/CreateDomain'))

const routes = [
  {
    path: '/sp/dashboard',
    name: 'Super Admin Dashboard',
    element: Dashboard,
    role: 'sp',
  },

  {
    path: '/sp/userMangement',
    name: 'Super Admin Dashboard',
    element: userMangement,
    role: 'sp',
  },
  {
    path: '/am/dashboard',
    name: 'Admin_Manager',
    element: Dashboard,
    role: 'am',
  },
  {
    path: '/am/TeamManagement',
    name: 'Admin_Manager',
    element: TeamManagement,
    role: 'am',
  },
  {
    path: '/:role/domain-project',
    name: 'Domain & Projects',
    element: DomainProject,
    roles: ['sp', 'am'],
  },
  {
    path: '/:role/create-project',
    name: 'Create Project',
    element: CreateProject,
    roles: ['sp', 'am'],
  },
  {
    path: '/:role/create-user',
    name: 'Create User',
    element: CreateUser,
    roles: ['sp', 'am'],
  },
  {
    path: '/:role/create-domain',
    name: 'Create Domain',
    element: CreateDomain,
    roles: ['sp', 'am'],
  },
 {
  path: '/user/dashboard',
  name: 'User Dashboard',
  element: Dashboard,
  roles: ['USER', 'DEVLOPER'],
},
]
export default routes
