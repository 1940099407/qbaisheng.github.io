<template>
  <div class="reminder-setting">
    <h3>打卡提醒设置</h3>
    <div class="setting-item">
      <label>是否开启提醒：</label>
      <el-switch v-model="reminderEnabled" @change="saveSettings" />
    </div>
    <div class="setting-item" v-if="reminderEnabled">
      <label>提醒时间：</label>
      <el-time-picker
        v-model="reminderTime"
        format="HH:mm"
        value-format="HH:mm"
        @change="saveSettings"
      />
    </div>
    <p class="tip">开启后，每天指定时间会提醒您完成打卡</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElSwitch } from 'element-plus' // 正确导入Switch组件
import { ElTimePicker } from 'element-plus' // 正确导入TimePicker组件

const reminderEnabled = ref(false)
const reminderTime = ref('20:00')

onMounted(() => {
  const saved = localStorage.getItem('reminderSettings')
  if (saved) {
    const { enabled, time } = JSON.parse(saved)
    reminderEnabled.value = enabled
    reminderTime.value = time || '20:00'
  }
  initReminderCheck()
})

const saveSettings = () => {
  localStorage.setItem(
    'reminderSettings',
    JSON.stringify({
      enabled: reminderEnabled.value,
      time: reminderTime.value,
    }),
  )
  initReminderCheck()
}

const initReminderCheck = () => {
  if (window.reminderTimer) clearInterval(window.reminderTimer)
  if (!reminderEnabled.value) return

  window.reminderTimer = setInterval(() => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const today = now.toLocaleDateString()

    if (currentTime === reminderTime.value && !localStorage.getItem(`checked_${today}`)) {
      alert('今日还未打卡哦～ 快去完成今天的打卡吧！')
    }
  }, 60000)
}
</script>

<style scoped>
.reminder-setting {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 15px 0;
}

.setting-item label {
  width: 120px;
  color: #666;
}

.tip {
  color: #999;
  font-size: 14px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}
</style>
