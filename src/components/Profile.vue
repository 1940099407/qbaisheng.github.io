<template>
  <div class="profile-container container">
    <!-- 个人信息卡片 -->
    <div class="profile-card">
      <div class="avatar-box">
        <div class="avatar">
          <!-- 字母头像（取用户名首字母） -->
          <span>{{ username.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="user-info">
          <h2>{{ username || '未设置用户名' }}</h2>
          <p class="join-date">注册时间：{{ joinDate }}</p>
        </div>
      </div>

      <!-- 打卡统计摘要 -->
      <div class="stats-summary">
        <div class="stat-item">
          <div class="stat-value">{{ totalCheckins }}</div>
          <div class="stat-label">总打卡次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ consecutiveDays }}</div>
          <div class="stat-label">连续打卡天数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ goalCompletionRate }}%</div>
          <div class="stat-label">目标达成率</div>
        </div>
      </div>
    </div>

    <!-- 基本信息修改 -->
    <div class="section-title">基本信息</div>
    <div class="profile-form">
      <div class="form-item">
        <label>用户名：</label>
        <input type="text" v-model="username" placeholder="请输入用户名" />
      </div>
      <button @click="saveProfile" class="save-btn">保存修改</button>
    </div>

    <!-- 打卡目标设置 -->
    <div class="section-title">打卡目标</div>
    <div class="goal-section">
      <GoalSetting />
    </div>

    <!-- 打卡类型管理 -->
    <div class="section-title">打卡类型管理</div>
    <div class="type-manager-section">
      <CheckinTypeManager />
    </div>

    <!-- 提醒设置 -->
    <div class="section-title">提醒设置</div>
    <div class="reminder-section">
      <ReminderSetting />
    </div>
    <!-- 成就徽章 -->
    <div class="section-title">我的成就</div>
    <div class="achievement-section">
      <Achievement />
    </div>

    <!-- 数据统计入口 -->
    <div class="section-title">数据统计</div>
    <div class="stats-entrance">
      <p>查看打卡数据趋势和详细统计分析</p>
      <router-link to="/statistics" class="stats-btn">
        前往数据统计 <i class="arrow">→</i>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ReminderSetting from './ReminderSetting.vue'
import GoalSetting from './GoalSetting.vue'
import Achievement from './Achievement.vue'
import CheckinTypeManager from './CheckinTypeManager.vue'

// 用户名
const username = ref('')

// 页面加载时初始化数据
onMounted(() => {
  // 加载已保存的用户名
  const savedName = localStorage.getItem('username')
  username.value = savedName || ''

  // 首次访问时记录注册时间
  if (!localStorage.getItem('joinDate')) {
    localStorage.setItem('joinDate', new Date().toLocaleDateString())
  }
})

// 注册时间
const joinDate = computed(() => {
  return localStorage.getItem('joinDate') || '未知'
})

// 总打卡次数
const totalCheckins = computed(() => {
  const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
  return records.length
})

// 连续打卡天数计算
const consecutiveDays = computed(() => {
  const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
  if (records.length === 0) return 0

  // 提取所有打卡日期（去重，按天）
  const dateSet = new Set()
  records.forEach((item) => {
    const date = new Date(item.time).toLocaleDateString()
    dateSet.add(date)
  })
  const sortedDates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a))

  let count = 1
  const today = new Date().toLocaleDateString()
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()

  // 检查今天是否打卡
  const hasCheckedToday = dateSet.has(today)
  // 检查昨天是否打卡
  const hasCheckedYesterday = dateSet.has(yesterday)

  if (hasCheckedToday) {
    // 从昨天开始计算连续天数
    let prevDate = new Date(yesterday)
    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr)
      if (currentDate.getTime() === prevDate.getTime()) {
        count++
        prevDate = new Date(prevDate.getTime() - 86400000) // 前一天
      } else if (currentDate.getTime() < prevDate.getTime()) {
        break
      }
    }
    return count
  } else if (hasCheckedYesterday) {
    // 从昨天往前计算
    let prevDate = new Date(yesterday)
    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr)
      if (currentDate.getTime() === prevDate.getTime()) {
        count++
        prevDate = new Date(prevDate.getTime() - 86400000)
      } else if (currentDate.getTime() < prevDate.getTime()) {
        break
      }
    }
    return count - 1 // 减去昨天本身
  } else {
    return 0
  }
})

// 目标达成率
const goalCompletionRate = computed(() => {
  const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
  if (records.length === 0) return 0

  // 按天分组统计打卡次数
  const dailyCounts = {}
  records.forEach((item) => {
    const date = new Date(item.time).toLocaleDateString()
    dailyCounts[date] = (dailyCounts[date] || 0) + 1
  })

  // 假设默认每日目标为1次，计算达成率
  const totalDays = Object.keys(dailyCounts).length
  const completedDays = Object.values(dailyCounts).filter((count) => count >= 1).length
  return Math.round((completedDays / totalDays) * 100)
})

// 保存用户名
const saveProfile = () => {
  if (!username.value.trim()) {
    ElMessage.warning('用户名不能为空')
    return
  }
  localStorage.setItem('username', username.value)
  ElMessage.success('用户名修改成功')
}
</script>

<style scoped>
.profile-container {
  padding: 30px 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* 个人信息卡片 */
.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 25px;
  margin-bottom: 30px;
}

.avatar-box {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
}

.user-info h2 {
  margin: 0;
  color: #333;
  font-size: 22px;
}

.join-date {
  color: #999;
  font-size: 14px;
  margin: 5px 0 0;
}

/* 统计摘要 */
.stats-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px dashed #eee;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

/* 板块标题 */
.section-title {
  font-size: 18px;
  color: #333;
  margin: 40px 0 15px;
  padding-left: 5px;
  border-left: 3px solid #1890ff;
}

/* 表单样式 */
.profile-form {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-size: 16px;
}

.form-item input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.save-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #096dd9;
}

/* 目标和提醒设置板块 */
.goal-section,
.reminder-section {
  background: white;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 15px;
}

/* 数据统计入口 */
.stats-entrance {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.stats-entrance p {
  color: #666;
  margin-bottom: 15px;
}

.stats-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.stats-btn:hover {
  background: #096dd9;
  transform: translateY(-2px);
}

.arrow {
  font-size: 16px;
}
</style>
