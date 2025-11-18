<template>
  <div class="login-container">
    <div class="login-card">
      <h2>打卡系统</h2>
      <div class="form-item">
        <label>用户名</label>
        <input type="text" v-model="username" placeholder="请输入用户名" />
      </div>
      <div class="form-item">
        <label>密码</label>
        <input type="password" v-model="password" placeholder="请输入密码" />
      </div>
      <button @click="login" class="login-btn">登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const username = ref('')
const password = ref('')

// 检查localStorage是否可用（解决之前的getItem异常问题）
const isLocalStorageAvailable = () => {
  try {
    const testKey = 'test_local_storage'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

const login = () => {
  // 1. 基础校验
  if (!username.value || !password.value) {
    ElMessage.warning('用户名和密码不能为空')
    return
  }

  // 2. 检查localStorage是否可用
  if (!isLocalStorageAvailable()) {
    ElMessage.error('浏览器存储功能不可用，请关闭隐私模式或更换浏览器')
    return
  }

  // 3. 清除旧的登录信息（避免残留数据干扰）
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('username')
  localStorage.removeItem('userRole')

  // 4. 角色判断逻辑
  let userRole = 'user' // 默认用户
  let isSuccess = false

  // 管理员账号验证（仅示例，实际需后端接口校验）
  if (username.value === 'admin' && password.value === 'admin123') {
    userRole = 'admin'
    isSuccess = true
  } else {
    // 普通用户验证（示例：假设非管理员账号均有效）
    isSuccess = true
  }

  // 5. 登录成功处理
  if (isSuccess) {
    // 存储登录状态和角色（关键：确保存储成功）
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', username.value)
    localStorage.setItem('userRole', userRole)

    // 验证存储结果（防止存储失败导致后续权限问题）
    const storedRole = localStorage.getItem('userRole')
    if (!storedRole) {
      ElMessage.error('登录信息存储失败，请重试')
      return
    }

    // 6. 跳转首页（使用replace避免路由历史残留，减少守卫重复触发）
    const homePath = userRole === 'admin' ? '/admin/user-management' : '/checkin'
    router.replace(homePath) // 用replace代替push，避免后退回到登录页
    ElMessage.success(`${userRole === 'admin' ? '管理员' : '用户'}登录成功`)
  } else {
    ElMessage.error('用户名或密码错误')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f7fa;
}

.login-card {
  width: 350px;
  padding: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.form-item input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.login-btn:hover {
  background: #66b1ff;
}
</style>
