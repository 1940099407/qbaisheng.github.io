import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8081/api', // 后端接口基础地址，后续替换为你的实际地址
  timeout: 5000, // 请求超时时间
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
})

// 请求拦截器：添加用户ID到请求头（身份验证用）
service.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      config.headers.userId = userId
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一处理结果
service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    alert('接口请求失败，请重试！')
    return Promise.reject(error)
  },
)

export default service
