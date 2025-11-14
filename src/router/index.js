import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import Login from '../components/Login.vue'
import Checkin from '../components/Checkin.vue'
import Record from '../components/Record.vue'
import Profile from '../components/Profile.vue'
import Statistics from '../components/Statistics.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  // 所有需要左侧导航的页面都嵌套在Layout中
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      { path: 'checkin', component: Checkin },
      { path: 'record', component: Record },
      { path: 'profile', component: Profile },
      { path: 'statistics', component: Statistics },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 添加导航守卫：跳转前检查登录状态
router.beforeEach((to, from, next) => {
  // 判断目标页面是否需要登录
  if (to.meta.requiresAuth) {
    // 检查 localStorage 中是否有登录信息（比如 username）
    const isLogin = localStorage.getItem('username') !== null
    if (isLogin) {
      next() // 已登录，正常跳转
    } else {
      next('/login') // 未登录，强制跳登录页
    }
  } else {
    next() // 不需要登录的页面（如登录页），直接放行
  }
})

export default router
