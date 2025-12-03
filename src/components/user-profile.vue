<template>
  <div class="page-container">
    <div class="user-settings">
      <div class="container">
        <!-- 编辑资料模块 -->
        <section class="setting-module">
          <div class="module-header">
            <div class="header-icon"></div>
            <h2>编辑资料</h2>
          </div>
          <div class="module-card">
            <el-form :model="formData" label-width="90px" class="profile-form" ref="profileForm">
              <!-- 头像上传 -->
              <el-form-item label="头像" class="form-item">
                <div class="avatar-wrap">
                  <img :src="formData.avatar" alt="用户头像" class="avatar" />
                  <label class="avatar-upload-btn" for="avatar-upload-input">
                    <i class="upload-icon"></i>
                    <input
                      type="file"
                      id="avatar-upload-input"
                      accept="image/*"
                      class="avatar-file"
                      @change="handleAvatarUpload"
                    />
                  </label>
                </div>
              </el-form-item>

              <!-- 用户名（不可修改） -->
              <el-form-item label="用户名" class="form-item">
                <el-input
                  v-model="formData.username"
                  disabled
                  class="custom-input"
                  placeholder="系统分配"
                />
              </el-form-item>

              <!-- 昵称 -->
              <el-form-item label="昵称" class="form-item">
                <el-input
                  v-model="formData.nickname"
                  maxlength="36"
                  placeholder="请输入昵称"
                  class="custom-input"
                  @input="updateNicknameCount"
                />
                <span class="char-count">{{ nicknameCount }}/36</span>
              </el-form-item>

              <!-- 个性签名 -->
              <el-form-item label="个签" class="form-item">
                <el-input
                  v-model="formData.signature"
                  maxlength="80"
                  type="textarea"
                  rows="2"
                  placeholder="分享你的状态或爱好"
                  class="custom-textarea"
                  @input="updateSignatureCount"
                />
                <span class="char-count">{{ signatureCount }}/80</span>
              </el-form-item>

              <!-- 性别 -->
              <el-form-item label="性别" class="form-item">
                <el-radio-group v-model="formData.gender" class="gender-group">
                  <el-radio label="male" class="gender-option">男</el-radio>
                  <el-radio label="female" class="gender-option">女</el-radio>
                  <el-radio label="secret" class="gender-option">保密</el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 生日 -->
              <el-form-item label="生日" class="form-item">
                <el-date-picker
                  v-model="formData.birthday"
                  type="date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  placeholder="选择生日"
                  class="custom-picker"
                />
              </el-form-item>

              <!-- 保存按钮 -->
              <el-form-item class="form-submit">
                <el-button type="primary" class="save-btn" @click="saveProfile">保存资料</el-button>
              </el-form-item>
            </el-form>
          </div>
        </section>

        <!-- 打卡提醒设置 -->
        <section class="setting-module">
          <div class="module-header">
            <div class="header-icon"></div>
            <h2>打卡提醒设置</h2>
          </div>
          <div class="module-card reminder-card">
            <div class="reminder-item">
              <span class="reminder-label">是否开启每日提醒</span>
              <el-switch
                v-model="reminderData.enabled"
                active-color="#42b983"
                inactive-color="#e5e7eb"
                class="custom-switch"
                @change="handleReminderChange"
              />
            </div>

            <!-- 自定义时间选择器（开启后显示） -->
            <div class="reminder-time-item" v-if="reminderData.enabled">
              <span class="reminder-label">提醒时间</span>
              <el-time-picker
                v-model="reminderData.time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择提醒时间"
                class="time-picker"
                :picker-options="{
                  start: '06:00',
                  end: '22:00',
                  step: '00:15',
                }"
                @change="saveReminderSetting"
              />
            </div>

            <p class="reminder-desc">
              {{
                reminderData.enabled
                  ? `开启后将在每天 ${reminderData.time || '08:30'} 推送打卡提醒`
                  : '开启后可自定义每日打卡提醒时间'
              }}
            </p>
          </div>
        </section>

        <!-- 我的成就 -->
        <section class="setting-module">
          <div class="module-header">
            <div class="header-icon"></div>
            <h2>我的成就</h2>
          </div>
          <div class="module-card">
            <div class="achievements-grid">
              <div
                class="achievement-card"
                :class="{ unlocked: item.status === 'unlocked' }"
                v-for="item in achievements"
                :key="item.id"
              >
                <div class="achievement-icon" :class="getIconClass(item.id)"></div>
                <div class="achievement-info">
                  <h3 class="achievement-name">{{ item.name }}</h3>
                  <p class="achievement-desc">{{ item.desc }}</p>

                  <template v-if="item.status === 'unlocked'">
                    <p class="achievement-status">已解锁 · {{ item.unlockTime }}</p>
                  </template>

                  <template v-else>
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: (item.current / item.target) * 100 + '%' }"
                      ></div>
                    </div>
                    <p class="progress-text">进度：{{ item.current }}/{{ item.target }}</p>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 账户安全 -->
        <section class="setting-module">
          <div class="module-header">
            <div class="header-icon"></div>
            <h2>账户安全</h2>
          </div>
          <div class="module-card security-card">
            <div class="security-item">
              <span class="security-label">修改密码</span>
              <el-button type="text" @click="showPwdDialog = true">
                立即修改 <i class="el-icon-arrow-right"></i>
              </el-button>
            </div>
            <div class="security-item">
              <span class="security-label">绑定手机号</span>
              <div class="security-content">
                <span v-if="formData.phone">{{ hidePhone(formData.phone) }}</span>
                <span v-else class="unbound">未绑定</span>
                <el-button type="text" @click="handleBindPhone">
                  {{ formData.phone ? '更换' : '绑定' }} <i class="el-icon-arrow-right"></i>
                </el-button>
              </div>
            </div>
          </div>
        </section>

        <!-- 密码修改弹窗 -->
        <el-dialog
          v-model="showPwdDialog"
          title="修改密码"
          width="400px"
          :close-on-click-modal="false"
        >
          <el-form :model="pwdForm" ref="pwdFormRef" label-width="100px" class="password-form">
            <el-form-item
              label="原密码"
              prop="oldPwd"
              :rules="[{ required: true, message: '请输入原密码', trigger: 'blur' }]"
            >
              <el-input v-model="pwdForm.oldPwd" type="password" show-password />
            </el-form-item>
            <el-form-item
              label="新密码"
              prop="newPwd"
              :rules="[
                { required: true, message: '请输入新密码', trigger: 'blur' },
                { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
              ]"
            >
              <el-input v-model="pwdForm.newPwd" type="password" show-password />
            </el-form-item>
            <el-form-item
              label="确认密码"
              prop="confirmPwd"
              :rules="[
                { required: true, message: '请确认新密码', trigger: 'blur' },
                { validator: validateConfirm, trigger: 'blur' },
              ]"
            >
              <el-input v-model="pwdForm.confirmPwd" type="password" show-password />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showPwdDialog = false">取消</el-button>
            <el-button type="primary" @click="submitPwdChange">确认修改</el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

// 路由实例
const router = useRouter()

// 表单数据
const formData = reactive({
  username: '', // 用户名（唯一标识）
  avatar: 'https://picsum.photos/200/200?random=6',
  nickname: '秦百胜',
  signature: '',
  gender: 'female',
  birthday: '2003-08-03',
  phone: '', // 手机号字段
})

// 提醒设置
const reminderData = reactive({
  enabled: false,
  time: '08:30',
})

// 成就数据
const achievements = reactive([
  {
    id: 'firstCheckin',
    name: '初露锋芒',
    desc: '完成首次打卡',
    status: 'unlocked',
    unlockTime: '2025/11/18',
  },
  {
    id: 'sevenDays',
    name: '坚持不懈',
    desc: '连续打卡7天',
    current: 2,
    target: 7,
    status: 'locked',
  },
  {
    id: 'thirtyTimes',
    name: '打卡达人',
    desc: '累计打卡30次',
    current: 17,
    target: 30,
    status: 'locked',
  },
  {
    id: 'fullWeek',
    name: '全勤模范',
    desc: '完成1次周全勤',
    current: 0,
    target: 1,
    status: 'locked',
  },
  {
    id: 'hundredTimes',
    name: '百日打卡',
    desc: '累计打卡100次',
    current: 17,
    target: 100,
    status: 'locked',
  },
  {
    id: 'thirtyDays',
    name: '连续王者',
    desc: '连续打卡30天',
    current: 2,
    target: 30,
    status: 'locked',
  },
])

// 计数状态
const nicknameCount = ref(0)
const signatureCount = ref(0)

// 密码弹窗控制
const showPwdDialog = ref(false)
// 密码表单数据
const pwdForm = reactive({
  oldPwd: '',
  newPwd: '',
  confirmPwd: '',
})
// 密码表单引用
const pwdFormRef = ref(null)

// 初始化
onMounted(() => {
  initUserInfo()
  loadUserData()
  loadReminderData()
  loadAchievements()
  updateNicknameCount()
  updateSignatureCount()
})

// 初始化用户信息（从登录状态获取用户名）
const initUserInfo = () => {
  const username = localStorage.getItem('username')
  if (!username) {
    router.push('/login')
    return
  }
  formData.username = username
}

// 加载用户数据
const loadUserData = () => {
  const savedUser = localStorage.getItem('userProfile')
  if (savedUser) {
    const parsed = JSON.parse(savedUser)
    Object.assign(formData, parsed)
  }
}

// 加载提醒设置
const loadReminderData = () => {
  const savedReminder = localStorage.getItem('checkinReminder')
  if (savedReminder) {
    Object.assign(reminderData, JSON.parse(savedReminder))
  }
}

// 加载成就数据
const loadAchievements = () => {
  const savedAchieve = localStorage.getItem('userAchievements')
  if (savedAchieve) {
    const parsed = JSON.parse(savedAchieve)
    achievements.forEach((item, index) => {
      if (parsed[index]) Object.assign(item, parsed[index])
    })
  }
}

// 更新计数
const updateNicknameCount = () => {
  nicknameCount.value = formData.nickname.length
}
const updateSignatureCount = () => {
  signatureCount.value = formData.signature.length
}

// 头像上传
const handleAvatarUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('请上传 JPG/PNG 格式图片')
    return
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (ev) => {
    formData.avatar = ev.target.result
    saveProfileToStorage()
    ElMessage.success('头像更新成功')
  }
  reader.readAsDataURL(file)
}

// 保存资料
const saveProfile = () => {
  if (!formData.nickname.trim()) {
    ElMessage.error('昵称不能为空')
    return
  }
  saveProfileToStorage()
  ElMessage.success('资料保存成功')
}

// 保存到本地存储
const saveProfileToStorage = () => {
  localStorage.setItem('userProfile', JSON.stringify(formData))
}

// 提醒设置变更
const handleReminderChange = (value) => {
  saveReminderSetting()
  ElMessage.info(value ? `已开启每日${reminderData.time}提醒` : '已关闭每日打卡提醒')
}

// 保存提醒设置
const saveReminderSetting = () => {
  localStorage.setItem('checkinReminder', JSON.stringify(reminderData))
}

// 成就图标映射
const getIconClass = (id) => {
  const iconMap = {
    firstCheckin: 'star-icon',
    sevenDays: 'calendar-icon',
    thirtyTimes: 'trophy-icon',
    fullWeek: 'chart-icon',
    hundredTimes: 'hundred-icon',
    thirtyDays: 'streak-icon',
  }
  return iconMap[id]
}

// 账户安全相关：手机号绑定/更换
const handleBindPhone = () => {
  ElMessageBox.prompt('请输入手机号', formData.phone ? '更换手机号' : '绑定手机号', {
    inputPattern: /^1[3-9]\d{9}$/,
    inputErrorMessage: '请输入正确的手机号',
  }).then(({ value }) => {
    formData.phone = value
    saveProfileToStorage()
    ElMessage.success(`${formData.phone ? '更换' : '绑定'}成功`)
  })
}

// 密码弹窗相关：确认密码验证
const validateConfirm = (rule, value, callback) => {
  if (value !== pwdForm.newPwd) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 提交密码修改
const submitPwdChange = () => {
  pwdFormRef.value.validate((valid) => {
    if (!valid) return

    // 从本地存储获取原密码（实际项目中应从接口验证）
    const storedPwd = localStorage.getItem('userPassword') || '123456' // 假设初始密码为123456

    // 验证原密码
    if (pwdForm.oldPwd !== storedPwd) {
      ElMessage.error('原密码输入错误')
      return
    }

    // 保存新密码
    localStorage.setItem('userPassword', pwdForm.newPwd)
    ElMessage.success('密码修改成功')
    showPwdDialog.value = false
    // 重置表单
    pwdFormRef.value.resetFields()
  })
}

// 手机号隐藏处理
const hidePhone = (value) => {
  if (!value) return ''
  return value.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1****$3')
}

// 监听提醒时间变化
watch(
  () => reminderData.time,
  () => {
    if (reminderData.enabled) saveReminderSetting()
  },
)
</script>
<style scoped>
/* 顶部导航栏样式 */
.top-nav {
  height: 60px;
  border-bottom: 1px solid #f0f2f5;
  padding: 0 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #f0f2f5;
}

.username {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

/* 全局样式 */
.page-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

.user-settings {
  padding: 32px 0;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 模块通用样式 */
.setting-module {
  margin-bottom: 32px;
}

.module-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.header-icon {
  width: 4px;
  height: 20px;
  background-color: #1890ff;
  border-radius: 2px;
}

.module-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.module-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  padding: 24px;
  border: 1px solid #f0f2f5;
}

/* 编辑资料模块 */
.form-item {
  margin-bottom: 24px;
}

.avatar-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #f0f2f5;
  cursor: pointer;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
}

.upload-icon {
  width: 18px;
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E")
    center no-repeat;
}

.avatar-file {
  display: none;
}

.custom-input,
.custom-textarea,
.custom-picker {
  width: 100%;
  max-width: 420px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: border-color 0.2s;
}

.custom-input:focus,
.custom-textarea:focus,
.custom-picker:focus-within {
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
  outline: none;
}

.custom-textarea {
  resize: none;
  padding: 12px;
}

.char-count {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin-left: 90px;
}

.gender-group {
  display: flex;
  gap: 24px;
  padding-top: 4px;
}

.gender-option {
  font-size: 14px;
  color: #374151;
}

.save-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #1890ff;
  border-color: #1890ff;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #1890ff;
  border-color: #1890ff;
}

/* 打卡提醒设置 */
.reminder-card {
  padding: 20px 24px;
}

.reminder-item,
.reminder-time-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.reminder-label {
  font-size: 14px;
  color: #374151;
  flex: 0 0 120px;
}

.time-picker {
  width: 180px;
  border-radius: 8px;
}

.custom-switch {
  --el-switch-width: 44px;
  --el-switch-height: 22px;
  --el-switch-node-size: 18px;
}

.reminder-desc {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  padding-left: 132px;
}

/* 我的成就模块 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.achievement-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
  background-color: #ffffff;
  display: flex;
  gap: 12px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.achievement-card.unlocked {
  border-color: #1890ff;
  background-color: #f0fdf4;
}

.achievement-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 成就图标样式 */
.star-icon {
  background-color: #fde68a;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='%2392400e' stroke='%2392400e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.calendar-icon {
  background-color: #bfdbfe;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='%231e40af' stroke='%231e40af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.trophy-icon {
  background-color: #fed7aa;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='%239a3412' stroke='%239a3412' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9H4.5a2.5 2.5 0 0 0 0 5H6'/%3E%3Cpath d='M18 9h1.5a2.5 2.5 0 0 1 0 5H18'/%3E%3Cpath d='M4 22h16'/%3E%3Cpath d='M10 14.66V17a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-2.34'/%3E%3Cpath d='M9 9v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.chart-icon {
  background-color: #dbeafe;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='%231e40af' stroke='%231e40af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'/%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.hundred-icon {
  background-color: #c7d2fe;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='%234338ca' stroke='%234338ca' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3Cpolyline points='10 9 9 9 8 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.streak-icon {
  background-color: #fda4af;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='%239f1239' stroke='%239f1239' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 12h-4l-3 9L9 3l-3 9H2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.achievement-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.achievement-status {
  font-size: 12px;
  color: #1890ff;
  margin: 0;
  font-weight: 500;
}

/* 进度条 */
.progress-bar {
  height: 6px;
  background-color: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background-color: #1890ff;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

/* 账户安全模块 */
.security-card {
  padding: 16px 24px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.security-item:last-child {
  border-bottom: none;
}

.security-label {
  font-size: 14px;
  color: #374151;
}

.security-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unbound {
  color: #ef4444;
  font-size: 14px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .char-count {
    margin-left: 0;
  }

  .reminder-desc {
    padding-left: 0;
  }

  .module-card {
    padding: 20px;
  }

  .reminder-item,
  .reminder-time-item,
  .security-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .time-picker {
    width: 100%;
  }
}
/* 密码表单样式补充 */
.password-form {
  margin-top: 16px;
}
</style>
