import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/Search.vue')
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('@/views/LibraryView.vue')
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/views/Favorites.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue')
  },
  {
    path: '/downloads',
    name: 'downloads',
    component: () => import('@/views/Downloads.vue')
  },
  {
    path: '/data-usage',
    name: 'data-usage',
    component: () => import('@/views/DataUsageView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired && !authStore.isAuthenticated()) {
    return next('/login')
  }

  // Si ya está logueado y va a /login, redirigido a home
  if (to.path === '/login' && authStore.isAuthenticated()) {
    return next('/')
  }

  next()
})

export default router

