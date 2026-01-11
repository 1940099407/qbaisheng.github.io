import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/user-layout.vue'
import AdminLayout from '../components/admin/admin-layout.vue'
import Login from '../components/user-login.vue'
// 用户组件
import Checkin from '../components/checkin-form.vue'
import Record from '../components/checkin-record.vue'
import Profile from '../components/user-profile.vue'
import Statistics from '../components/checkin-statistics.vue'
import ReminderSetting from '../components/reminder-setting.vue'
import ActivitiesView from '../components/ActivitiesView.vue'
import SocialAnalysisView from '../components/SocialAnalysisView.vue'

import Register from '../components/user-register.vue'
import HealthAssessment from '../components/HealthAssessment.vue'
// 管理员组件
import UserManagement from '../components/admin/user-management.vue'
import CheckinReview from '../components/admin/checkin-review.vue'
import ActivityPublish from '../components/admin/activity-publish.vue'
import TemplateManager from '../components/checkin-template-manager.vue'

// Element Plus 组件
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    component: Login,
    meta: { requiresAuth: false },
  },

  // 用户路由（需用户角色）
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true, role: 'user' },
    children: [
      { path: 'checkin', component: Checkin },
      { path: 'record', component: Record },
      { path: 'profile', component: Profile },
      { path: 'statistics', component: Statistics },
      { path: 'reminder', component: ReminderSetting },
      { path: 'activities', component: ActivitiesView },
      { path: 'social', component: SocialAnalysisView },
      {
        path: 'health-assessment',
        component: HealthAssessment,
        meta: { title: '健康测评与指导' },
      },
      {
        path: 'approval-application',
        component: () => import('../components/ApprovalApplication.vue'),
      },
    ],
  },
  // 新增注册路由
  {
    path: '/register',
    component: Register,
    meta: { requiresAuth: false },
  },
  // 管理员路由（需管理员角色）
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: 'user-management', component: UserManagement },
      { path: 'checkin-review', component: CheckinReview },
      { path: 'activity-publish', component: ActivityPublish },
      { path: 'template-manager', component: TemplateManager },
      {
        path: 'approval-management',
        component: () => import('../components/admin/ApprovalManagement.vue'),
      },
      {
        path: 'data-statistics',
        component: () => import('../components/admin/data-statistics.vue'),
      },
      { path: 'custom-forms', component: () => import('../components/admin/custom-forms.vue') },
      {
        path: 'system-settings',
        component: () => import('../components/admin/system-settings.vue'),
      },
    ],
  },

  // 404页面
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 导航守卫：修复重复提示问题，简化权限校验
router.beforeEach((to, from, next) => {
  // 从localStorage获取登录状态和角色
  const isLogin = localStorage.getItem('username') !== null
  const userRole = localStorage.getItem('userRole') || 'user'

  if (to.meta.requiresAuth) {
    // 需要登录的页面
    if (!isLogin) {
      // 未登录：跳登录页（仅提示一次）
      if (from.path !== '/login') {
        ElMessage.warning('请先登录')
      }
      next('/login')
    } else {
      // 已登录：仅校验角色，且避免循环提示
      if (to.meta.role && to.meta.role !== userRole) {
        // 角色不匹配：仅提示一次，且只在“目标页≠当前页”时跳转
        if (to.path !== from.path) {
          ElMessage.error('没有权限访问该页面')
          const homePath = userRole === 'admin' ? '/admin/user-management' : '/checkin'
          // 仅当跳转的首页不是当前页时才执行跳转
          if (homePath !== to.path) {
            next(homePath)
          } else {
            next(false) // 阻止重复跳转
          }
        } else {
          next(false)
        }
      } else {
        // 角色匹配：正常放行
        next()
      }
    }
  } else {
    // 不需要登录的页面（登录/注册页）
    if (isLogin && to.path === '/login' && from.path !== '/') {
      // 已登录用户访问登录页：跳对应首页（仅跳转一次）
      const homePath = userRole === 'admin' ? '/admin/user-management' : '/checkin'
      next(homePath)
    } else {
      // 未登录/访问注册页：正常放行
      next()
    }
  }
})

export default router
