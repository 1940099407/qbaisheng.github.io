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

const login = () => {
  if (!username.value || !password.value) {
    ElMessage.warning('用户名和密码不能为空')
    return
  }
  // 简单模拟登录（实际项目需对接后端）
  localStorage.setItem('isLoggedIn', 'true')
  localStorage.setItem('username', username.value) // 保存用户名
  router.push('/checkin')
  ElMessage.success('登录成功')
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
  color: #1890ff;
  text-align: center;
  margin-bottom: 30px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.form-item input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover {
  background: #096dd9;
}
</style>
