<!-- src/components/admin/system-settings.vue -->
<template>
  <div class="system-settings-page">
    <h2 class="page-title">系统配置</h2>

    <el-card class="settings-card">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基础设置" name="basic">
          <el-form :model="basicSettings" label-width="150px" class="settings-form">
            <el-form-item label="系统名称">
              <el-input v-model="basicSettings.systemName" />
            </el-form-item>
            <el-form-item label="首页标题">
              <el-input v-model="basicSettings.homeTitle" />
            </el-form-item>
            <el-form-item label="每页显示条数">
              <el-select v-model="basicSettings.pageSize">
                <el-option label="10条/页" value="10" />
                <el-option label="20条/页" value="20" />
                <el-option label="50条/页" value="50" />
                <el-option label="100条/页" value="100" />
              </el-select>
            </el-form-item>
            <el-form-item label="是否允许注册">
              <el-switch v-model="basicSettings.allowRegistration" />
            </el-form-item>
            <el-form-item label="默认用户角色">
              <el-select v-model="basicSettings.defaultRole">
                <el-option label="普通用户" value="user" />
                <el-option label="游客" value="visitor" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="通知设置" name="notification">
          <el-form :model="notificationSettings" label-width="150px" class="settings-form">
            <el-form-item label="打卡提醒">
              <el-switch v-model="notificationSettings.checkinReminder" />
            </el-form-item>
            <el-form-item label="提醒时间" :disabled="!notificationSettings.checkinReminder">
              <el-time-picker
                v-model="notificationSettings.reminderTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择提醒时间"
              />
            </el-form-item>
            <el-form-item label="活动通知">
              <el-switch v-model="notificationSettings.activityNotification" />
            </el-form-item>
            <el-form-item label="系统公告">
              <el-switch v-model="notificationSettings.systemAnnouncement" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securitySettings" label-width="150px" class="settings-form">
            <el-form-item label="密码强度要求">
              <el-select v-model="securitySettings.passwordStrength">
                <el-option label="低 (至少6位)" value="low" />
                <el-option label="中 (字母+数字)" value="medium" />
                <el-option label="高 (字母+数字+特殊符号)" value="high" />
              </el-select>
            </el-form-item>
            <el-form-item label="登录失败锁定">
              <el-switch v-model="securitySettings.loginLock" />
            </el-form-item>
            <el-form-item label="锁定次数" :disabled="!securitySettings.loginLock">
              <el-input
                v-model.number="securitySettings.lockCount"
                type="number"
                min="3"
                max="20"
              />
            </el-form-item>
            <el-form-item label="锁定时长(分钟)" :disabled="!securitySettings.loginLock">
              <el-input
                v-model.number="securitySettings.lockMinutes"
                type="number"
                min="5"
                max="120"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 当前激活的标签页
const activeTab = ref('basic')

// 基础设置
const basicSettings = reactive({
  systemName: '打卡管理系统',
  homeTitle: '欢迎使用打卡管理系统',
  pageSize: '10',
  allowRegistration: true,
  defaultRole: 'user',
})

// 通知设置
const notificationSettings = reactive({
  checkinReminder: true,
  reminderTime: '09:00',
  activityNotification: true,
  systemAnnouncement: true,
})

// 安全设置
const securitySettings = reactive({
  passwordStrength: 'medium',
  loginLock: true,
  lockCount: 5,
  lockMinutes: 15,
})

// 页面加载时从本地存储读取设置
onMounted(() => {
  loadSettings()
})

// 加载设置
const loadSettings = () => {
  const savedBasic = localStorage.getItem('systemBasicSettings')
  const savedNotification = localStorage.getItem('systemNotificationSettings')
  const savedSecurity = localStorage.getItem('systemSecuritySettings')

  if (savedBasic) {
    Object.assign(basicSettings, JSON.parse(savedBasic))
  }
  if (savedNotification) {
    Object.assign(notificationSettings, JSON.parse(savedNotification))
  }
  if (savedSecurity) {
    Object.assign(securitySettings, JSON.parse(savedSecurity))
  }
}

// 保存基础设置
const saveBasicSettings = () => {
  localStorage.setItem('systemBasicSettings', JSON.stringify(basicSettings))
  ElMessage.success('基础设置保存成功')
}

// 保存通知设置
const saveNotificationSettings = () => {
  localStorage.setItem('systemNotificationSettings', JSON.stringify(notificationSettings))
  ElMessage.success('通知设置保存成功')
}

// 保存安全设置
const saveSecuritySettings = () => {
  localStorage.setItem('systemSecuritySettings', JSON.stringify(securitySettings))
  ElMessage.success('安全设置保存成功')
}
</script>

<style scoped>
.system-settings-page {
  padding: 20px;
}

.page-title {
  margin: 0 0 20px 0;
  color: #1d2129;
}

.settings-card {
  margin-bottom: 20px;
}

.settings-form {
  padding: 20px 0;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
