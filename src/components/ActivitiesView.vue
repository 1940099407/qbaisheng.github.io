<template>
  <div class="activities-container">
    <div class="page-header">
      <h2>活动参加</h2>
    </div>

    <!-- 筛选与排序区（优化布局，合并重复结构） -->
    <div class="filter-sort-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索活动名称/描述"
        prefix-icon="Search"
        style="width: 300px"
      ></el-input>

      <div class="filter-group">
        <el-select v-model="activityStatus" placeholder="活动状态" style="margin-right: 15px">
          <el-option label="全部活动" value="all"></el-option>
          <el-option label="进行中" value="ongoing"></el-option>
          <el-option label="已结束" value="ended"></el-option>
        </el-select>

        <el-select v-model="sortType" placeholder="排序方式" @change="handleSort">
          <el-option label="最新发布" value="newest"></el-option>
          <el-option label="参与人数" value="participants"></el-option>
        </el-select>
      </div>
    </div>

    <!-- 活动标签页（新增「我参与的」） -->
    <el-tabs v-model="activeTab" class="activity-tabs" style="margin: 20px 0">
      <el-tab-pane label="全部活动" name="all"></el-tab-pane>
      <el-tab-pane label="我参与的" name="joined"></el-tab-pane>
      <el-tab-pane label="已结束" name="ended"></el-tab-pane>
    </el-tabs>

    <!-- 活动列表 -->
    <div class="activities-list">
      <el-card
        v-for="activity in filteredSortedActivities"
        :key="activity.id"
        class="activity-card"
        @click="viewDetail(activity)"
      >
        <div class="activity-header">
          <h3 class="activity-title">{{ activity.title }}</h3>
          <span class="activity-status" :class="activity.status">
            {{ activity.status === 'ongoing' ? '进行中' : '已结束' }}
          </span>
        </div>

        <div class="activity-info">
          <p>
            <span class="info-label">时间：</span>{{ formatDate(activity.startTime) }} -
            {{ formatDate(activity.endTime) }}
          </p>
          <p>
            <span class="info-label">参与：</span>{{ activity.participants.length }}/{{
              activity.maxParticipants
            }}
            人
          </p>
          <p><span class="info-label">地点：</span>{{ activity.location }}</p>
        </div>

        <div class="activity-desc">
          <p class="desc-content">{{ activity.description }}</p>
        </div>

        <div class="activity-actions">
          <el-button
            v-if="activity.status === 'ongoing' && !isParticipant(activity)"
            type="primary"
            size="small"
            @click.stop="joinActivity(activity.id)"
          >
            立即参加
          </el-button>
          <el-button
            v-if="activity.status === 'ongoing' && isParticipant(activity)"
            type="success"
            size="small"
            disabled
          >
            已参加
          </el-button>
          <el-button v-if="activity.status === 'ended'" type="info" size="small" disabled>
            活动已结束
          </el-button>
          <el-button type="text" size="small" class="detail-btn" @click.stop="viewDetail(activity)">
            查看详情
          </el-button>
        </div>
      </el-card>

      <!-- 空状态提示 -->
      <div v-if="filteredSortedActivities.length === 0" class="empty-tip">
        <el-empty description="暂无匹配的活动~"></el-empty>
      </div>
    </div>

    <!-- 活动详情弹窗 -->
    <el-dialog v-model="showDetailModal" title="活动详情" width="600px">
      <div v-if="currentActivity" class="detail-content">
        <div class="detail-header">
          <h3>{{ currentActivity.title }}</h3>
          <el-tag :type="currentActivity.status === 'ongoing' ? 'success' : 'warning'">
            {{ currentActivity.status === 'ongoing' ? '进行中' : '已结束' }}
          </el-tag>
        </div>

        <el-divider></el-divider>

        <div class="detail-info">
          <div class="info-item">
            <span class="info-label">活动时间：</span>
            <span
              >{{ formatDate(currentActivity.startTime) }} 至
              {{ formatDate(currentActivity.endTime) }}</span
            >
          </div>
          <div class="info-item">
            <span class="info-label">活动地点：</span>
            <span>{{ currentActivity.location }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发起人：</span>
            <span>{{ currentActivity.organizer }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">参与人数：</span>
            <span
              >{{ currentActivity.participants.length }}/{{
                currentActivity.maxParticipants
              }}
              人</span
            >
          </div>
          <div class="info-item">
            <span class="info-label">已参与用户：</span>
            <span class="participant-tags">
              <el-tag v-for="(user, idx) in currentActivity.participants" :key="idx" size="small">
                {{ user }}
              </el-tag>
            </span>
          </div>
        </div>

        <el-divider></el-divider>

        <div class="detail-desc">
          <h4>活动介绍：</h4>
          <p>{{ currentActivity.description }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
        <el-button
          v-if="currentActivity?.status === 'ongoing' && !isParticipant(currentActivity)"
          type="primary"
          @click="joinActivity(currentActivity.id, true)"
        >
          立即参加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElEmpty } from 'element-plus'

// 活动数据
const activities = ref([])
// 筛选条件
const searchKeyword = ref('')
const activityStatus = ref('all')
const sortType = ref('newest')
const activeTab = ref('all') // 标签页状态
// 当前用户
const currentUser = ref(localStorage.getItem('username') || '')
// 详情弹窗相关
const showDetailModal = ref(false)
const currentActivity = ref(null)

// 初始化加载活动数据
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
        description:
          '每周六早上8点集合，一起跑步锻炼，5公里休闲跑，适合新手入门，欢迎各位健身爱好者参加！跑步过程中请遵守交通规则，注意安全，建议穿着舒适的运动装备和跑鞋。',
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
          '每月共读1本书，每周日晚8点线上分享读后感，本月书籍《人类简史》，需提交至少4次读书笔记。读书笔记要求字数不少于300字，分享时请准备5分钟语音或文字发言。',
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
        description:
          '每天中午12:30-13:00，专业瑜伽老师指导，缓解久坐疲劳，需自备瑜伽垫。课程内容包括基础拉伸、呼吸训练和放松冥想，适合办公室人群，无需瑜伽基础。',
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
        description:
          '清理社区公共区域垃圾，宣传垃圾分类知识，共建美好家园。活动提供手套、垃圾袋等工具，建议穿着舒适耐脏的衣物，活动结束后将颁发公益参与证书。',
        status: 'ended',
      },
      {
        id: '5',
        title: '30天健身打卡计划',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: '全城连锁健身房',
        maxParticipants: 100,
        organizer: '健身教练小李',
        participants: ['健身教练小李', '吴九', currentUser.value], // 默认当前用户已参与
        description:
          '每天完成30分钟健身训练，教练提供专业计划，打卡满25天可获赠健身包。训练内容包括力量训练、有氧运动和柔韧性训练，适合不同健身水平的用户，将建立专属打卡群进行监督。',
        status: 'ongoing',
      },
    ]
    saveActivities()
  }
})

// 保存活动数据到本地存储
const saveActivities = () => {
  localStorage.setItem('activities', JSON.stringify(activities.value))
}

// 筛选+排序后的活动列表（核心逻辑）
const filteredSortedActivities = computed(() => {
  let result = [...activities.value]

  // 1. 标签页筛选
  if (activeTab.value === 'joined') {
    result = result.filter((activity) => activity.participants.includes(currentUser.value))
  } else if (activeTab.value === 'ended') {
    result = result.filter((activity) => activity.status === 'ended')
  }

  // 2. 状态筛选（与标签页联动）
  if (activityStatus.value !== 'all') {
    result = result.filter((activity) => activity.status === activityStatus.value)
  }

  // 3. 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (activity) =>
        activity.title.toLowerCase().includes(keyword) ||
        activity.description.toLowerCase().includes(keyword),
    )
  }

  // 4. 排序处理（实现handleSort绑定的排序逻辑）
  if (sortType.value === 'newest') {
    // 按发布时间倒序（最新在前）
    result.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  } else if (sortType.value === 'participants') {
    // 按参与人数倒序（人数多在前）
    result.sort((a, b) => b.participants.length - a.participants.length)
  }

  return result
})

// 排序触发函数（与el-select绑定）
const handleSort = () => {
  // 依赖computed自动响应，无需额外逻辑
}

// 格式化日期（简化为年月日，更清晰）
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// 检查是否已参与活动
const isParticipant = (activity) => {
  return activity?.participants.includes(currentUser.value)
}

// 参加活动
const joinActivity = (activityId, fromModal = false) => {
  const activity = activities.value.find((a) => a.id === activityId)
  if (!activity) return

  // 人数上限校验
  if (activity.participants.length >= activity.maxParticipants) {
    ElMessage.warning('活动参与人数已达上限，无法参加')
    return
  }

  // 重复参与校验
  if (isParticipant(activity)) {
    ElMessage.info('你已参加该活动，无需重复报名')
    return
  }

  // 执行参与逻辑
  activity.participants.push(currentUser.value)
  saveActivities()
  ElMessage.success('成功参加活动！')

  // 如果从弹窗参加，关闭弹窗
  if (fromModal) {
    showDetailModal.value = false
  }
}

// 查看活动详情
const viewDetail = (activity) => {
  currentActivity.value = { ...activity }
  showDetailModal.value = true
}
</script>

<style scoped>
.activities-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  color: #333;
  font-weight: 600;
  margin: 0;
}

/* 筛选排序栏优化 */
.filter-sort-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-group {
  display: flex;
  align-items: center;
}

/* 活动标签页 */
.activity-tabs ::v-deep .el-tabs__nav {
  font-size: 14px;
}

/* 活动列表 */
.activities-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.activity-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
}

.activity-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.activity-title {
  font-size: 16px;
  color: #333;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
}

.activity-status.ongoing {
  background-color: #52c41a;
}

.activity-status.ended {
  background-color: #faad14;
}

.activity-info {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.info-label {
  color: #999;
  margin-right: 4px;
}

.activity-desc {
  margin-bottom: 15px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.desc-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.activity-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-btn {
  color: #409eff !important;
  padding: 0 !important;
  font-size: 12px !important;
}

/* 空状态 */
.empty-tip {
  grid-column: 1 / -1;
  padding: 60px 0;
  text-align: center;
}

/* 详情弹窗 */
.detail-content {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.detail-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.detail-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.info-item .info-label {
  width: 80px;
  color: #999;
}

.participant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-desc h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.detail-desc p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .filter-sort-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .el-input {
    width: 100% !important;
  }

  .activities-list {
    grid-template-columns: 1fr;
  }
}
</style>
