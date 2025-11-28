<template>
  <div class="social-analysis-container">
    <div class="page-header">
      <h2>社交分享</h2>
      <el-button
        type="primary"
        icon="Plus"
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
    </div>

    <!-- 互动趋势图表 -->
    <el-card class="chart-card">
      <template v-slot:header>
        <h3 class="card-header-title">互动趋势</h3>
      </template>
      <div class="chart-container">
        <canvas id="interactionChart"></canvas>
      </div>
    </el-card>

    <!-- 好友列表与互动 -->
    <el-card class="friends-card">
      <template v-slot:header>
        <h3 class="card-header-title">好友列表</h3>
      </template>
      <!-- 表格容器：小屏幕横向滚动，大屏自适应 -->
      <div class="table-container">
        <el-table :data="friends" border class="friend-table" fit>
          <el-table-column prop="name" label="好友名称" min-width="140">
            <template #default="scope">
              <div class="friend-name">
                <el-avatar :size="32" class="friend-avatar-sm">
                  {{ scope.row.name?.charAt(0) || '?' }}
                </el-avatar>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 恢复进度条样式的互动频率列 -->
          <el-table-column label="互动频率" min-width="150">
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

          <el-table-column prop="lastInteraction" label="最近互动" min-width="120">
            <template #default="scope">
              {{ formatDate(scope.row.lastInteraction) }}
            </template>
          </el-table-column>
          <el-table-column label="共同打卡" min-width="100">
            <template #default="scope">
              <span class="common-checkins">{{ scope.row.commonCheckins }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="280">
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
            </p>
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

// 判断是否为移动设备（用于响应式适配）
const isMobile = ref(window.innerWidth < 768)
// 监听窗口大小变化，实时更新设备类型
watchEffect(() => {
  const handleResize = () => {
    isMobile.value = window.innerWidth < 768
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
})

// 当前用户名（从本地存储获取）
const currentUser = ref(localStorage.getItem('username') || '我')

// 好友统计数据
const friendStats = ref({
  total: 0,
  trend: 0,
})

// 互动统计数据
const interactionStats = ref({
  monthly: 0,
  trend: 0,
})

// 共同活动统计
const commonActivityStats = ref({
  count: 0,
  recent: '无',
})

// 好友列表
const friends = ref([])

// 聊天功能相关状态
const showChatModal = ref(false)
const currentChatFriend = ref(null)
const inputMessage = ref('')
const chatMessages = ref([])

// 查看资料功能相关状态
const showProfileModal = ref(false)
const currentProfileFriend = ref(null)

// 添加好友功能相关状态
const showAddFriendModal = ref(false)
const addFriendFormRef = ref(null)
const newFriendForm = reactive({
  name: '',
  tags: '',
})

// 初始化数据
onMounted(() => {
  loadFriendStats()
  loadInteractionStats()
  loadFriends()
  initChart()
  isMobile.value = window.innerWidth < 768
})

// 从本地存储加载好友
const loadFriends = () => {
  const savedFriends = localStorage.getItem('friends')
  if (savedFriends) {
    friends.value = JSON.parse(savedFriends)
  } else {
    // 模拟初始数据
    friends.value = [
      {
        id: '1',
        name: '张三',
        frequency: 85,
        lastInteraction: new Date('2025-11-18').toISOString(),
        commonCheckins: 12,
        joinDate: new Date('2023-01-15').toISOString(),
        tags: ['健身', '阅读', '编程'],
      },
      {
        id: '2',
        name: '李四',
        frequency: 60,
        lastInteraction: new Date('2025-11-17').toISOString(),
        commonCheckins: 8,
        joinDate: new Date('2023-03-22').toISOString(),
        tags: ['电影', '美食', '旅行'],
      },
      {
        id: '3',
        name: '王五',
        frequency: 30,
        lastInteraction: new Date('2025-11-19').toISOString(),
        commonCheckins: 3,
        joinDate: new Date('2023-06-10').toISOString(),
        tags: ['游戏', '音乐', '摄影'],
      },
      {
        id: '4',
        name: '卢汉民',
        frequency: 65,
        lastInteraction: new Date('2025-11-26').toISOString(),
        commonCheckins: 2,
        joinDate: new Date('2023-09-05').toISOString(),
        tags: ['运动', '历史'],
      },
      {
        id: '5',
        name: '林育生',
        frequency: 40,
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

// 保存好友到本地存储
const saveFriendsToLocalStorage = () => {
  localStorage.setItem('friends', JSON.stringify(friends.value))
  updateFriendStats()
}

// 更新好友统计信息
const updateFriendStats = () => {
  friendStats.value.total = friends.value.length
}

// 加载好友统计
const loadFriendStats = () => {
  friendStats.value = {
    total: friends.value.length,
    trend: 2,
  }
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
  interactionStats.value = {
    monthly: 38,
    trend: 15,
  }

  commonActivityStats.value = {
    count: 5,
    recent: '周末跑步打卡活动',
  }
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
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: '共同打卡',
          data: [5, 8, 6, 10, 12, 15],
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#52c41a',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 14,
              family: 'Inter, sans-serif',
            },
            padding: 20,
          },
        },
        tooltip: {
          padding: 12,
          boxPadding: 4,
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            padding: 10,
            font: { size: 12 },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            padding: 10,
            font: { size: 12 },
          },
        },
      },
    },
  })
}

// 格式化日期（统一格式：年/月/日）
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

// 根据频率获取对应颜色
const getFrequencyColor = (value) => {
  if (value >= 80) return '#409eff' // 蓝色（频繁）
  if (value >= 50) return '#52c41a' // 绿色（较多）
  if (value >= 20) return '#faad14' // 黄色（一般）
  return '#f5222d' // 红色（较少）
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

  chatMessages.value.push({
    sender: 'me',
    content: inputMessage.value.trim(),
  })

  inputMessage.value = ''
  // 更新互动频率
  const friendIndex = friends.value.findIndex((f) => f.id === currentChatFriend.value.id)
  if (friendIndex !== -1) {
    friends.value[friendIndex].frequency = Math.min(friends.value[friendIndex].frequency + 5, 100)
    saveFriendsToLocalStorage()
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
    chatMessages.value.push({
      sender: 'friend',
      content: randomReply,
    })
    // 滚动到最新消息
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
      // 处理标签
      const tagsArray = newFriendForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      // 创建新好友
      const newFriend = {
        id: Date.now().toString(),
        name: newFriendForm.name,
        frequency: Math.floor(Math.random() * 40) + 10,
        lastInteraction: new Date().toISOString(),
        commonCheckins: Math.floor(Math.random() * 5),
        joinDate: new Date().toISOString(),
        tags: tagsArray.length > 0 ? tagsArray : ['未设置'],
      }

      friends.value.push(newFriend)
      saveFriendsToLocalStorage()

      ElMessage.success('好友添加成功！')
      showAddFriendModal.value = false
      newFriendForm.name = ''
      newFriendForm.tags = ''
    } else {
      ElMessage.error('请检查输入信息')
      return false
    }
  })
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
  color: #1d2129;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.page-header h2::before {
  content: '👥';
  font-size: 28px;
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
</style>
