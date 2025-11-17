<template>
  <div class="achievement-container">
    <h3>我的成就</h3>

    <!-- 勋章列表 -->
    <div class="badge-list">
      <div
        class="badge-item"
        :class="{ unlocked: badge.unlocked }"
        v-for="badge in allBadges"
        :key="badge.id"
      >
        <div class="badge-icon">{{ badge.icon }}</div>
        <div class="badge-info">
          <div class="badge-name">{{ badge.name }}</div>
          <div class="badge-desc">{{ badge.desc }}</div>
          <div class="badge-status" v-if="!badge.unlocked">
            进度：{{ badge.progress }}/{{ badge.target }}
          </div>
          <div class="badge-status unlocked-text" v-if="badge.unlocked">
            已解锁于 {{ badge.unlockedAt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 定义所有勋章类型（可扩展）
const badgeDefinitions = [
  {
    id: 1,
    name: '初露锋芒',
    desc: '完成首次打卡',
    icon: '🌟',
    type: 'firstCheckin',
    target: 1,
  },
  {
    id: 2,
    name: '坚持不懈',
    desc: '连续打卡7天',
    icon: '📅',
    type: 'consecutiveDays',
    target: 7,
  },
  {
    id: 3,
    name: '打卡达人',
    desc: '累计打卡30次',
    icon: '🏆',
    type: 'totalCheckins',
    target: 30,
  },
  {
    id: 4,
    name: '全勤模范',
    desc: '完成1次周目标',
    icon: '📈',
    type: 'weeklyGoal',
    target: 1,
  },
]

// 从本地存储加载已解锁勋章
const loadAchievements = () => {
  const saved = localStorage.getItem('userAchievements')
  return saved ? JSON.parse(saved) : []
}

// 所有勋章状态（包含解锁信息）
const allBadges = ref([])

// 初始化勋章数据
const initBadges = () => {
  const unlockedBadges = loadAchievements()
  allBadges.value = badgeDefinitions.map((badge) => {
    const unlocked = unlockedBadges.find((item) => item.id === badge.id)
    return {
      ...badge,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt || null,
      progress: 0, // 后续计算
    }
  })
}

// 计算打卡相关数据
const checkinRecords = computed(() => {
  return JSON.parse(localStorage.getItem('checkinRecords') || '[]')
})

// 计算连续打卡天数
const getConsecutiveDays = () => {
  if (checkinRecords.value.length === 0) return 0

  const sortedDates = checkinRecords.value
    .map((item) => new Date(item.time).toLocaleDateString())
    .sort((a, b) => new Date(b) - new Date(a)) // 倒序排列

  const today = new Date().toLocaleDateString()
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()
  let count = 0

  if (sortedDates.includes(today)) {
    count++
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
  } else if (sortedDates.includes(yesterday)) {
    count++
    let prevDate = new Date(yesterday).getTime() - 86400000
    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr).getTime()
      if (currentDate === prevDate) {
        count++
        prevDate -= 86400000
      } else if (currentDate < prevDate) {
        break
      }
    }
  }
  return count
}

// 检查勋章解锁条件
const checkAchievements = () => {
  const newUnlocked = []
  const totalCheckins = checkinRecords.value.length
  const consecutiveDays = getConsecutiveDays()
  const weeklyGoalsCompleted = JSON.parse(localStorage.getItem('weeklyGoalsCompleted') || '0')

  // 更新每个勋章的进度和解锁状态
  allBadges.value.forEach((badge) => {
    switch (badge.type) {
      case 'firstCheckin':
        badge.progress = totalCheckins >= 1 ? 1 : 0
        if (totalCheckins >= 1 && !badge.unlocked) {
          badge.unlocked = true
          badge.unlockedAt = new Date().toLocaleDateString()
          newUnlocked.push(badge)
        }
        break
      case 'consecutiveDays':
        badge.progress = consecutiveDays
        if (consecutiveDays >= badge.target && !badge.unlocked) {
          badge.unlocked = true
          badge.unlockedAt = new Date().toLocaleDateString()
          newUnlocked.push(badge)
        }
        break
      case 'totalCheckins':
        badge.progress = totalCheckins
        if (totalCheckins >= badge.target && !badge.unlocked) {
          badge.unlocked = true
          badge.unlockedAt = new Date().toLocaleDateString()
          newUnlocked.push(badge)
        }
        break
      case 'weeklyGoal':
        badge.progress = weeklyGoalsCompleted
        if (weeklyGoalsCompleted >= badge.target && !badge.unlocked) {
          badge.unlocked = true
          badge.unlockedAt = new Date().toLocaleDateString()
          newUnlocked.push(badge)
        }
        break
    }
  })

  // 保存新解锁的勋章
  if (newUnlocked.length > 0) {
    const toSave = allBadges.value
      .filter((b) => b.unlocked)
      .map((b) => ({ id: b.id, unlockedAt: b.unlockedAt }))
    localStorage.setItem('userAchievements', JSON.stringify(toSave))

    // 显示解锁通知
    newUnlocked.forEach((badge) => {
      ElMessage.success(`恭喜解锁新成就：${badge.name} ${badge.icon}`)
    })
  }
}

// 页面加载时初始化
onMounted(() => {
  initBadges()
  checkAchievements()
})
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.achievement-container h3::before {
  content: '🏆';
  font-size: 20px;
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
  opacity: 0.7;
}

.badge-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.badge-item.unlocked {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
  opacity: 1;
}

.badge-icon {
  font-size: 32px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.badge-item.unlocked .badge-icon {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
}

.badge-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 3px;
  font-size: 16px;
}

.badge-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.badge-status {
  font-size: 12px;
  color: #999;
}

.unlocked-text {
  font-size: 12px;
  color: #1890ff;
}
</style>
