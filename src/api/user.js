// src/api/user.js
import service from './axios'

/**
 * 用户登录接口
 * @param {Object} params - 登录参数 {username, password, role}
 * @returns {Promise}
 */
export const login = (params) => {
  return service({
    url: '/user/login', // 后端登录接口路径，需与后端一致
    method: 'POST',
    data: params,
  })
}

/**
 * 重置密码接口（关键：必须显式导出，名称与导入侧一致）
 * @param {Object} params - 重置参数 {username, newPassword}
 * @returns {Promise}
 */
export const resetPassword = (params) => {
  return service({
    url: '/user/resetPassword', // 后端重置密码接口路径，需与后端一致
    method: 'POST',
    data: params,
  })
}

/**
 * 用户注册接口（可选，供注册页使用）
 * @param {Object} params - 注册参数 {username, password, role}
 * @returns {Promise}
 */
export const register = (params) => {
  return service({
    url: '/user/register',
    method: 'POST',
    data: params,
  })
}
