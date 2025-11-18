<template>
  <div class="activities-container">
    <div class="page-header">
      <h2>活动参加</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon> 创建活动
      </el-button>
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

    <!-- 创建活动弹窗 -->
    <el-dialog title="创建新活动" v-model="showCreateDialog" width="600px">
      <el-form ref="activityForm" :model="newActivity" label-width="100px">
        <el-form-item
          label="活动名称"
          prop="title"
          :rules="[{ required: true, message: '请输入活动名称' }]"
        >
          <el-input v-model="newActivity.title"></el-input>
        </el-form-item>
        <el-form-item
          label="开始时间"
          prop="startTime"
          :rules="[{ required: true, message: '请选择开始时间' }]"
        >
          <el-date-picker
            v-model="newActivity.startTime"
            type="datetime"
            placeholder="选择开始时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item
          label="结束时间"
          prop="endTime"
          :rules="[{ required: true, message: '请选择结束时间' }]"
        >
          <el-date-picker
            v-model="newActivity.endTime"
            type="datetime"
            placeholder="选择结束时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item
          label="活动地点"
          prop="location"
          :rules="[{ required: true, message: '请输入活动地点' }]"
        >
          <el-input v-model="newActivity.location"></el-input>
        </el-form-item>
        <el-form-item
          label="最大参与人数"
          prop="maxParticipants"
          :rules="[{ required: true, message: '请输入最大参与人数' }]"
        >
          <el-input v-model="newActivity.maxParticipants" type="number" min="1"></el-input>
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="newActivity.description" type="textarea" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createActivity">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 活动数据
const activities = ref([])
// 搜索和筛选条件
const searchKeyword = ref('')
const activityStatus = ref('all')
// 弹窗状态
const showCreateDialog = ref(false)
// 当前用户
const currentUser = ref(localStorage.getItem('username') || '用户')

// 新活动表单数据
const newActivity = ref({
  title: '',
  startTime: '',
  endTime: '',
  location: '',
  maxParticipants: 20,
  description: '',
  organizer: currentUser.value,
  participants: [],
  status: 'ongoing',
})

// 从本地存储加载活动数据
onMounted(() => {
  const saved = localStorage.getItem('activities')
  if (saved) {
    activities.value = JSON.parse(saved)
  } else {
    // 初始化示例数据
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
        description: '每周六早上8点集合，一起跑步锻炼，欢迎各位健身爱好者参加！',
        status: 'ongoing',
      },
    ]
    saveActivities()
  }
})

// 过滤活动列表
const filteredActivities = computed(() => {
  return activities.value.filter((activity) => {
    // 搜索关键词过滤
    const matchesSearch =
      activity.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchKeyword.value.toLowerCase())

    // 状态过滤
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

// 创建活动
const createActivity = () => {
  // 简单验证
  if (!newActivity.value.title || !newActivity.value.startTime || !newActivity.value.endTime) {
    ElMessage.warning('请完善活动信息')
    return
  }

  // 添加新活动
  activities.value.push({
    ...newActivity.value,
    id: Date.now().toString(),
    status: 'ongoing',
  })

  // 保存数据
  saveActivities()
  // 重置表单
  newActivity.value = {
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: 20,
    description: '',
    organizer: currentUser.value,
    participants: [],
    status: 'ongoing',
  }
  // 关闭弹窗
  showCreateDialog.value = false
  ElMessage.success('活动创建成功')
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
