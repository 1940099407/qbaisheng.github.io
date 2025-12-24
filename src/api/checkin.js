// src/api/checkin.js
import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - { username, password }
 */
export function login(data) {
  return request({
    url: '/api/user/login', // 后端登录接口路径（带/api前缀）
    method: 'POST',
    data,
  })
}

/**
 * 用户注册
 * @param {Object} data - { username, password }
 */
export function register(data) {
  return request({
    url: '/api/user/register',
    method: 'POST',
    data,
  })
}

/**
 * 提交打卡
 * @param {Object} data - { userId, latitude, longitude }
 */
export function submitCheckin(data) {
  return request({
    url: '/api/checkin/create',
    method: 'POST',
    data,
  })
}

/**
 * 获取今日打卡状态
 * @param {Number} userId - 用户ID
 */
export function getTodayStatus(userId) {
  return request({
    url: '/api/checkin/todayStatus',
    method: 'GET',
    params: { userId }, // GET请求参数
  })
}

/**
 * 获取连续打卡天数
 * @param {Number} userId - 用户ID
 */
export function getContinuousDays(userId) {
  return request({
    url: '/api/checkin/continuous',
    method: 'GET',
    params: { userId },
  })
}
