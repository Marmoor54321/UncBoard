import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../App.vue'), 
  },

  {
    path: '/:owner/:repo', 
    name: 'repo-board',
    component: () => import('../App.vue'),
    children: [
      {
        path: 'issue/:issueId',
        name: 'issue-details',
        props: true,
        component: () => import('@/components/IssueDetails.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router