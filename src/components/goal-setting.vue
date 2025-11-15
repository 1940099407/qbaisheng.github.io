<template>
  <div class="goal-setting">
    <h3>打卡目标设置</h3>

    <div class="goal-item">
      <label>每日打卡目标：</label>
      <div class="goal-config">
        <select v-model="dailyGoal" @change="saveGoals">
          <option value="1">1次/天</option>
          <option value="2">2次/天</option>
          <option value="3">3次/天</option>
          <option value="4">4次/天</option>
          <option value="5">5次/天</option>
        </select>
        <div class="progress-box">
          <span class="progress-text">今日完成：{{ dailyProgress }}/{{ dailyGoal }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: dailyProgressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="goal-item">
      <label>每周打卡目标：</label>
      <div class="goal-config">
        <select v-model="weeklyGoal" @change="saveGoals">
          <option value="3">3次/周</option>
          <option value="5">5次/周</option>
          <option value="7">7次/周</option>
          <option value="10">10次/周</option>
          <option value="15">15次/周</option>
        </select>
        <div class="progress-box">
          <span class="progress-text">本周完成：{{ weeklyProgress }}/{{ weeklyGoal }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: weeklyProgressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// 目标值
const dailyGoal = ref('1')
const weeklyGoal = ref('5')

// 从本地存储加载目标设置
onMounted(() => {
  const saved = localStorage.getItem('checkinGoals')
  if (saved) {
    const { daily, weekly } = JSON.parse(saved)
    dailyGoal.value = daily || '1'
    weeklyGoal.value = weekly || '5'
  }
})

// 计算今日打卡次数
const dailyProgress = computed(() => {
  const today = new Date().toLocaleDateString()
  const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
  return records.filter((item) => item.time.includes(today)).length
})

// 计算本周打卡次数（周一到当前）
const weeklyProgress = computed(() => {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // 本周一
  weekStart.setHours(0, 0, 0, 0)

  const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
  return records.filter((item) => {
    const recordTime = new Date(item.time)
    return recordTime >= weekStart && recordTime <= now
  }).length
})

// 进度百分比（最大100%）
const dailyProgressPercent = computed(() => {
  const percent = (dailyProgress.value / dailyGoal.value) * 100
  return Math.min(percent, 100)
})

const weeklyProgressPercent = computed(() => {
  const percent = (weeklyProgress.value / weeklyGoal.value) * 100
  return Math.min(percent, 100)
})

// 保存目标设置
const saveGoals = () => {
  localStorage.setItem(
    'checkinGoals',
    JSON.stringify({
      daily: dailyGoal.value,
      weekly: weeklyGoal.value,
    }),
  )
}
</script>

<style scoped>
.goal-setting {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.goal-item {
  margin: 20px 0;
}

.goal-item label {
  display: block;
  margin-bottom: 10px;
  color: #666;
  font-size: 16px;
}

.goal-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-config select {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.progress-box {
  width: 100%;
}

.progress-text {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
}

.progress-bar {
  height: 8px;
  width: 100%;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1890ff;
  transition: width 0.3s ease;
}
</style>
