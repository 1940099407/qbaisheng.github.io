<template>
  <div class="register-container">
    <div class="register-card">
      <h2 class="register-title">用户注册</h2>

      <el-form ref="registerForm" :model="formData" label-width="80px" class="register-form">
        <el-form-item
          label="用户名"
          prop="username"
          :rules="[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 16, message: '用户名长度在3-16个字符之间' },
          ]"
        >
          <el-input v-model="formData.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <el-form-item
          label="密码"
          prop="password"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度不能少于6个字符' },
          ]"
        >
          <el-input type="password" v-model="formData.password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <el-form-item
          label="确认密码"
          prop="confirmPassword"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword, trigger: 'blur' },
          ]"
        >
          <el-input
            type="password"
            v-model="formData.confirmPassword"
            placeholder="请再次输入密码"
          ></el-input>
        </el-form-item>
        <!-- 新增手机号验证
        <el-form-item
          label="手机号"
          prop="phone"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
          ]"
        >
          <el-input v-model="formData.phone" placeholder="请输入手机号"></el-input>
        </el-form-item> -->
        <el-form-item>
          <el-button type="primary" @click="handleRegister" class="register-btn">注册</el-button>
          <div class="login-link">已有账号？<a href="/login">立即登录</a></div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
})

const registerForm = ref(null)

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== formData.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 处理注册
const handleRegister = () => {
  registerForm.value.validate((valid) => {
    if (valid) {
      // 检查用户是否已存在
      const savedUsers = localStorage.getItem('systemUsers') || '[]'
      const users = JSON.parse(savedUsers)

      const userExists = users.some((user) => user.username === formData.value.username)
      if (userExists) {
        ElMessage.error('用户名已存在')
        return
      }

      // 创建新用户
      const newUser = {
        username: formData.value.username,
        password: formData.value.password, // 实际项目中应加密存储
        joinDate: new Date().toLocaleDateString(),
        totalCheckins: 0,
        lastCheckin: '',
      }

      // 保存用户
      users.push(newUser)
      localStorage.setItem('systemUsers', JSON.stringify(users))

      // 存储默认用户角色
      localStorage.setItem('userRole', 'user')

      ElMessage.success('注册成功，请登录')
      router.push('/login')
    }
  })
}
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f7fa;
}

.register-card {
  width: 350px;
  padding: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  margin-bottom: 25px;
  color: #1890ff;
}

.register-form {
  margin-top: 15px;
}

.register-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}

.login-link {
  text-align: center;
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #1890ff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
