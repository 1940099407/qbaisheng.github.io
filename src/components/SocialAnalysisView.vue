<template>
  <div class="social-analysis-container">
    <div class="page-header">
      <h2>社交分析</h2>
      <el-button type="primary" icon="Plus" @click="showAddFriendModal = true">
        添加好友
      </el-button>
    </div>

    <div class="stats-grid">
      <!-- 好友数量统计 -->
      <el-card class="stat-card">
        <div class="stat-item">
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
          <div class="stat-label">共同活动</div>
          <div class="stat-value">{{ commonActivityStats.count }}</div>
          <div class="stat-trend">最近: {{ commonActivityStats.recent }}</div>
        </div>
      </el-card>
    </div>

    <!-- 互动趋势图表 -->
    <el-card class="chart-card">
      <template v-slot:header>
        <h3>互动趋势</h3>
      </template>
      <div class="chart-container">
        <canvas id="interactionChart"></canvas>
      </div>
    </el-card>

    <!-- 好友列表与互动 -->
    <el-card class="friends-card">
      <template v-slot:header>
        <h3>好友列表</h3>
      </template>
      <el-table :data="friends" border>
        <el-table-column prop="name" label="好友名称" width="150"></el-table-column>
        <el-table-column label="互动频率" width="150">
          <template #default="scope">
            <div class="frequency-indicator">
              <div class="frequency-bar" :style="{ width: scope.row.frequency + '%' }"></div>
              <span class="frequency-text">{{ getFrequencyText(scope.row.frequency) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="lastInteraction" label="最近互动" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.lastInteraction) }}
          </template>
        </el-table-column>
        <el-table-column label="共同打卡" width="120">
          <template #default="scope">{{ scope.row.commonCheckins }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="sendMessage(scope.row.id)">发消息</el-button>
            <el-button size="small" type="text" @click="viewProfile(scope.row.id)"
              >查看资料</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 聊天弹窗 -->
    <el-dialog
      v-model="showChatModal"
      :title="`与 ${currentChatFriend?.name || ''} 聊天`"
      width="400px"
    >
      <div class="chat-message-list" style="height: 300px; overflow-y: auto; padding: 10px">
        <div
          v-for="(msg, idx) in chatMessages"
          :key="idx"
          :class="['chat-message-item', msg.sender === 'me' ? 'me' : 'friend']"
        >
          <span class="chat-content">{{ msg.content }}</span>
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 15px">
        <el-input
          v-model="inputMessage"
          placeholder="输入消息..."
          style="flex: 1"
          @keyup.enter="sendChatMessage"
        ></el-input>
        <el-button type="primary" @click="sendChatMessage">发送</el-button>
      </div>
    </el-dialog>

    <!-- 好友资料弹窗 -->
    <el-dialog
      v-model="showProfileModal"
      :title="`${currentProfileFriend?.name || '好友'} 的资料`"
      width="400px"
    >
      <div class="profile-container">
        <div class="profile-header">
          <el-avatar :size="80" class="profile-avatar">
            {{ currentProfileFriend?.name?.charAt(0) || '?' }}
          </el-avatar>
          <div class="profile-header-info">
            <h3>{{ currentProfileFriend?.name }}</h3>
            <p class="profile-meta">
              <span>互动频率: {{ getFrequencyText(currentProfileFriend?.frequency || 0) }}</span>
            </p>
          </div>
        </div>

        <el-divider></el-divider>

        <div class="profile-details">
          <p><strong>最近互动:</strong> {{ formatDate(currentProfileFriend?.lastInteraction) }}</p>
          <p><strong>共同打卡:</strong> {{ currentProfileFriend?.commonCheckins }} 次</p>
          <p><strong>加入时间:</strong> {{ formatDate(currentProfileFriend?.joinDate) }}</p>
          <p>
            <strong>兴趣标签:</strong>
            <span v-for="tag in currentProfileFriend?.tags" :key="tag" class="profile-tag">
              {{ tag }}
            </span>
          </p>
        </div>
      </div>
    </el-dialog>

    <!-- 添加好友弹窗 -->
    <el-dialog v-model="showAddFriendModal" title="添加好友" width="400px">
      <el-form
        ref="addFriendFormRef"
        :model="newFriendForm"
        label-width="100px"
        label-position="right"
      >
        <el-form-item
          label="好友名称"
          prop="name"
          :rules="[{ required: true, message: '请输入好友名称' }]"
        >
          <el-input v-model="newFriendForm.name" placeholder="请输入好友名称"></el-input>
        </el-form-item>
        <el-form-item label="兴趣标签">
          <el-input
            v-model="newFriendForm.tags"
            placeholder="请输入兴趣标签，用逗号分隔"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFriendModal = false">取消</el-button>
        <el-button type="primary" @click="handleAddFriend">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  ElMessage,
  ElDialog,
  ElButton,
  ElInput,
  ElAvatar,
  ElDivider,
  ElForm,
  ElFormItem,
} from 'element-plus'
import Chart from 'chart.js/auto'

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

// --- 聊天功能相关状态 ---
const showChatModal = ref(false)
const currentChatFriend = ref(null)
const inputMessage = ref('')
const chatMessages = ref([])

// --- 查看资料功能相关状态 ---
const showProfileModal = ref(false)
const currentProfileFriend = ref(null)

// --- 添加好友功能相关状态 ---
const showAddFriendModal = ref(false)
const addFriendFormRef = ref(null)
const newFriendForm = reactive({
  name: '',
  tags: '',
})

// 初始化数据
onMounted(() => {
  // 模拟加载数据
  loadFriendStats()
  loadInteractionStats()
  loadFriends()
  initChart()
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
        lastInteraction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        commonCheckins: 12,
        joinDate: new Date('2023-01-15').toISOString(),
        tags: ['健身', '阅读', '编程'],
      },
      {
        id: '2',
        name: '李四',
        frequency: 60,
        lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        commonCheckins: 8,
        joinDate: new Date('2023-03-22').toISOString(),
        tags: ['电影', '美食', '旅行'],
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
  // 这里可以添加更复杂的统计逻辑，例如计算趋势等
}

// 加载好友统计
const loadFriendStats = () => {
  friendStats.value = {
    total: friends.value.length,
    trend: 2,
  }
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
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: '共同打卡',
          data: [5, 8, 6, 10, 12, 15],
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  })
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '暂无'
  return new Date(dateString).toLocaleDateString()
}

// 获取互动频率文本
const getFrequencyText = (value) => {
  if (value >= 80) return '频繁'
  if (value >= 50) return '较多'
  if (value >= 20) return '一般'
  return '较少'
}

// --- 发消息功能 ---
const sendMessage = (friendId) => {
  const friend = friends.value.find((f) => f.id === friendId)
  if (!friend) return

  chatMessages.value = [{ sender: 'friend', content: `你好，我是${friend.name}~ 有什么事吗？` }]
  currentChatFriend.value = friend
  showChatModal.value = true
}

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

  setTimeout(() => {
    const replies = [
      '好的，我知道了！',
      '哈哈，有意思。',
      '我们改天再聊吧。',
      '这个主意不错！',
      '谢谢你告诉我。',
    ]
    const randomReply = replies[Math.floor(Math.random() * replies.length)]
    chatMessages.value.push({
      sender: 'friend',
      content: randomReply,
    })
  }, 1000)
}

// --- 查看资料功能 ---
const viewProfile = (friendId) => {
  const friend = friends.value.find((f) => f.id === friendId)
  if (friend) {
    currentProfileFriend.value = friend
    showProfileModal.value = true
  }
}

// --- 添加好友功能 ---
const handleAddFriend = async () => {
  await addFriendFormRef.value.validate((valid) => {
    if (valid) {
      // 处理标签，分割成数组
      const tagsArray = newFriendForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      // 创建新好友对象
      const newFriend = {
        id: Date.now().toString(), // 使用时间戳作为唯一ID
        name: newFriendForm.name,
        frequency: Math.floor(Math.random() * 40) + 10, // 随机初始频率
        lastInteraction: new Date().toISOString(),
        commonCheckins: Math.floor(Math.random() * 5), // 随机初始共同打卡次数
        joinDate: new Date().toISOString(),
        tags: tagsArray.length > 0 ? tagsArray : ['未设置'],
      }

      // 添加到好友列表
      friends.value.push(newFriend)

      // 保存到本地存储
      saveFriendsToLocalStorage()

      ElMessage.success('好友添加成功！')

      // 关闭弹窗并重置表单
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
/* ... (原有样式保持不变) ... */
.social-analysis-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-item {
  text-align: center;
  padding: 15px 0;
}

.stat-label {
  color: #666;
  font-size: 16px;
  margin-bottom: 10px;
  display: block;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

.stat-trend {
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.stat-trend.up {
  background-color: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.stat-trend.down {
  background-color: rgba(245, 34, 45, 0.1);
  color: #f5222d;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.friends-card {
  margin-top: 20px;
}

.frequency-indicator {
  position: relative;
  height: 20px;
  width: 100%;
  background-color: #f5f5f5;
  border-radius: 10px;
  overflow: hidden;
}

.frequency-bar {
  height: 100%;
  background-color: #1890ff;
  border-radius: 10px;
  transition: width 0.3s;
}

.frequency-text {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  line-height: 20px;
  color: #333;
}

/* --- 聊天弹窗样式 --- */
.chat-message-list {
  background-color: #f9f9f9;
  border-radius: 4px;
}
.chat-message-item {
  margin-bottom: 10px;
  display: flex;
}
.chat-message-item.me {
  justify-content: flex-end;
}
.chat-message-item.friend {
  justify-content: flex-start;
}
.chat-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  word-wrap: break-word;
}
.chat-message-item.me .chat-content {
  background-color: #1890ff;
  color: white;
}
.chat-message-item.friend .chat-content {
  background-color: #e9e9eb;
  color: #333;
}

/* --- 资料弹窗样式 --- */
.profile-container {
  padding: 10px;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.profile-avatar {
  background-color: #1890ff;
  color: white;
  font-size: 32px;
}
.profile-header-info h3 {
  margin: 0 0 5px 0;
}
.profile-meta {
  color: #666;
  font-size: 14px;
  margin: 0;
}
.profile-details p {
  margin: 8px 0;
  color: #333;
}
.profile-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: 5px;
  font-size: 12px;
  color: #666;
}
</style>
