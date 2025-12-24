import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  // 核心修改：写后端完整地址（含context-path），绝对路径
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// 保留原有拦截器（无需改）
service.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (!res.success) {
      ElMessage.error(res.msg || '登录失败')
      return Promise.reject(res)
    }
    return res
  },
  (error) => {
    ElMessage.error(error.message || '后端服务未启动')
    return Promise.reject(error)
  },
)

export default service
