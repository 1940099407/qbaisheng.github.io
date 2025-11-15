<template>
  <div class="achievement-container">
    <h3>我的成就徽章</h3>
    <div class="badge-list">
      <!-- 连续打卡3天 -->
      <div class="badge-item" :class="{ unlocked: achievements.continue3 }">
        <div class="badge-icon">
          <span v-if="achievements.continue3">🔥</span>
          <span v-else>⚫</span>
        </div>
        <div class="badge-info">
          <div class="badge-name">坚持不懈</div>
          <div class="badge-desc" v-if="achievements.continue3">已解锁：连续打卡3天</div>
          <div class="badge-desc" v-else>未解锁：连续打卡3天</div>
        </div>
      </div>
      <!-- 总打卡10次 -->
      <div class="badge-item" :class="{ unlocked: achievements.total10 }">
        <div class="badge-icon">
          <span v-if="achievements.total10">⭐</span>
          <span v-else>⚫</span>
        </div>
        <div class="badge-info">
          <div class="badge-name">打卡达人</div>
          <div class="badge-desc" v-if="achievements.total10">已解锁：总打卡10次</div>
          <div class="badge-desc" v-else>未解锁：总打卡10次</div>
        </div>
      </div>
      <!-- 完成周目标 -->
      <div class="badge-item" :class="{ unlocked: achievements.weeklyGoal }">
        <div class="badge-icon">
          <span v-if="achievements.weeklyGoal">🏆</span>
          <span v-else>⚫</span>
        </div>
        <div class="badge-info">
          <div class="badge-name">周计划达人</div>
          <div class="badge-desc" v-if="achievements.weeklyGoal">已解锁：完成1次周目标</div>
          <div class="badge-desc" v-else>未解锁：完成1次周目标</div>
        </div>
      </div>
      <!-- 打卡3种类型 -->
      <div class="badge-item" :class="{ unlocked: achievements.threeTypes }">
        <div class="badge-icon">
          <span v-if="achievements.threeTypes">🌈</span>
          <span v-else>⚫</span>
        </div>
        <div class="badge-info">
          <div class="badge-name">多元发展</div>
          <div class="badge-desc" v-if="achievements.threeTypes">已解锁：打卡3种不同类型</div>
          <div class="badge-desc" v-else>未解锁：打卡3种不同类型</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 成就状态
const achievements = ref({
  continue3: false, // 连续打卡3天
  total10: false, // 总打卡10次
  weeklyGoal: false, // 完成1次周目标
  threeTypes: false, // 打卡3种类型
})

// 从本地存储加载成就状态
const loadAchievements = () => {
  const saved = localStorage.getItem('achievements')
  if (saved) {
    achievements.value = JSON.parse(saved)
  }
}

// 保存成就状态到本地存储
const saveAchievements = () => {
  localStorage.setItem('achievements', JSON.stringify(achievements.value))
}

// 监听成就变化，自动保存
watch(achievements, saveAchievements, { deep: true })

// 计算解锁条件
const records = JSON.parse(localStorage.getItem('checkinRecords') || '[]')
const consecutiveDays = JSON.parse(localStorage.getItem('consecutiveDays') || '0')
const weeklyGoalCompleted = localStorage.getItem('weeklyGoalCompleted') === 'true'

// 总打卡10次
const total10 = computed(() => records.length >= 10)
// 连续打卡3天
const continue3 = computed(() => consecutiveDays >= 3)
// 完成周目标
const weeklyGoal = computed(() => weeklyGoalCompleted)
// 打卡3种不同类型
const threeTypes = computed(() => {
  const types = new Set(records.map((item) => item.type))
  return types.size >= 3
})

// 检查并解锁成就
const checkAchievements = () => {
  // 总打卡10次
  if (total10.value && !achievements.value.total10) {
    achievements.value.total10 = true
    ElMessage.success('解锁成就：打卡达人！')
  }
  // 连续打卡3天
  if (continue3.value && !achievements.value.continue3) {
    achievements.value.continue3 = true
    ElMessage.success('解锁成就：坚持不懈！')
  }
  // 完成周目标
  if (weeklyGoal.value && !achievements.value.weeklyGoal) {
    achievements.value.weeklyGoal = true
    ElMessage.success('解锁成就：周计划达人！')
  }
  // 打卡3种类型
  if (threeTypes.value && !achievements.value.threeTypes) {
    achievements.value.threeTypes = true
    ElMessage.success('解锁成就：多元发展！')
  }
}

// 页面加载时执行
loadAchievements()
checkAchievements()
</script>

<style scoped>
.achievement-container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.achievement-container h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
}

.badge-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
}

.badge-item.unlocked {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.badge-icon {
  font-size: 24px;
}

.badge-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 3px;
}

.badge-desc {
  font-size: 14px;
  color: #666;
}
</style>
