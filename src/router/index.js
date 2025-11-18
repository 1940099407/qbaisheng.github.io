import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/main-layout.vue' // 用户布局
import AdminLayout from '../components/admin-layout.vue' // 管理员布局
import Login from '../components/user-login.vue'
// 用户组件
import Checkin from '../components/checkin-form.vue'
import Record from '../components/checkin-record.vue'
import Profile from '../components/user-profile.vue'
import Statistics from '../components/checkin-statistics.vue'
// 管理员组件
import UserManagement from '../components/admin/user-management.vue'
import CheckinReview from '../components/admin/checkin-review.vue'
import ActivityPublish from '../components/admin/activity-publish.vue'
import { ElMessage } from 'element-plus'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { requiresAuth: false } },

  // 用户路由（仅用户可访问）
  {
    path: '/user',
    component: Layout,
    meta: { requiresAuth: true, role: 'user' },
    children: [
      { path: 'checkin', component: Checkin }, // 路径：/user/checkin
      { path: 'record', component: Record }, // 路径：/user/record
      { path: 'profile', component: Profile }, // 路径：/user/profile
      { path: 'statistics', component: Statistics }, // 路径：/user/statistics
    ],
  },

  // 管理员路由（仅管理员可访问）
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: 'user-management', component: UserManagement }, // 路径：/admin/user-management
      { path: 'checkin-review', component: CheckinReview },
      { path: 'activity-publish', component: ActivityPublish },
    ],
  },

  // 404页面
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 防无限循环计数器（关键修复）
let redirectCount = 0

router.beforeEach((to, from, next) => {
  // 重置计数器：如果是从登录页跳转或首次加载，重置计数
  if (from.path === '/login' || from.path === '') {
    redirectCount = 0
  }

  // 紧急防死循环：连续跳转超过3次则终止，避免页面卡死
  if (redirectCount >= 3) {
    console.error('检测到可能的无限跳转，已终止')
    ElMessage.error('页面加载异常，请刷新重试')
    redirectCount = 0 // 重置计数器
    next(false) // 阻止继续跳转
    return
  }

  const isLogin = !!localStorage.getItem('username')
  const userRole = localStorage.getItem('userRole') || ''

  console.log('-------------------')
  console.log('访问路径:', to.path)
  console.log('需要角色:', to.meta.role)
  console.log('当前角色:', userRole)
  console.log('跳转次数:', redirectCount)

  // 1. 处理登录页
  if (to.path === '/login') {
    if (isLogin) {
      // 已登录用户访问登录页：跳对应角色首页
      const homePath = userRole === 'admin' ? '/admin/user-management' : '/user/checkin'
      redirectCount++ // 计数+1
      next(homePath)
    } else {
      next() // 未登录，正常显示登录页
    }
    return
  }

  // 2. 未登录用户访问需授权页面：跳登录页
  if (!isLogin) {
    next('/login')
    return
  }

  // 3. 角色为空（异常情况）：强制重新登录
  if (!userRole) {
    ElMessage.error('登录信息异常，请重新登录')
    localStorage.clear() // 清除异常登录信息
    next('/login')
    return
  }

  // 4. 角色匹配：允许访问
  if (to.meta.role === userRole) {
    redirectCount = 0 // 重置计数器（正常访问）
    next()
  } else {
    // 角色不匹配：跳转到对应角色的首页
    const homePath = userRole === 'admin' ? '/admin/user-management' : '/user/checkin'
    // 避免跳转到当前已在的首页（防止循环）
    if (to.path !== homePath) {
      redirectCount++ // 计数+1
      ElMessage.error('没有权限访问该页面')
      next(homePath)
    } else {
      // 已经在首页，不再跳转
      redirectCount = 0
      next(false)
    }
  }
})

export default router
