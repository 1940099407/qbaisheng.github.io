<template>
  <div class="social-analysis-container">
    <div class="page-header">
      <h2>互动交流</h2>
      <!-- 积分兑换中心按钮 -->
      <el-button
        type="primary"
        icons="Gift"
        @click="showRewardCenter = true"
        class="add-friend-btn"
      >
        积分兑换
      </el-button>
      <el-button
        type="primary"
        icons="Plus"
        @click="showAddFriendModal = true"
        class="add-friend-btn"
      >
        添加好友
      </el-button>
    </div>

    <div class="stats-grid">
      <!-- 好友数量统计 -->
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon friend-icon">👥</div>
          <div class="stat-label">好友总数</div>
          <div class="stat-value">{{ friendStats.total }}</div>
          <div class="stat-trend" :class="friendStats.trend > 0 ? 'up' : 'down'">
            {{ friendStats.trend > 0 ? '+' : '' }}{{ friendStats.trend }} 本周
          </div>
        </div>
      </el-card>

      <!-- 互动次数统计 -->
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon interaction-icon">💬</div>
          <div class="stat-label">本月互动</div>
          <div class="stat-value">{{ interactionStats.monthly }}</div>
          <div class="stat-trend" :class="interactionStats.trend > 0 ? 'up' : 'down'">
            {{ interactionStats.trend > 0 ? '+' : '' }}{{ interactionStats.trend }}% 环比
          </div>
        </div>
      </el-card>

      <!-- 共同活动统计 -->
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon activity-icon">🎯</div>
          <div class="stat-label">共同活动</div>
          <div class="stat-value">{{ commonActivityStats.count }}</div>
          <div class="stat-trend">最近: {{ commonActivityStats.recent }}</div>
        </div>
      </el-card>

      <!-- 本周任务统计 -->
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon task-icon">🎁</div>
          <div class="stat-label">本周任务</div>
          <div class="stat-value">{{ currentTask.progress }}/{{ currentTask.target }}</div>
          <div class="stat-trend" :class="currentTask.completed ? 'up' : ''">
            {{ currentTask.completed ? '已完成！奖励 +50 积分' : '进行中' }}
          </div>
        </div>
      </el-card>
    </div>

    <!-- 好友列表与互动 -->
    <el-card class="friends-card">
      <template v-slot:header>
        <h3 class="card-header-title">好友列表</h3>
      </template>
      <div class="table-container">
        <el-table :data="friends" border class="friend-table" fit>
          <el-table-column prop="name" label="好友名称" min-width="110">
            <template #default="scope">
              <div class="friend-name">
                <el-avatar :size="32" class="friend-avatar-sm">
                  {{ scope.row.name?.charAt(0) || '?' }}
                </el-avatar>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 互动频率列 -->
          <el-table-column label="互动频率" min-width="180">
            <template #default="scope">
              <div class="frequency-indicator">
                <div
                  class="frequency-bar"
                  :style="{
                    width: scope.row.frequency + '%',
                    backgroundColor: getFrequencyColor(scope.row.frequency),
                  }"
                ></div>
                <span class="frequency-text">{{ getFrequencyText(scope.row.frequency) }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 互动积分列 -->
          <el-table-column label="互动积分" min-width="90">
            <template #default="scope">
              <div class="points-container">
                <span class="points-icon">⭐</span>
                <span class="points-value">{{ scope.row.points || 0 }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="lastInteraction" label="最近互动" min-width="100">
            <template #default="scope">
              {{ formatDate(scope.row.lastInteraction) }}
            </template>
          </el-table-column>
          <el-table-column label="共同打卡" min-width="90">
            <template #default="scope">
              <span class="common-checkins">{{ scope.row.commonCheckins }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="420">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button size="small" class="msg-btn" @click="sendMessage(scope.row.id)"
                  >发消息</el-button
                >
                <el-button
                  size="small"
                  type="text"
                  class="profile-btn"
                  @click="viewProfile(scope.row.id)"
                  >查看资料</el-button
                >
                <el-button size="small" class="checkin-btn" @click="commonCheckin(scope.row.id)"
                  >共同打卡</el-button
                >
                <el-button
                  size="small"
                  type="text"
                  class="delete-btn"
                  @click="deleteFriend(scope.row.id)"
                >
                  删除好友
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 积分兑换中心弹窗 -->
    <el-dialog
      v-model="showRewardCenter"
      title="积分兑换中心"
      :width="isMobile ? '90%' : '600px'"
      class="reward-center-modal"
      :close-on-click-modal="false"
    >
      <div class="reward-center-header">
        <div class="user-points">
          我的积分: <span class="points-value">{{ userSelfPoints }} ⭐</span>
        </div>
        <div class="reward-tips">
          <i class="el-icon-info"></i>
          <span>使用积分兑换专属奖励，让互动更有趣！</span>
        </div>
      </div>

      <div class="rewards-grid">
        <!-- 奖励卡片 - 聊天特效 -->
        <el-card
          v-for="reward in availableRewards"
          :key="reward.id"
          :class="['reward-card', hasOwnedReward(reward.id) ? 'owned' : '']"
        >
          <div class="reward-item">
            <div class="reward-icon-large">{{ reward.icon }}</div>
            <div class="reward-info">
              <h4 class="reward-name">{{ reward.name }}</h4>
              <p class="reward-desc">{{ reward.desc }}</p>
            </div>
            <div class="reward-meta">
              <span class="reward-cost"> <i class="el-icon-star-on"></i> {{ reward.cost }} </span>
              <span class="reward-type">{{ reward.type }}</span>
            </div>
            <el-button
              type="primary"
              @click="openExchangeConfirm(reward)"
              :disabled="hasOwnedReward(reward.id) || userSelfPoints < reward.cost"
            >
              {{ hasOwnedReward(reward.id) ? '已拥有' : '兑换' }}
            </el-button>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 修改聊天消息样式，支持特效展示 -->
    <div
      v-for="(msg, idx) in chatMessages"
      :key="idx"
      :class="[
        'chat-message-item',
        msg.sender === 'me' ? 'me' : 'friend',
        msg.effect === 'effect1' ? 'effect-bubble' : '',
        msg.effect === 'effect2' ? 'effect-animation' : '',
      ]"
    >
      <!-- 消息内容保持不变 -->
    </div>
    <!-- 新增：积分排行榜卡片 -->
    <el-card class="ranking-card">
      <template v-slot:header>
        <h3 class="card-header-title">好友积分排行榜</h3>
      </template>
      <div class="ranking-container">
        <!-- 排行榜列表 -->
        <div class="ranking-list">
          <div
            v-for="(item, index) in sortedRanking"
            :key="item.id"
            :class="['ranking-item', getRankingClass(index)]"
          >
            <!-- 排名标识 -->
            <div class="ranking-num">{{ index + 1 }}</div>
            <!-- 好友头像+名称 -->
            <div class="ranking-friend">
              <el-avatar :size="36" class="ranking-avatar">
                {{ item.name?.charAt(0) || '?' }}
              </el-avatar>
              <span class="ranking-friend-name">{{ item.name }}</span>
            </div>
            <!-- 积分 -->
            <div class="ranking-points">
              <span class="points-icon">⭐</span>
              <span class="points-value">{{ item.points || 0 }}</span>
            </div>
          </div>
          <div v-if="sortedRanking.length === 0" class="empty-ranking">
            暂无好友数据，添加好友开始互动吧~
          </div>
        </div>
      </div>
    </el-card>

    <!-- 互动趋势图表 -->
    <el-card class="chart-card">
      <template v-slot:header>
        <h3 class="card-header-title">互动趋势</h3>
      </template>
      <div class="chart-container">
        <canvas id="interactionChart"></canvas>
      </div>
    </el-card>

    <!-- 聊天弹窗 -->
    <el-dialog
      v-model="showChatModal"
      :title="`与 ${currentChatFriend?.name || ''} 聊天`"
      :width="isMobile ? '90%' : '400px'"
      class="chat-modal"
      :close-on-click-modal="false"
    >
      <div class="chat-message-list">
        <div
          v-for="(msg, idx) in chatMessages"
          :key="idx"
          :class="['chat-message-item', msg.sender === 'me' ? 'me' : 'friend']"
        >
          <el-avatar :size="28" v-if="msg.sender === 'friend'" class="chat-avatar">
            {{ currentChatFriend?.name?.charAt(0) || '?' }}
          </el-avatar>
          <span class="chat-content">{{ msg.content }}</span>
          <el-avatar :size="28" v-if="msg.sender === 'me'" class="chat-avatar self-avatar">
            {{ currentUser?.charAt(0) || '我' }}
          </el-avatar>
        </div>
      </div>
      <div class="chat-input-area">
        <el-input
          v-model="inputMessage"
          placeholder="输入消息..."
          @keyup.enter="sendChatMessage"
          class="chat-input"
        ></el-input>
        <el-button type="primary" @click="sendChatMessage" class="send-btn">发送</el-button>
      </div>
    </el-dialog>

    <!-- 好友资料弹窗 -->
    <el-dialog
      v-model="showProfileModal"
      :title="`${currentProfileFriend?.name || '好友'} 的资料`"
      :width="isMobile ? '90%' : '400px'"
      class="profile-modal"
      :close-on-click-modal="false"
    >
      <div class="profile-container">
        <div class="profile-header">
          <el-avatar :size="90" class="profile-avatar">
            {{ currentProfileFriend?.name?.charAt(0) || '?' }}
          </el-avatar>
          <div class="profile-header-info">
            <h3>{{ currentProfileFriend?.name }}</h3>
            <p class="profile-meta">
              互动频率:
              <span
                class="frequency-tag"
                :style="{
                  backgroundColor: getFrequencyColor(currentProfileFriend?.frequency || 0),
                }"
              >
                {{ getFrequencyText(currentProfileFriend?.frequency || 0) }}
              </span>
              <span class="points-display"> 积分: {{ currentProfileFriend?.points || 0 }} ⭐ </span>
            </p>
          </div>
        </div>

        <!-- 徽章展示区 -->
        <div class="badges-container">
          <h4>获得徽章</h4>
          <div class="badge-list">
            <span
              v-for="badge in currentProfileFriend?.badges"
              :key="badge.name"
              class="badge-item"
            >
              {{ badge.icon }} {{ badge.name }}
            </span>
            <span v-if="(currentProfileFriend?.badges || []).length === 0" class="no-badge">
              暂无徽章，多互动可解锁哦~
            </span>
          </div>
        </div>

        <el-divider class="profile-divider"></el-divider>

        <div class="profile-details">
          <div class="profile-detail-item">
            <span class="detail-label">最近互动:</span>
            <span class="detail-value">{{
              formatDate(currentProfileFriend?.lastInteraction)
            }}</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label">共同打卡:</span>
            <span class="detail-value">{{ currentProfileFriend?.commonCheckins }} 次</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label">加入时间:</span>
            <span class="detail-value">{{ formatDate(currentProfileFriend?.joinDate) }}</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label">兴趣标签:</span>
            <div class="tag-group">
              <span v-for="tag in currentProfileFriend?.tags" :key="tag" class="profile-tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 添加好友弹窗 -->
    <el-dialog
      v-model="showAddFriendModal"
      title="添加好友"
      :width="isMobile ? '90%' : '400px'"
      class="add-friend-modal"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFriendFormRef"
        :model="newFriendForm"
        label-width="100px"
        label-position="right"
        class="add-friend-form"
      >
        <el-form-item
          label="好友名称"
          prop="name"
          :rules="[{ required: true, message: '请输入好友名称' }]"
        >
          <el-input
            v-model="newFriendForm.name"
            placeholder="请输入好友名称"
            class="form-input"
          ></el-input>
        </el-form-item>
        <el-form-item label="兴趣标签">
          <el-input
            v-model="newFriendForm.tags"
            placeholder="请输入兴趣标签，用逗号分隔"
            class="form-input"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cancel-btn" @click="showAddFriendModal = false">取消</el-button>
        <el-button type="primary" class="confirm-btn" @click="handleAddFriend">添加</el-button>
      </template>
    </el-dialog>

    <!-- 成就解锁提示弹窗 -->
    <el-dialog
      v-model="showAchievementModal"
      title="🎉 解锁新成就！"
      width="300px"
      :close-on-click-modal="false"
      class="achievement-modal"
    >
      <div class="achievement-content">
        <div class="achievement-icon">{{ newAchievement.icon }}</div>
        <div class="achievement-name">{{ newAchievement.name }}</div>
        <div class="achievement-desc">{{ newAchievement.desc }}</div>
        <div class="achievement-reward">奖励积分: +{{ newAchievement.reward }} ⭐</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showAchievementModal = false">太棒了！</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive, watchEffect } from 'vue'
import {
  ElMessage,
  ElDialog,
  ElButton,
  ElInput,
  ElAvatar,
  ElDivider,
  ElForm,
  ElFormItem,
  ElTable,
  ElTableColumn,
  ElMessageBox,
} from 'element-plus'
import Chart from 'chart.js/auto'

// 判断是否为移动设备
const isMobile = ref(window.innerWidth < 768)
watchEffect(() => {
  const handleResize = () => {
    isMobile.value = window.innerWidth < 768
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
})

// 当前用户名
const currentUser = ref(localStorage.getItem('username') || '我')

// 统计数据
const friendStats = ref({ total: 0, trend: 0 })
const interactionStats = ref({ monthly: 38, trend: 15 })
const commonActivityStats = ref({ count: 5, recent: '周末跑步打卡活动' })

// 本周任务数据
const currentTask = ref({
  target: 5, // 目标互动次数
  progress: 0, // 当前进度
  completed: false, // 是否完成
  reward: 50, // 完成奖励
})

// 好友列表（含积分、徽章、连续互动记录）
const friends = ref([])

// 聊天相关状态
const showChatModal = ref(false)
const currentChatFriend = ref(null)
const inputMessage = ref('')
const chatMessages = ref([])

// 资料弹窗状态
const showProfileModal = ref(false)
const currentProfileFriend = ref(null)

// 添加好友状态
const showAddFriendModal = ref(false)
const addFriendFormRef = ref(null)
const newFriendForm = reactive({ name: '', tags: '' })

// 成就解锁弹窗
const showAchievementModal = ref(false)
const newAchievement = ref({})

// 初始化数据
onMounted(() => {
  loadInteractionStats()
  loadFriends()
  initChart()
  loadTaskProgress()
  checkTaskReset() // 检查任务是否需要周重置
  window.addEventListener('storage', () => {
    userSelfPoints.value = parseInt(localStorage.getItem('userTotalPoints') || '0')
  })
})

// 加载好友数据
const loadFriends = () => {
  const savedFriends = localStorage.getItem('friends')
  if (savedFriends) {
    friends.value = JSON.parse(savedFriends)
  } else {
    // 模拟初始数据（带积分和徽章）
    friends.value = [
      {
        id: '1',
        name: '张三',
        frequency: 85,
        points: 230,
        badges: [
          { name: '互动达人', icon: '🏆', desc: '互动频率超过80%', reward: 50 },
          { name: '默契搭档', icon: '🤝', desc: '共同打卡10次以上', reward: 30 },
        ],
        recentInteractions: [
          new Date('2025-11-18').toISOString(),
          new Date('2025-11-17').toISOString(),
          new Date('2025-11-16').toISOString(),
        ],
        lastInteraction: new Date('2025-11-18').toISOString(),
        commonCheckins: 12,
        joinDate: new Date('2023-01-15').toISOString(),
        tags: ['健身', '阅读', '编程'],
      },
      {
        id: '2',
        name: '李四',
        frequency: 60,
        points: 150,
        badges: [{ name: '新朋友', icon: '👋', desc: '新添加的好友', reward: 20 }],
        recentInteractions: [new Date('2025-11-17').toISOString()],
        lastInteraction: new Date('2025-11-17').toISOString(),
        commonCheckins: 8,
        joinDate: new Date('2023-03-22').toISOString(),
        tags: ['电影', '美食', '旅行'],
      },
      {
        id: '3',
        name: '王五',
        frequency: 30,
        points: 80,
        badges: [],
        recentInteractions: [new Date('2025-11-19').toISOString()],
        lastInteraction: new Date('2025-11-19').toISOString(),
        commonCheckins: 3,
        joinDate: new Date('2023-06-10').toISOString(),
        tags: ['游戏', '音乐', '摄影'],
      },
      {
        id: '4',
        name: '卢汉民',
        frequency: 65,
        points: 160,
        badges: [{ name: '活跃分子', icon: '🔥', desc: '月度互动超过15次', reward: 40 }],
        recentInteractions: [new Date('2025-11-26').toISOString()],
        lastInteraction: new Date('2025-11-26').toISOString(),
        commonCheckins: 2,
        joinDate: new Date('2023-09-05').toISOString(),
        tags: ['运动', '历史'],
      },
      {
        id: '5',
        name: '林育生',
        frequency: 40,
        points: 95,
        badges: [],
        recentInteractions: [new Date('2025-11-27').toISOString()],
        lastInteraction: new Date('2025-11-27').toISOString(),
        commonCheckins: 4,
        joinDate: new Date('2023-10-12').toISOString(),
        tags: ['科技', '户外'],
      },
    ]
    saveFriendsToLocalStorage()
  }
  updateFriendStats()
}

// 保存好友数据到本地存储
const saveFriendsToLocalStorage = () => {
  localStorage.setItem('friends', JSON.stringify(friends.value))
  updateFriendStats()
  updateTaskProgress()
}

// 更新好友统计
const updateFriendStats = () => {
  friendStats.value.total = friends.value.length
}

// 加载任务进度
const loadTaskProgress = () => {
  const savedProgress = localStorage.getItem('interactionTask')
  if (savedProgress) {
    currentTask.value = JSON.parse(savedProgress)
  } else {
    currentTask.value = { target: 5, progress: 0, completed: false, reward: 50 }
    saveTaskProgress()
  }
}

// 保存任务进度
const saveTaskProgress = () => {
  localStorage.setItem('interactionTask', JSON.stringify(currentTask.value))
}

// 更新任务进度
const updateTaskProgress = () => {
  if (!currentTask.value.completed) {
    currentTask.value.progress = Math.min(currentTask.value.progress + 1, currentTask.value.target)
    if (currentTask.value.progress >= currentTask.value.target) {
      currentTask.value.completed = true
      addUserPoints(currentTask.value.reward)
      ElMessage.success(`🎉 完成本周互动任务，获得 ${currentTask.value.reward} 积分奖励！`)
    }
    saveTaskProgress()
  }
}

// 任务周重置检查（每周一0点重置）
const checkTaskReset = () => {
  const lastResetDate = localStorage.getItem('taskLastReset')
  const today = new Date()
  const isMonday = today.getDay() === 1 // 1=周一
  const now = today.getTime()

  // 首次使用或已过一周，重置任务
  if (!lastResetDate || isMonday || now - parseInt(lastResetDate) > 7 * 24 * 60 * 60 * 1000) {
    currentTask.value = { target: 5, progress: 0, completed: false, reward: 50 }
    saveTaskProgress()
    localStorage.setItem('taskLastReset', now.toString())
  }
}

// 用户全局积分
const addUserPoints = (points) => {
  let userPoints = parseInt(localStorage.getItem('userTotalPoints') || '0')
  userPoints += points
  localStorage.setItem('userTotalPoints', userPoints.toString())
}

// 删除好友
const deleteFriend = (friendId) => {
  const friend = friends.value.find((f) => f.id === friendId)
  if (!friend) return

  ElMessageBox.confirm(`确定要删除好友「${friend.name}」吗？`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      friends.value = friends.value.filter((f) => f.id !== friendId)
      saveFriendsToLocalStorage()
      ElMessage.success(`已删除好友「${friend.name}」`)
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 加载互动统计
const loadInteractionStats = () => {
  interactionStats.value = { monthly: 38, trend: 15 }
  commonActivityStats.value = { count: 5, recent: '周末跑步打卡活动' }
}

// 初始化图表
const initChart = () => {
  const ctx = document.getElementById('interactionChart').getContext('2d')

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [
        {
          label: '互动次数',
          data: [12, 19, 15, 20, 25, 38],
          borderColor: '#409eff',
          backgroundColor: 'rgba(64, 158, 255, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#409eff',
        },
        {
          label: '共同打卡',
          data: [5, 8, 6, 10, 12, 15],
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#52c41a',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { cornerRadius: 8 },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
        x: { grid: { display: false } },
      },
    },
  })
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '暂无'
  const date = new Date(dateString)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

// 获取互动频率文本
const getFrequencyText = (value) => {
  if (value >= 80) return '频繁'
  if (value >= 50) return '较多'
  if (value >= 20) return '一般'
  return '较少'
}

// 获取互动频率颜色
const getFrequencyColor = (value) => {
  if (value >= 80) return '#409eff'
  if (value >= 50) return '#52c41a'
  if (value >= 20) return '#faad14'
  return '#f5222d'
}

// 检查并解锁徽章
const checkAndUnlockBadge = (friend, type) => {
  const badges = friend.badges || []
  let newBadge = null

  switch (type) {
    case 'frequency':
      if (friend.frequency >= 80 && !badges.some((b) => b.name === '互动达人')) {
        newBadge = { name: '互动达人', icon: '🏆', desc: '互动频率超过80%', reward: 50 }
      }
      break
    case 'points':
      if (friend.points >= 200 && !badges.some((b) => b.name === '积分达人')) {
        newBadge = { name: '积分达人', icon: '⭐', desc: '互动积分达到200分', reward: 30 }
      }
      break
    case 'checkins':
      if (friend.commonCheckins >= 10 && !badges.some((b) => b.name === '默契搭档')) {
        newBadge = { name: '默契搭档', icon: '🤝', desc: '共同打卡10次以上', reward: 40 }
      }
      if (friend.commonCheckins >= 30 && !badges.some((b) => b.name === '铁杆搭档')) {
        newBadge = { name: '铁杆搭档', icon: '💪', desc: '共同打卡30次以上', reward: 100 }
      }
      break
    case 'continuous': {
      const last3Days = new Date()
      last3Days.setDate(last3Days.getDate() - 3)
      const validInteractions =
        friend.recentInteractions?.filter((date) => new Date(date) >= last3Days) || []
      if (validInteractions.length >= 3 && !badges.some((b) => b.name === '持续互动')) {
        newBadge = { name: '持续互动', icon: '⏳', desc: '连续3天互动', reward: 30 }
      }
      break
    }
  }

  if (newBadge) {
    friend.badges = [...badges, newBadge]
    friend.points = (friend.points || 0) + newBadge.reward
    newAchievement.value = newBadge
    showAchievementModal.value = true
    saveFriendsToLocalStorage()
  }
}

// 发消息功能
const sendMessage = (friendId) => {
  const friend = friends.value.find((f) => f.id === friendId)
  if (!friend) return

  chatMessages.value = [{ sender: 'friend', content: `你好，我是${friend.name}~ 有什么事吗？` }]
  currentChatFriend.value = friend
  showChatModal.value = true
}

// 发送聊天消息
const sendChatMessage = () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  // 添加消息
  chatMessages.value.push({ sender: 'me', content: inputMessage.value.trim() })
  inputMessage.value = ''

  // 更新好友数据
  const friendIndex = friends.value.findIndex((f) => f.id === currentChatFriend.value.id)
  if (friendIndex !== -1) {
    // 增加互动频率
    friends.value[friendIndex].frequency = Math.min(friends.value[friendIndex].frequency + 5, 100)
    // 增加积分
    friends.value[friendIndex].points = (friends.value[friendIndex].points || 0) + 10
    // 更新最近互动记录
    friends.value[friendIndex].recentInteractions = [
      new Date().toISOString(),
      ...(friends.value[friendIndex].recentInteractions || []).slice(0, 2), // 保留最近3条
    ]
    // 更新最近互动时间
    friends.value[friendIndex].lastInteraction = new Date().toISOString()
    // 检查徽章解锁
    checkAndUnlockBadge(friends.value[friendIndex], 'frequency')
    checkAndUnlockBadge(friends.value[friendIndex], 'points')
    checkAndUnlockBadge(friends.value[friendIndex], 'continuous')
    // 保存数据
    saveFriendsToLocalStorage()
    // 更新任务进度
    updateTaskProgress()
  }

  // 滚动到最新消息
  setTimeout(() => {
    const messageList = document.querySelector('.chat-message-list')
    messageList.scrollTop = messageList.scrollHeight
  }, 0)

  // 模拟好友回复
  setTimeout(() => {
    const replies = [
      '好的，我知道了！',
      '哈哈，有意思～',
      '我们改天约着一起打卡吧！',
      '这个主意不错，支持你！',
      '谢谢你告诉我，学到了～',
      '最近新出的活动你参加了吗？',
    ]
    const randomReply = replies[Math.floor(Math.random() * replies.length)]
    chatMessages.value.push({ sender: 'friend', content: randomReply })
    setTimeout(() => {
      const messageList = document.querySelector('.chat-message-list')
      messageList.scrollTop = messageList.scrollHeight
    }, 0)
  }, 1000)
}

// 查看资料功能
const viewProfile = (friendId) => {
  const friend = friends.value.find((f) => f.id === friendId)
  if (friend) {
    currentProfileFriend.value = friend
    showProfileModal.value = true
  }
}

// 添加好友功能
const handleAddFriend = async () => {
  await addFriendFormRef.value.validate((valid) => {
    if (valid) {
      const tagsArray = newFriendForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      // 新好友默认带"新朋友"徽章
      const newFriend = {
        id: Date.now().toString(),
        name: newFriendForm.name,
        frequency: Math.floor(Math.random() * 40) + 10,
        points: 20, // 新好友初始积分
        badges: [{ name: '新朋友', icon: '👋', desc: '新添加的好友', reward: 20 }],
        recentInteractions: [new Date().toISOString()],
        lastInteraction: new Date().toISOString(),
        commonCheckins: Math.floor(Math.random() * 5),
        joinDate: new Date().toISOString(),
        tags: tagsArray.length > 0 ? tagsArray : ['未设置'],
      }

      friends.value.push(newFriend)
      saveFriendsToLocalStorage()
      ElMessage.success('好友添加成功！获得20积分奖励~')
      addUserPoints(20)
      showAddFriendModal.value = false
      newFriendForm.name = ''
      newFriendForm.tags = ''
    } else {
      ElMessage.error('请检查输入信息')
      return false
    }
  })
}

// 共同打卡功能
const commonCheckin = (friendId) => {
  const friend = friends.value.find((f) => f.id === friendId)
  if (!friend) return

  // 增加共同打卡次数
  friend.commonCheckins = (friend.commonCheckins || 0) + 1
  // 增加积分（每次打卡+15分）
  friend.points = (friend.points || 0) + 15
  // 更新最近互动记录
  friend.recentInteractions = [
    new Date().toISOString(),
    ...(friend.recentInteractions || []).slice(0, 2),
  ]
  // 更新最近互动时间
  friend.lastInteraction = new Date().toISOString()
  // 检查"默契搭档"/"铁杆搭档"徽章
  checkAndUnlockBadge(friend, 'checkins')
  checkAndUnlockBadge(friend, 'continuous')
  // 更新任务进度
  updateTaskProgress()
  // 保存数据
  saveFriendsToLocalStorage()
  ElMessage.success(`与${friend.name}共同打卡成功，获得15积分！`)
  addUserPoints(15)
}

// 新增：获取当前用户自己的积分
const userSelfPoints = ref(parseInt(localStorage.getItem('userTotalPoints') || '0'))

// 新增：计算积分排行榜（自己+好友一起排名，按积分降序）
const sortedRanking = ref([])

// 监听好友数据/自己积分变化，实时更新排行榜
watchEffect(() => {
  // 1. 同步自己的最新积分
  userSelfPoints.value = parseInt(localStorage.getItem('userTotalPoints') || '0')

  // 2. 构建自己的排名条目（id设为特殊值避免冲突）
  const selfItem = {
    id: 'user-self',
    name: currentUser.value,
    points: userSelfPoints.value,
    isSelf: true, // 标记为当前用户自己
  }

  // 3. 合并自己和好友数据（过滤重复id，防止冲突）
  const allRankingData = [selfItem, ...friends.value.filter((friend) => friend.id !== 'user-self')]

  // 4. 按积分降序排序（积分相同则自己优先）
  sortedRanking.value = allRankingData.sort((a, b) => {
    const pointsDiff = (b.points || 0) - (a.points || 0)
    if (pointsDiff !== 0) return pointsDiff
    // 积分相同时，自己排在前面
    return a.isSelf ? -1 : 1
  })
})

// 新增：获取排名样式（前三名特殊样式，自己的条目额外加标识）
const getRankingClass = (index, isSelf) => {
  const baseClass = isSelf ? 'ranking-self' : ''
  if (index === 0) return `${baseClass} ranking-first`
  if (index === 1) return `${baseClass} ranking-second`
  if (index === 2) return `${baseClass} ranking-third`
  return `${baseClass} ranking-other`
}

// 已拥有的奖励
const ownedRewards = ref(JSON.parse(localStorage.getItem('ownedRewards') || '[]'))

// 可兑换的奖励列表
const availableRewards = ref([
  {
    id: 'effect1',
    name: '气泡特效',
    icon: '💬',
    desc: '发送消息时使用彩色气泡背景',
    cost: 100,
    type: '聊天特效',
    preview: '消息框将显示渐变彩色背景',
  },
  {
    id: 'effect2',
    name: '动画特效',
    icon: '✨',
    desc: '消息发送时带有入场动画',
    cost: 150,
    type: '聊天特效',
    preview: '消息出现时将有平滑的动画效果',
  },
  {
    id: 'badge1',
    name: '聊天气泡',
    icon: '🏅',
    desc: '个人资料中显示专属勋章',
    cost: 200,
    type: '虚拟勋章',
    preview: '个人资料页将展示"聊天气泡"勋章',
  },
  {
    id: 'badge2',
    name: '社交达人',
    icon: '🌟',
    desc: '个人资料中显示高级勋章',
    cost: 300,
    type: '虚拟勋章',
    preview: '个人资料页将展示"社交达人"勋章',
  },
])

// 兑换相关状态
const showRewardCenter = ref(false)
const currentReward = ref(null)

// 检查是否已拥有奖励
const hasOwnedReward = (rewardId) => {
  return ownedRewards.value.includes(rewardId)
}

// 打开兑换确认
const openExchangeConfirm = (reward) => {
  if (userSelfPoints.value < reward.cost) {
    ElMessage.warning('积分不足，无法兑换')
    return
  }

  currentReward.value = reward
  ElMessageBox.confirm(
    `确定要花费 ${reward.cost} 积分兑换「${reward.name}」吗？\n${reward.preview}`,
    '兑换确认',
    {
      confirmButtonText: '确认兑换',
      cancelButtonText: '取消',
      type: 'info',
    },
  )
    .then(() => {
      completeExchange(reward)
    })
    .catch(() => {
      currentReward.value = null
    })
}

// 完成兑换
const completeExchange = (reward) => {
  if (!reward) return

  // 扣除积分
  const newPoints = userSelfPoints.value - reward.cost
  userSelfPoints.value = newPoints
  localStorage.setItem('userTotalPoints', newPoints.toString())

  // 标记为已拥有
  ownedRewards.value.push(reward.id)
  localStorage.setItem('ownedRewards', JSON.stringify(ownedRewards.value))

  ElMessage.success(`成功兑换「${reward.name}」！`)
  currentReward.value = null
}
</script>
<style scoped>
/* 全局样式：确保容器填满父元素 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.social-analysis-container {
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  margin: 0 auto;
}

/* 页面头部：自适应布局 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  width: 100%;
  flex-wrap: wrap;
  gap: 15px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.page-header h2::before {
  /* content: '👥';
  font-size: 28px; */
  margin: 0;
  color: #1890ff;
  font-size: 24px;
}

/* 添加好友按钮 */
::v-deep .add-friend-btn {
  background-color: #409eff !important;
  color: #fff !important;
  border-radius: 24px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2) !important;
  transition: all 0.2s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 30px !important;
  height: 44px !important;
  line-height: 44px !important;
  border: none !important;
  min-width: 140px !important;
}

::v-deep .add-friend-btn:hover {
  background-color: #337ecc !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
  transform: translateY(-2px) !important;
}

::v-deep .add-friend-btn:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2) !important;
}

/* 统计卡片：自适应网格布局 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
  width: 100%;
}

.stat-card {
  height: 100%;
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05) !important;
  border: none !important;
  overflow: hidden;
  background: linear-gradient(135deg, #f5fafe 0%, #eaf6fa 100%) !important;
  width: 100%;
}

.stat-item {
  text-align: center;
  padding: 25px 15px;
  position: relative;
  width: 100%;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
  display: inline-block;
}

.friend-icon {
  color: #409eff;
}
.interaction-icon {
  color: #52c41a;
}
.activity-icon {
  color: #faad14;
}

.stat-label {
  color: #666;
  font-size: 15px;
  margin-bottom: 8px;
  display: block;
  font-weight: 500;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #1d2129;
  margin-bottom: 8px;
  line-height: 1.2;
}

.stat-trend {
  font-size: 13px;
  padding: 3px 10px;
  border-radius: 16px;
  display: inline-block;
  font-weight: 500;
}

.stat-trend.up {
  background-color: rgba(82, 196, 26, 0.15);
  color: #52c41a;
}

.stat-trend.down {
  background-color: rgba(245, 34, 45, 0.15);
  color: #f5222d;
}

/* 图表卡片：填满容器 */
.chart-card {
  margin-bottom: 30px;
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05) !important;
  border: none !important;
  padding: 20px;
  width: 100%;
}

.card-header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header-title::before {
  content: '📊';
  font-size: 20px;
}

.chart-container {
  height: 350px;
  width: 100%;
  margin-top: 15px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

/* 好友列表卡片：填满容器 */
.friends-card {
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05) !important;
  border: none !important;
  padding: 20px;
  width: 100%;
}

/* 表格容器：小屏幕横向滚动，大屏自适应 */
.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.friend-table {
  width: 100% !important;
  min-width: 768px; /* 确保小屏幕下有滚动，大屏自动填满 */
}

.el-table__header th {
  background-color: #fafafa !important;
  font-weight: 600 !important;
  color: #1d2129 !important;
  font-size: 14px;
  border-bottom: 1px solid #eee !important;
}

.el-table__body tr {
  background-color: #fff !important;
  transition: background-color 0.2s ease !important;
}

.el-table__body tr:hover {
  background-color: #f5fafe !important;
}

.el-table__body td {
  border-bottom: 1px solid #f5f5f5 !important;
  font-size: 14px;
  color: #333;
  padding: 12px 8px !important;
}

/* 好友名称单元格 */
.friend-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.friend-avatar-sm {
  background-color: #e8f4f8 !important;
  color: #409eff !important;
  font-size: 16px !important;
}

/* 互动频率进度条样式 */
.frequency-indicator {
  position: relative;
  height: 22px;
  width: 100%;
  background-color: #f5f5f5;
  border-radius: 11px;
  overflow: hidden;
}

.frequency-bar {
  height: 100%;
  border-radius: 11px;
  transition: width 0.3s ease;
}

.frequency-text {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  line-height: 22px;
  color: #333;
  font-weight: 500;
}

/* 共同打卡次数 */
.common-checkins {
  display: inline-block;
  background-color: #f0f9fb;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

/* 操作按钮容器：自适应排列 */
.operation-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
}

/* 操作按钮样式 */
.msg-btn {
  background-color: #e8f4f8 !important;
  color: #409eff !important;
  border-color: #d1e9f1 !important;
  border-radius: 6px !important;
  padding: 4px 10px !important;
  flex: 1;
  min-width: 80px;
}

.msg-btn:hover {
  background-color: #d1e9f1 !important;
  border-color: #b3d9e8 !important;
}

.profile-btn {
  color: #faad14 !important;
  flex: 1;
  min-width: 80px;
  text-align: center !important;
}

.profile-btn:hover {
  color: #f59a23 !important;
  text-decoration: underline !important;
}

.delete-btn {
  color: #f5222d !important;
  flex: 1;
  min-width: 80px;
  text-align: center !important;
}

.delete-btn:hover {
  color: #c41d1d !important;
  text-decoration: underline !important;
}

/* 聊天弹窗：自适应宽度 */
.chat-modal {
  border-radius: 12px !important;
  overflow: hidden !important;
  max-width: 95vw !important;
}

.el-dialog__header {
  background-color: #409eff;
  color: #fff !important;
  padding: 16px 20px !important;
  width: 100%;
}

.el-dialog__title {
  color: #fff !important;
  font-size: 16px !important;
  font-weight: 600 !important;
}

.el-dialog__headerbtn .el-icon {
  color: #fff !important;
  font-size: 18px !important;
}

.chat-message-list {
  background-color: #f9f9f9;
  border-radius: 8px;
  height: 350px;
  overflow-y: auto;
  padding: 20px;
  margin-bottom: 15px;
  width: 100%;
}

.chat-message-item {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 85%;
}

.chat-message-item.me {
  margin-left: auto;
  flex-direction: row-reverse;
}

.chat-avatar {
  background-color: #e8f4f8 !important;
  color: #409eff !important;
  font-size: 14px !important;
}

.self-avatar {
  background-color: #409eff !important;
  color: #fff !important;
}

.chat-content {
  max-width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chat-message-item.me .chat-content {
  background-color: #409eff;
  color: white;
  border-top-right-radius: 4px;
}

.chat-message-item.friend .chat-content {
  background-color: #fff;
  color: #333;
  border-top-left-radius: 4px;
}

.chat-input-area {
  display: flex;
  gap: 10px;
  width: 100%;
}

.chat-input {
  flex: 1;
  border-radius: 20px !important;
  padding: 8px 16px !important;
  border-color: #e5e9f2 !important;
  width: 100%;
}

.send-btn {
  border-radius: 20px !important;
  padding: 8px 20px !important;
  background-color: #409eff !important;
  white-space: nowrap;
}

.send-btn:hover {
  background-color: #337ecc !important;
}

/* 资料弹窗：自适应宽度 */
.profile-modal {
  border-radius: 12px !important;
  overflow: hidden !important;
  max-width: 95vw !important;
}

.profile-container {
  padding: 20px;
  width: 100%;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  justify-content: center;
  flex-direction: column;
  width: 100%;
}

.profile-avatar {
  background-color: #409eff !important;
  color: #fff !important;
  font-size: 36px !important;
}

.profile-header-info {
  text-align: center;
  width: 100%;
}

.profile-header-info h3 {
  font-size: 22px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.profile-meta {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.profile-divider {
  margin: 15px 0 !important;
  background-color: #f0f0f0 !important;
  width: 100%;
}

.profile-details {
  margin-top: 10px;
  width: 100%;
}

.profile-detail-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
  width: 100%;
  flex-wrap: wrap;
}

.detail-label {
  width: 80px;
  color: #666;
  font-weight: 500;
  font-size: 14px;
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.tag-group {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-tag {
  display: inline-block;
  background-color: #f0f9fb;
  padding: 4px 10px;
  border-radius: 16px;
  margin-right: 5px;
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}

/* 添加好友弹窗：自适应宽度 */
.add-friend-modal {
  border-radius: 12px !important;
  overflow: hidden !important;
  max-width: 95vw !important;
}

.add-friend-form {
  padding: 10px 0;
  width: 100%;
}

.form-input {
  border-radius: 8px !important;
  border-color: #e5e9f2 !important;
  width: 100%;
}

.el-form-item__label {
  color: #666 !important;
  font-weight: 500 !important;
  font-size: 14px !important;
}

.cancel-btn {
  border-radius: 8px !important;
  color: #666 !important;
  flex: 1;
  margin-right: 10px !important;
}

.confirm-btn {
  border-radius: 8px !important;
  background-color: #409eff !important;
  flex: 1;
  margin-left: 10px !important;
}

.confirm-btn:hover {
  background-color: #337ecc !important;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

/* 响应式调整：适配不同屏幕尺寸 */
@media (max-width: 1200px) {
  .social-analysis-container {
    padding: 25px;
  }

  .stats-grid {
    gap: 20px;
  }
}

@media (max-width: 992px) {
  .page-header h2 {
    font-size: 22px;
  }

  .chart-container {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .social-analysis-container {
    padding: 20px 15px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .page-header {
    gap: 10px;
  }

  .page-header h2 {
    font-size: 20px;
  }

  ::v-deep .add-friend-btn {
    padding: 0 20px !important;
    font-size: 14px !important;
    height: 40px !important;
    line-height: 40px !important;
  }

  .chart-container {
    height: 250px;
    padding: 10px;
  }

  .card-header-title {
    font-size: 16px;
  }

  .el-table__header th,
  .el-table__body td {
    font-size: 13px;
    padding: 10px 6px !important;
  }

  .operation-buttons {
    gap: 5px;
  }

  .msg-btn,
  .profile-btn,
  .delete-btn {
    padding: 3px 6px !important;
    font-size: 11px !important;
    min-width: 70px;
  }

  .chat-message-list {
    height: 300px;
    padding: 15px;
  }

  .profile-detail-item {
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .social-analysis-container {
    padding: 15px 10px;
  }

  .stats-grid {
    gap: 10px;
  }

  .stat-item {
    padding: 20px 10px;
  }

  .stat-value {
    font-size: 30px;
  }

  .chart-container {
    height: 200px;
  }

  .chat-input-area {
    flex-direction: column;
  }

  .send-btn {
    width: 100%;
  }

  .el-dialog__header {
    padding: 12px 16px !important;
  }

  .el-dialog__title {
    font-size: 14px !important;
  }
}
/* 在<style scoped>中添加 */
.checkin-btn {
  background-color: #f0f9fb !important;
  color: #52c41a !important;
  border-color: #d1f2eb !important;
  border-radius: 6px !important;
  padding: 4px 10px !important;
  flex: 1;
  min-width: 80px;
}

.checkin-btn:hover {
  background-color: #d1f2eb !important;
  border-color: #a7e8d4 !important;
}

/* 排行榜卡片样式 */
.ranking-card {
  margin-bottom: 30px;
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05) !important;
  border: none !important;
  padding: 20px;
  width: 100%;
  background-color: #fff !important;
}

.ranking-container {
  width: 100%;
}

/* 排行榜列表 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 15px;
}

/* 排行榜项 */
.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.ranking-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

/* 前三名特殊样式 */
.ranking-first {
  background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%);
  border: 1px solid #ffeeba;
}

.ranking-second {
  background: linear-gradient(135deg, #e8f5e9 0%, #d4edda 100%);
  border: 1px solid #c3e6cb;
}

.ranking-third {
  background: linear-gradient(135deg, #fce4ec 0%, #f8d7da 100%);
  border: 1px solid #f5c6cb;
}

/* 排名数字 */
.ranking-num {
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  border-radius: 50%;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.ranking-first .ranking-num {
  background-color: #ffc107;
}

.ranking-second .ranking-num {
  background-color: #6c757d;
}

.ranking-third .ranking-num {
  background-color: #dc3545;
}

.ranking-other .ranking-num {
  background-color: #409eff;
}

/* 好友信息 */
.ranking-friend {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.ranking-avatar {
  background-color: #e8f4f8 !important;
  color: #409eff !important;
  font-size: 16px !important;
}

.ranking-friend-name {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

/* 积分展示 */
.ranking-points {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.ranking-points .points-icon {
  font-size: 16px;
  color: #faad14;
}

/* 空数据提示 */
.empty-ranking {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

/* 积分兑换按钮 */
::v-deep .reward-center-btn {
  background-color: #faad14 !important;
  color: #fff !important;
  margin-left: 10px !important;
}

/* 奖励中心弹窗样式 */
.reward-center-modal .el-dialog__body {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.reward-center-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.user-points {
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.points-value {
  color: #faad14;
}

.reward-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  background-color: #fffbe6;
  padding: 6px 12px;
  border-radius: 4px;
}

/* 奖励网格布局 */
.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
}

/* 奖励卡片样式 */
.reward-card {
  transition: transform 0.2s;
  border-radius: 8px !important;
  overflow: hidden !important;
}

.reward-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08) !important;
}

.reward-card.owned {
  opacity: 0.7;
}

.reward-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.reward-icon-large {
  font-size: 32px;
  text-align: center;
}

.reward-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reward-name {
  margin: 0;
  font-size: 16px;
  text-align: center;
  font-weight: 600;
}

.reward-desc {
  font-size: 13px;
  color: #666;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.reward-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-top: 4px;
}

.reward-cost {
  color: #faad14;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reward-type {
  color: #666;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 12px;
}

/* 聊天特效样式 */
.effect-bubble .chat-content {
  background: linear-gradient(135deg, #409eff, #722ed1);
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.effect-animation .chat-content {
  animation: floatIn 0.5s ease-out;
}

@keyframes floatIn {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
