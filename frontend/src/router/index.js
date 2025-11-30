import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { 
    path: '/', 
    name: 'board', 
    component: () => import('../App.vue'), 
    children: [
      {
        path: 'issue/:issueId',
        name: 'issue-details',
        props: true,
        component: () => import('@/components/IssueDetails.vue') 
      }
    ]
  },

  {
    path: '/dashboard',
    redirect: { name: 'board' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router