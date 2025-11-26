<template>
  <div class="activities-container">
    <div class="page-header">
      <h2>活动参加</h2>
      <!-- 已移除创建活动按钮 -->
    </div>

    <!-- 活动筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索活动名称"
        prefix-icon="Search"
        style="width: 300px"
      ></el-input>
      <el-select v-model="activityStatus" placeholder="活动状态" style="margin-left: 15px">
        <el-option label="全部活动" value="all"></el-option>
        <el-option label="进行中" value="ongoing"></el-option>
        <el-option label="已结束" value="ended"></el-option>
      </el-select>
    </div>

    <!-- 活动列表 -->
    <div class="activities-list">
      <el-card v-for="activity in filteredActivities" :key="activity.id" class="activity-card">
        <div class="activity-header">
          <h3>{{ activity.title }}</h3>
          <span class="activity-status" :class="activity.status">{{
            activity.status === 'ongoing' ? '进行中' : '已结束'
          }}</span>
        </div>
        <div class="activity-info">
          <p>
            <span class="info-label">时间：</span>{{ formatDate(activity.startTime) }} -
            {{ formatDate(activity.endTime) }}
          </p>
          <p><span class="info-label">地点：</span>{{ activity.location }}</p>
          <p><span class="info-label">发起人：</span>{{ activity.organizer }}</p>
          <p>
            <span class="info-label">参与人数：</span>{{ activity.participants.length }}/{{
              activity.maxParticipants
            }}
          </p>
        </div>
        <div class="activity-desc">
          <p>{{ activity.description }}</p>
        </div>
        <div class="activity-actions">
          <el-button
            v-if="activity.status === 'ongoing' && !isParticipant(activity)"
            type="primary"
            @click="joinActivity(activity.id)"
          >
            参加活动
          </el-button>
          <el-button
            v-if="activity.status === 'ongoing' && isParticipant(activity)"
            type="success"
            disabled
          >
            已参加
          </el-button>
          <el-button v-if="activity.status === 'ended'" type="info" disabled>
            活动已结束
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 活动数据
const activities = ref([])
// 搜索和筛选条件
const searchKeyword = ref('')
const activityStatus = ref('all')
// 当前用户
const currentUser = ref(localStorage.getItem('username') || '用户')

// 从本地存储加载活动数据（新增：强制使用新示例数据，清除旧数据）
onMounted(() => {
  // 第一步：清除本地存储的旧活动数据（仅执行一次，之后可注释）
  localStorage.removeItem('activities')

  // 第二步：加载新的示例数据
  const saved = localStorage.getItem('activities')
  if (saved) {
    activities.value = JSON.parse(saved)
  } else {
    // 修正语法错误：maxParticipants: 100（正确写法）
    activities.value = [
      {
        id: '1',
        title: '周末跑步打卡活动',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: '城市中央公园',
        maxParticipants: 30,
        organizer: '管理员',
        participants: ['管理员', '张三'],
        description:
          '每周六早上8点集合，一起跑步锻炼，5公里休闲跑，适合新手入门，欢迎各位健身爱好者参加！',
        status: 'ongoing',
      },
      {
        id: '2',
        title: '月度阅读打卡挑战',
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        location: '线上（微信群分享）',
        maxParticipants: 50,
        organizer: '读书会会长',
        participants: ['读书会会长', '李四', '王五'],
        description:
          '每月共读1本书，每周日晚8点线上分享读后感，本月书籍《人类简史》，需提交至少4次读书笔记。',
        status: 'ongoing',
      },
      {
        id: '3',
        title: '办公室瑜伽放松课',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: '公司1号会议室',
        maxParticipants: 15,
        organizer: '行政部',
        participants: ['行政部', '赵六'],
        description: '每天中午12:30-13:00，专业瑜伽老师指导，缓解久坐疲劳，需自备瑜伽垫。',
        status: 'ongoing',
      },
      {
        id: '4',
        title: '社区公益环保行动',
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: '阳光社区广场',
        maxParticipants: 20,
        organizer: '社区居委会',
        participants: ['社区居委会', '孙七', '周八'],
        description: '清理社区公共区域垃圾，宣传垃圾分类知识，共建美好家园。',
        status: 'ended',
      },
      {
        id: '5',
        title: '30天健身打卡计划',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: '全城连锁健身房',
        maxParticipants: 100, // 已修正：去掉换行，语法正确
        organizer: '健身教练小李',
        participants: ['健身教练小李', '吴九'],
        description: '每天完成30分钟健身训练，教练提供专业计划，打卡满25天可获赠健身包。',
        status: 'ongoing',
      },
    ]
    saveActivities()
  }
})

// 过滤活动列表
const filteredActivities = computed(() => {
  return activities.value.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchesStatus =
      activityStatus.value === 'all' ||
      (activityStatus.value === 'ongoing' && activity.status === 'ongoing') ||
      (activityStatus.value === 'ended' && activity.status === 'ended')
    return matchesSearch && matchesStatus
  })
})

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// 检查是否已参加活动
const isParticipant = (activity) => {
  return activity.participants.includes(currentUser.value)
}

// 参加活动
const joinActivity = (activityId) => {
  const activity = activities.value.find((a) => a.id === activityId)
  if (!activity) return
  if (activity.participants.length >= activity.maxParticipants) {
    ElMessage.warning('活动人数已达上限，无法参加')
    return
  }
  activity.participants.push(currentUser.value)
  saveActivities()
  ElMessage.success('成功参加活动')
}

// 保存活动数据到本地存储
const saveActivities = () => {
  localStorage.setItem('activities', JSON.stringify(activities.value))
}
</script>

<style scoped>
.activities-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  margin-bottom: 20px;
  align-items: center;
}

.activities-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.activity-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.activity-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.activity-status {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.activity-status.ongoing {
  background-color: #52c41a;
}

.activity-status.ended {
  background-color: #faad14;
}

.activity-info {
  margin-bottom: 15px;
  line-height: 1.8;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.activity-desc {
  margin-bottom: 15px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
  color: #666;
}

.activity-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
