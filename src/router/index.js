import { createRouter, createWebHistory } from 'vue-router'
// 导入页面组件
import Layout from '../components/main-layout.vue'
import Login from '../components/user-login.vue'
import Checkin from '../components/checkin-form.vue'
import Record from '../components/checkin-record.vue'
import Profile from '../components/user-profile.vue'
import Statistics from '../components/checkin-statistics.vue'
import Activities from '../components/ActivitiesView.vue' // 活动参加页面
import Social from '../components/SocialAnalysisView.vue' // 社交分析页面
// import NotFound from '../components/not-found.vue' // 404页面

// 登录状态验证函数
const isAuthenticated = () => {
  // 实际项目中可扩展为token验证
  return !!localStorage.getItem('username')
}

const routes = [
  // 根路径重定向到登录页
  { path: '/', redirect: '/login' },

  // 登录页
  {
    path: '/login',
    component: Login,
    name: 'Login',
    meta: {
      title: '登录 - 打卡系统',
      requiresAuth: false, // 登录页不需要验证
    },
  },

  // 主布局（包含左侧导航）
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true }, // 所有子页面需要登录
    children: [
      // 打卡页面
      {
        path: 'checkin',
        component: Checkin,
        name: 'Checkin',
        meta: { title: '今日打卡 - 打卡系统' },
      },

      // 打卡记录页面
      {
        path: 'record',
        component: Record,
        name: 'Record',
        meta: { title: '打卡记录 - 打卡系统' },
      },

      // 个人资料页面
      {
        path: 'profile',
        component: Profile,
        name: 'Profile',
        meta: { title: '个人资料 - 打卡系统' },
      },

      // 数据统计页面
      {
        path: 'statistics',
        component: Statistics,
        name: 'Statistics',
        meta: { title: '数据统计 - 打卡系统' },
      },

      // 活动参加页面（新增）
      {
        path: 'activities',
        component: Activities,
        name: 'Activities',
        meta: { title: '活动参加 - 打卡系统' },
      },

      // 社交分析页面（新增）
      {
        path: 'social',
        component: Social,
        name: 'Social',
        meta: { title: '社交分析 - 打卡系统' },
      },
    ],
  },

  //   // 404页面（匹配所有未定义路由）
  //   {
  //     path: '/:pathMatch(.*)*',
  //     name: 'NotFound',
  //     component: NotFound,
  //     meta: { title: '页面不存在 - 打卡系统' },
  //   },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  // 可选：添加滚动行为，页面跳转时自动滚动到顶部
  scrollBehavior() {
    return { top: 0 }
  },
})

// 导航守卫：处理登录验证和页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  } else {
    document.title = '打卡系统' // 默认标题
  }

  // 验证登录状态
  if (to.meta.requiresAuth) {
    if (isAuthenticated()) {
      next() // 已登录，允许访问
    } else {
      // 未登录，跳转到登录页并记录目标路径
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  } else {
    // 不需要登录的页面（如登录页）
    if (to.path === '/login' && isAuthenticated()) {
      // 已登录用户访问登录页时，自动跳转到首页
      next('/checkin')
    } else {
      next() // 正常访问
    }
  }
})

export default router
