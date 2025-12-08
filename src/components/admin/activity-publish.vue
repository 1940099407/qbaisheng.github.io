<template>
  <div class="activity-publish-container">
    <h2>发布新活动</h2>
    <el-card>
      <el-form ref="activityForm" :model="activity" label-width="120px" class="activity-form">
        <!-- 基础信息 -->
        <el-form-item
          label="活动名称"
          prop="name"
          :rules="[
            { required: true, message: '请输入活动名称' },
            { min: 2, max: 50, message: '名称长度2-50字' },
          ]"
        >
          <el-input
            v-model="activity.name"
            placeholder="请输入活动名称（如：周末跑步打卡）"
          ></el-input>
        </el-form-item>

        <el-form-item
          label="活动类型"
          prop="type"
          :rules="[{ required: true, message: '请选择活动类型' }]"
        >
          <el-select v-model="activity.type" placeholder="选择活动类型">
            <el-option label="21天读书挑战" value="reading" />
            <el-option label="月度健身打卡" value="fitness" />
            <el-option label="每日英语学习" value="english" />
            <el-option label="社区志愿服务" value="volunteer" />
            <el-option label="自定义活动" value="custom" />
          </el-select>
        </el-form-item>

        <!-- 时间规则 -->
        <el-form-item label="时间设置" class="section-title">
          <div class="section-divider"></div>
        </el-form-item>

        <el-form-item
          label="活动开始时间"
          prop="startTime"
          :rules="[{ required: true, message: '请选择开始时间' }]"
        >
          <el-date-picker
            v-model="activity.startTime"
            type="datetime"
            placeholder="选择活动开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disablePastDate"
          ></el-date-picker>
        </el-form-item>

        <el-form-item
          label="活动结束时间"
          prop="endTime"
          :rules="[
            { required: true, message: '请选择结束时间' },
            { validator: validateEndTime, trigger: 'change' },
          ]"
        >
          <el-date-picker
            v-model="activity.endTime"
            type="datetime"
            placeholder="选择活动结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="(time) => disableBeforeTime(time, activity.startTime)"
          ></el-date-picker>
        </el-form-item>

        <el-form-item
          label="报名截止时间"
          prop="enrollDeadline"
          :rules="[
            { required: true, message: '请选择截止时间' },
            { validator: validateEnrollDeadline, trigger: 'change' },
          ]"
        >
          <el-date-picker
            v-model="activity.enrollDeadline"
            type="datetime"
            placeholder="选择报名截止时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="
              (time) =>
                disableBeforeTime(time, new Date()) || disableAfterTime(time, activity.startTime)
            "
          ></el-date-picker>
        </el-form-item>

        <!-- 参与规则 -->
        <el-form-item label="参与规则" class="section-title">
          <div class="section-divider"></div>
        </el-form-item>

        <el-form-item
          label="参与人数上限"
          prop="maxParticipants"
          :rules="[
            { required: true, message: '请输入人数上限' },
            { type: 'number', min: 1, message: '至少1人' },
          ]"
        >
          <el-input
            v-model.number="activity.maxParticipants"
            type="number"
            placeholder="填写0表示无上限"
          ></el-input>
        </el-form-item>

        <el-form-item label="是否需要审核">
          <el-switch
            v-model="activity.needReview"
            active-text="需要审核"
            inactive-text="无需审核"
          ></el-switch>
        </el-form-item>

        <el-form-item label="允许重复参与">
          <el-switch
            v-model="activity.allowRepeat"
            active-text="允许"
            inactive-text="不允许"
          ></el-switch>
        </el-form-item>

        <el-form-item label="活动描述" prop="desc">
          <el-input
            type="textarea"
            v-model="activity.desc"
            rows="4"
            placeholder="请输入活动详情（如：活动规则、地点等）"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handlePublish">发布活动</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 活动列表 -->
    <div class="activity-list">
      <h3>已发布活动</h3>
      <el-table :data="publishedActivities" border style="width: 100%" @row-click="handleRowClick">
        <el-table-column prop="name" label="活动名称" width="100"></el-table-column>
        <el-table-column
          prop="type"
          label="活动类型"
          width="140"
          :formatter="formatActivityType"
        ></el-table-column>
        <el-table-column label="活动时间" width="160">
          <template #default="scope">
            {{ scope.row.startTime }} 至<br />{{ scope.row.endTime }}
          </template>
        </el-table-column>
        <el-table-column label="参与情况" width="140">
          <template #default="scope">
            <div>已报名：{{ getEnrollCount(scope.row.id) }}人</div>
            <div>已通过：{{ getApprovedCount(scope.row.id) }}人</div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="160"></el-table-column>
        <el-table-column label="操作" width="400">
          <template #default="scope">
            <el-button size="small" @click="openEnrollList(scope.row.id)">查看报名</el-button>
            <el-button size="small" type="info" @click="viewStatistics(scope.row.id)"
              >数据统计</el-button
            >
            <el-button
              size="small"
              type="warning"
              @click="exportEnrollList(scope.row.id)"
              :disabled="getEnrollCount(scope.row.id) === 0"
              >导出名单</el-button
            >
            <!-- 新增删除按钮 -->
            <el-button size="small" type="danger" @click="deleteActivity(scope.row.id)"
              >删除活动</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 报名者列表弹窗 -->
    <el-dialog title="活动报名者列表" v-model="enrollDialogVisible" width="800px">
      <el-table :data="currentEnrollList" border style="width: 100%">
        <el-table-column prop="userId" label="用户ID" width="120"></el-table-column>
        <el-table-column prop="username" label="用户名" width="120"></el-table-column>
        <el-table-column prop="enrollTime" label="报名时间" width="200"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'approved' ? 'success' : 'warning'">
              {{ scope.row.status === 'approved' ? '已通过' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" v-if="currentActivity.needReview">
          <template #default="scope">
            <el-button
              size="small"
              type="success"
              @click="approveEnroll(scope.row.id)"
              :disabled="scope.row.status === 'approved'"
              >通过</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="rejectEnroll(scope.row.id)"
              :disabled="scope.row.status === 'rejected'"
              >拒绝</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 数据统计弹窗 -->
    <el-dialog title="活动数据统计" v-model="statsDialogVisible" width="600px">
      <div class="stats-container" v-if="currentStats">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-label">总报名人数</div>
              <div class="stat-value">{{ currentStats.totalEnroll }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-label">审核通过人数</div>
              <div class="stat-value">{{ currentStats.approvedCount }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-label">打卡总次数</div>
              <div class="stat-value">{{ currentStats.totalCheckins }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-label">平均完成率</div>
              <div class="stat-value">{{ currentStats.averageCompletion }}%</div>
            </div>
          </el-col>
        </el-row>

        <div v-if="isActivityEnded" class="report-section">
          <h4>活动总结报告</h4>
          <p>活动周期：{{ currentActivity.startTime }} 至 {{ currentActivity.endTime }}</p>
          <p>参与率：{{ currentStats.participationRate }}%</p>
          <p>完成率前三的用户：{{ currentStats.topUsers.join(', ') || '无' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import {
  ElMessageBox,
  ElMessage,
  ElForm,
  ElFormItem,
  ElInput,
  ElDatePicker,
  ElButton,
  ElTable,
  ElTableColumn,
  ElCard,
  ElSwitch,
  ElDialog,
  ElTag,
  ElRow,
  ElCol,
} from 'element-plus'

// 活动类型映射
const activityTypeMap = {
  reading: '21天读书挑战',
  fitness: '月度健身打卡',
  english: '每日英语学习',
  volunteer: '社区志愿服务',
  custom: '自定义活动',
}

// 活动表单数据
const activity = ref({
  name: '',
  type: '',
  startTime: '',
  endTime: '',
  enrollDeadline: '',
  maxParticipants: 0, // 0表示无上限
  needReview: true,
  allowRepeat: false,
  desc: '',
})

// 已发布活动列表
const publishedActivities = ref([])
// 报名数据存储 (key: 活动ID, value: 报名列表)
const enrollData = ref({})
// 打卡数据存储 (key: 活动ID, value: 打卡记录)
const checkinData = ref({})

// 表单引用
const activityForm = ref(null)

// 弹窗状态
const enrollDialogVisible = ref(false)
const statsDialogVisible = ref(false)
const currentEnrollList = ref([])
const currentActivity = ref(null)
const currentStats = ref(null)
const isActivityEnded = ref(false)

// 初始化：从本地存储加载数据
onMounted(() => {
  const savedActivities = localStorage.getItem('adminActivities')
  const savedEnrolls = localStorage.getItem('activityEnrolls')
  const savedCheckins = localStorage.getItem('activityCheckins')

  if (savedActivities) publishedActivities.value = JSON.parse(savedActivities)
  if (savedEnrolls) enrollData.value = JSON.parse(savedEnrolls)
  if (savedCheckins) checkinData.value = JSON.parse(savedCheckins)
})

// 时间验证工具函数
const disablePastDate = (time) => {
  return time.getTime() < Date.now() - 86400000 // 禁止选择昨天及之前
}

const disableBeforeTime = (time, targetTime) => {
  if (!targetTime) return false
  return time.getTime() < new Date(targetTime).getTime() - 86400000
}

const disableAfterTime = (time, targetTime) => {
  if (!targetTime) return false
  return time.getTime() > new Date(targetTime).getTime()
}

// 表单验证规则
const validateEndTime = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请选择结束时间'))
    return
  }
  if (new Date(value).getTime() <= new Date(activity.value.startTime).getTime()) {
    callback(new Error('结束时间必须晚于开始时间'))
    return
  }
  callback()
}

const validateEnrollDeadline = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请选择报名截止时间'))
    return
  }
  if (new Date(value).getTime() >= new Date(activity.value.startTime).getTime()) {
    callback(new Error('报名截止时间必须早于活动开始时间'))
    return
  }
  callback()
}

// 发布活动
const handlePublish = () => {
  activityForm.value.validate((valid) => {
    if (valid) {
      // 创建活动对象
      const newActivity = {
        id: Date.now().toString(),
        ...activity.value,
        createTime: new Date().toLocaleString(),
        checkinCount: 0, // 初始化打卡次数
      }

      // 添加到列表并保存
      publishedActivities.value.unshift(newActivity)
      syncDataToStorage()
      resetForm()
      ElMessage.success('活动发布成功！')
    }
  })
}

// 重置表单
const resetForm = () => {
  activityForm.value.resetFields()
}

// 数据同步到本地存储
const syncDataToStorage = () => {
  localStorage.setItem('adminActivities', JSON.stringify(publishedActivities.value))
  localStorage.setItem('activityEnrolls', JSON.stringify(enrollData.value))
  localStorage.setItem('activityCheckins', JSON.stringify(checkinData.value))
}

// 活动列表辅助函数
const formatActivityType = (row) => {
  return activityTypeMap[row.type] || '未知类型'
}

const getEnrollCount = (activityId) => {
  return enrollData.value[activityId]?.length || 0
}

const getApprovedCount = (activityId) => {
  return enrollData.value[activityId]?.filter((item) => item.status === 'approved').length || 0
}

// 行点击事件
const handleRowClick = (row) => {
  currentActivity.value = row
  isActivityEnded.value = new Date(row.endTime).getTime() < Date.now()
}

// 查看报名列表
const openEnrollList = (activityId) => {
  currentActivity.value = publishedActivities.value.find((item) => item.id === activityId)
  currentEnrollList.value = enrollData.value[activityId] || []
  enrollDialogVisible.value = true
}

// 审核报名
const approveEnroll = (enrollId) => {
  const index = currentEnrollList.value.findIndex((item) => item.id === enrollId)
  if (index !== -1) {
    currentEnrollList.value[index].status = 'approved'
    enrollData.value[currentActivity.value.id] = [...currentEnrollList.value]
    syncDataToStorage()
    ElMessage.success('已通过审核')
  }
}

const rejectEnroll = (enrollId) => {
  const index = currentEnrollList.value.findIndex((item) => item.id === enrollId)
  if (index !== -1) {
    currentEnrollList.value[index].status = 'rejected'
    enrollData.value[currentActivity.value.id] = [...currentEnrollList.value]
    syncDataToStorage()
    ElMessage.success('已拒绝报名')
  }
}

// 查看数据统计
const viewStatistics = (activityId) => {
  currentActivity.value = publishedActivities.value.find((item) => item.id === activityId)
  isActivityEnded.value = new Date(currentActivity.value.endTime).getTime() < Date.now()

  // 计算统计数据
  const enrollList = enrollData.value[activityId] || []
  const checkins = checkinData.value[activityId] || []

  const approvedCount = enrollList.filter((item) => item.status === 'approved').length
  const totalCheckins = checkins.length

  // 计算完成率（简化逻辑：假设每人需打卡10次）
  const userCheckinCount = {}
  checkins.forEach((checkin) => {
    userCheckinCount[checkin.userId] = (userCheckinCount[checkin.userId] || 0) + 1
  })

  const completionRates = Object.values(userCheckinCount).map((count) => (count / 10) * 100)
  const averageCompletion = completionRates.length
    ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
    : 0

  // 参与率
  const maxParticipants = currentActivity.value.maxParticipants || enrollList.length
  const participationRate =
    maxParticipants > 0 ? Math.round((approvedCount / maxParticipants) * 100) : 0

  // 完成率前三用户
  const userRanking = Object.entries(userCheckinCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([userId]) => {
      const user = enrollList.find((item) => item.userId === userId)
      return user?.username || userId
    })

  currentStats.value = {
    totalEnroll: enrollList.length,
    approvedCount,
    totalCheckins,
    averageCompletion,
    participationRate,
    topUsers: userRanking,
  }

  statsDialogVisible.value = true
}

// 导出报名名单
const exportEnrollList = (activityId) => {
  const enrollList = enrollData.value[activityId] || []
  if (enrollList.length === 0) {
    ElMessage.warning('暂无报名数据可导出')
    return
  }

  // 构建CSV内容
  const headers = '用户ID,用户名,报名时间,状态\n'
  const rows = enrollList
    .map((item) => {
      const statusText =
        item.status === 'approved' ? '已通过' : item.status === 'rejected' ? '已拒绝' : '待审核'
      return `${item.userId},${item.username},${item.enrollTime},${statusText}\n`
    })
    .join('')

  const csvContent = headers + rows
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  // 创建下载链接
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `活动${activityId}_报名名单.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 删除活动函数（移到exportEnrollList外部，作为顶层函数）
const deleteActivity = (activityId) => {
  // 显示确认对话框
  ElMessageBox.confirm(
    '确定要删除该活动吗？删除后将清除所有相关报名和打卡数据，且不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'danger',
    },
  )
    .then(() => {
      // 1. 删除活动列表中的活动
      publishedActivities.value = publishedActivities.value.filter((item) => item.id !== activityId)

      // 2. 删除关联的报名数据
      delete enrollData.value[activityId]

      // 3. 删除关联的打卡数据
      delete checkinData.value[activityId]

      // 4. 同步到本地存储
      syncDataToStorage()

      // 5. 关闭可能打开的弹窗
      if (enrollDialogVisible.value) enrollDialogVisible.value = false
      if (statsDialogVisible.value) statsDialogVisible.value = false

      ElMessage.success('活动已成功删除')
    })
    .catch(() => {
      // 取消删除时的回调（可选）
      ElMessage.info('已取消删除')
    })
}
</script>
<style scoped>
.activity-publish-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h2,
h3 {
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

h4 {
  margin: 15px 0;
  color: #444;
  font-weight: 500;
}

/* 表单样式 */
.activity-form {
  margin-top: 15px;
}

.el-form-item {
  margin-bottom: 18px;
}

/* 分区标题样式 */
.section-title {
  margin-top: 20px;
  margin-bottom: 10px;
}

.section-title .el-form-item__label {
  color: #1890ff;
  font-weight: 500;
}

.section-divider {
  height: 1px;
  background-color: #e8e8e8;
  margin-top: 5px;
  width: 100%; /* 铺满父容器宽度 */
  margin-left: 0; /* 取消左侧偏移，让线从最左边开始 */
}

/* 活动列表样式 */
.activity-list {
  margin-top: 30px;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.el-table {
  margin-top: 10px;
}

.el-table th {
  background-color: #fafafa;
}

/* 弹窗样式 */
.el-dialog__body {
  max-height: 500px;
  overflow-y: auto;
  padding: 20px;
}

/* 统计卡片样式 */
.stats-container {
  margin-top: 10px;
}

.stat-card {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  text-align: center;
  height: 100%;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

/* 报告区域样式 */
.report-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e8e8e8;
}

.report-section p {
  margin: 8px 0;
  color: #555;
  line-height: 1.6;
}

/* 按钮样式调整 */
.el-button + .el-button {
  margin-left: 10px;
}

.el-button--small {
  padding: 4px 12px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .activity-publish-container {
    padding: 10px;
  }

  .section-divider {
    width: 100%;
    margin-left: 0;
  }

  .el-dialog {
    width: 90% !important;
  }

  .stat-card {
    margin-bottom: 15px;
  }
}
</style>
