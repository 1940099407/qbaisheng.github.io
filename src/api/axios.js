import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 核心：和Vite代理的/api对应
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
})

// 请求拦截器（自动加Token，可选）
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器（统一处理结果）
service.interceptors.response.use(
  (response) => response.data, // 直接返回后端JSON数据
  (error) => {
    if (error.response?.status === 401) {
      ElMessage.warning('请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      ElMessage.error(error.response?.data?.msg || '请求失败')
    }
    return Promise.reject(error)
  },
)

export default service
