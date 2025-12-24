<template>
  <div class="login-container">
    <div class="login-card">
      <h2>打卡系统</h2>
      <div class="form-item">
        <label>用户名</label>
        <input
          type="text"
          v-model="username"
          placeholder="请输入用户名"
          @keyup.enter="handleLogin"
        />
      </div>
      <div class="form-item">
        <label>密码</label>
        <input
          type="password"
          v-model="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </div>
      <div class="form-item">
        <label>角色</label>
        <select v-model="selectedRole" class="role-select">
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
      </div>
      <button @click="handleLogin" class="login-btn">登录</button>
      <div class="register-link">还没有账号？<a href="/register">立即注册</a></div>
      <div class="forgot-password">
        <a href="#" @click.prevent="showForgotModal = true">忘记密码？</a>
      </div>

      <!-- 忘记密码弹窗 -->
      <div class="custom-modal" v-if="showForgotModal">
        <div class="modal-overlay" @click="showForgotModal = false"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>找回密码</h3>
            <button class="close-btn" @click="showForgotModal = false">&times;</button>
          </div>
          <form class="forgot-form" @submit.prevent="handleResetPassword">
            <div class="form-item">
              <label>用户名</label>
              <input
                type="text"
                v-model="forgotData.username"
                placeholder="请输入注册的用户名"
                required
              />
            </div>
            <div class="form-item">
              <label>新密码</label>
              <input
                type="password"
                v-model="forgotData.newPassword"
                placeholder="请输入新密码（至少6位）"
                required
                minlength="6"
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click="showForgotModal = false">
                取消
              </button>
              <button type="submit" class="confirm-btn">重置密码</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// 核心修复：导入名称与user.js导出完全一致，别名避免冲突
import { login as apiLogin, resetPassword as apiResetPassword } from '@/api/user'

const router = useRouter()
const username = ref('')
const password = ref('')
const selectedRole = ref('user')

// 忘记密码相关
const showForgotModal = ref(false)
const forgotData = ref({ username: '', newPassword: '' })

// 检查localStorage是否可用（修复ESLint no-unused-vars报错）
const isLocalStorageAvailable = () => {
  try {
    const testKey = 'test_local_storage'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    // 省略未使用的catch变量，解决ESLint报错
    return false
  }
}

// 登录逻辑（对接后端接口）
const handleLogin = async () => {
  // 基础校验
  if (!username.value.trim() || !password.value.trim()) {
    ElMessage.warning('用户名和密码不能为空')
    return
  }

  // 检查localStorage可用性
  if (!isLocalStorageAvailable()) {
    ElMessage.error('浏览器存储功能不可用，请关闭隐私模式或更换浏览器')
    return
  }

  try {
    // 调用后端登录接口
    const res = await apiLogin({
      username: username.value.trim(),
      password: password.value.trim(),
      role: selectedRole.value,
    })

    // 存储后端返回的Token和用户信息
    localStorage.setItem('token', res.token)
    localStorage.setItem('username', res.username)
    localStorage.setItem('userRole', res.role)

    // 二次验证存储结果
    if (localStorage.getItem('userRole') !== res.role) {
      ElMessage.error('登录信息存储失败，请重试')
      return
    }

    // 跳转对应页面
    const homePath = res.role === 'admin' ? '/admin/user-management' : '/checkin'
    router.replace(homePath)
    ElMessage.success(`${res.role === 'admin' ? '管理员' : '用户'}登录成功`)
  } catch (error) {
    ElMessage.error(error.msg || '登录失败，请检查账号密码')
    console.error('登录接口异常：', error)
  }
}

// 重置密码逻辑（对接后端接口）
const handleResetPassword = async () => {
  // 前端校验
  if (!forgotData.value.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (forgotData.value.newPassword.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return
  }

  try {
    // 调用后端重置密码接口
    await apiResetPassword({
      username: forgotData.value.username.trim(),
      newPassword: forgotData.value.newPassword,
    })

    ElMessage.success('密码重置成功，请使用新密码登录')
    showForgotModal.value = false
    forgotData.value = { username: '', newPassword: '' }
  } catch (error) {
    ElMessage.error(error.msg || '密码重置失败，用户名不存在')
    console.error('重置密码接口异常：', error)
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

.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 22px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.form-item input,
.role-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-item input:focus,
.role-select:focus {
  outline: none;
  border-color: #409eff;
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
  transition: background-color 0.2s;
}

.login-btn:hover {
  background: #66b1ff;
}

.register-link {
  text-align: center;
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #1890ff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.forgot-password {
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
}

.forgot-password a {
  color: #666;
  text-decoration: none;
}

.forgot-password a:hover {
  color: #409eff;
  text-decoration: underline;
}

.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 350px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 25px;
  z-index: 1001;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-header h3 {
  color: #333;
  font-size: 18px;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #f5222d;
}

.forgot-form .form-item {
  margin-bottom: 18px;
}

.forgot-form input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.forgot-form input:focus {
  outline: none;
  border-color: #409eff;
}

.modal-footer {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.cancel-btn {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background: #eee;
}

.confirm-btn {
  flex: 1;
  padding: 10px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.confirm-btn:hover {
  background: #66b1ff;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .login-card,
  .modal-content {
    width: 90%;
    padding: 20px;
  }

  .login-card h2 {
    font-size: 20px;
    margin-bottom: 25px;
  }

  .form-item {
    margin-bottom: 18px;
  }

  .login-btn,
  .cancel-btn,
  .confirm-btn {
    padding: 10px;
    font-size: 14px;
  }
}
</style>
