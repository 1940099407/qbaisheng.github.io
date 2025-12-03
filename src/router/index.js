import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/user-layout.vue'
import AdminLayout from '../components/admin-layout.vue'
import Login from '../components/user-login.vue'
// 用户组件
import Checkin from '../components/checkin-form.vue'
import Record from '../components/checkin-record.vue'
import Profile from '../components/user-profile.vue'
import Statistics from '../components/checkin-statistics.vue'
import ReminderSetting from '../components/reminder-setting.vue'
import ActivitiesView from '../components/ActivitiesView.vue' // 新增导入
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
      { path: 'reminder', component: ReminderSetting }, // 新增提醒设置路由
      { path: 'activities', component: ActivitiesView }, // 活动参加页面
      { path: 'social', component: SocialAnalysisView }, // 社交分享页面
      {
        path: 'health-assessment',
        component: HealthAssessment,
        meta: { title: '健康测评与指导' },
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
      { path: 'template-manager', component: TemplateManager }, // 模板管理路由
    ],
  },

  // 404页面
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 导航守卫：验证登录状态和角色权限
router.beforeEach((to, from, next) => {
  // 从localStorage获取登录状态和角色（与登录组件存储逻辑保持一致）
  const isLogin = localStorage.getItem('username') !== null
  const userRole = localStorage.getItem('userRole') || 'user' // 默认用户角色

  if (to.meta.requiresAuth) {
    // 需要登录的页面
    if (!isLogin) {
      // 未登录：跳转到登录页
      ElMessage.warning('请先登录')
      next('/login')
    } else if (to.meta.role && to.meta.role !== userRole) {
      // 角色不匹配（如用户访问管理员页面）
      ElMessage.error('没有权限访问该页面')
      // 跳转到对应角色的首页
      const homePath = userRole === 'admin' ? '/admin/user-management' : '/checkin'
      next(homePath)
    } else {
      // 验证通过
      next()
    }
  } else {
    // 不需要登录的页面（登录页）
    if (isLogin && to.path !== '/register') {
      // 允许已登录用户访问注册页
      const homePath = userRole === 'admin' ? '/admin/user-management' : '/checkin'
      next(homePath)
    } else {
      next()
    }
  }
})

export default router
