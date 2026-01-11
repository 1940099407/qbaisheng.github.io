<template>
  <div class="statistics-page">
    <!-- 页面标题与操作区 -->
    <div class="page-header">
      <h2>数据统计与可视化</h2>
      <div class="header-controls">
        <!-- 时间筛选器 -->
        <el-select
          v-model="timeRange"
          @change="handleTimeRangeChange"
          style="width: 180px; margin-right: 10px"
        >
          <el-option label="近7天" value="7d"></el-option>
          <el-option label="近30天" value="30d"></el-option>
          <el-option label="近90天" value="90d"></el-option>
          <el-option label="全年" value="year"></el-option>
        </el-select>

        <!-- 操作按钮 -->
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
        <el-button @click="exportReport" style="margin-left: 10px">
          <el-icon><Download /></el-icon> 导出报表
        </el-button>
      </div>
    </div>

    <!-- 核心数据指标卡片 -->
    <div class="stats-cards">
      <!-- 总用户数 -->
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-meta">
            <p class="stat-label">总用户数</p>
            <p class="stat-change" :class="totalUsersTrend > 0 ? 'increase' : 'decrease'">
              {{ totalUsersTrend > 0 ? '+' : '' }}{{ totalUsersTrend }}% 较上期
            </p>
          </div>
          <p class="stat-value">{{ totalUsers }}</p>
        </div>
        <div class="stat-icon">👥</div>
      </el-card>

      <!-- 总打卡次数 -->
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-meta">
            <p class="stat-label">总打卡次数</p>
            <p class="stat-change" :class="checkinsTrend > 0 ? 'increase' : 'decrease'">
              {{ checkinsTrend > 0 ? '+' : '' }}{{ checkinsTrend }}% 较上期
            </p>
          </div>
          <p class="stat-value">{{ totalCheckins }}</p>
        </div>
        <div class="stat-icon">✅</div>
      </el-card>

      <!-- 活跃用户数 -->
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-meta">
            <p class="stat-label">活跃用户数</p>
            <p class="stat-change" :class="activeUsersTrend > 0 ? 'increase' : 'decrease'">
              {{ activeUsersTrend > 0 ? '+' : '' }}{{ activeUsersTrend }}% 较上期
            </p>
          </div>
          <p class="stat-value">{{ activeUsers }}</p>
        </div>
        <div class="stat-icon">🔥</div>
      </el-card>

      <!-- 活动参与率 -->
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-meta">
            <p class="stat-label">活动参与率</p>
            <p class="stat-change" :class="participationTrend > 0 ? 'increase' : 'decrease'">
              {{ participationTrend > 0 ? '+' : '' }}{{ participationTrend }}% 较上期
            </p>
          </div>
          <p class="stat-value">{{ participationRate }}%</p>
        </div>
        <div class="stat-icon">📈</div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 用户增长趋势图（折线图） -->
      <el-card class="chart-card">
        <template #header>
          <h3>用户增长趋势</h3>
        </template>
        <div class="chart-container">
          <canvas id="userGrowthChart"></canvas>
        </div>
      </el-card>

      <!-- 打卡类型分布图（饼图） -->
      <el-card class="chart-card">
        <template #header>
          <h3>打卡类型分布</h3>
        </template>
        <div class="chart-container">
          <canvas id="checkinTypeChart"></canvas>
        </div>
      </el-card>

      <!-- 每日活跃用户图（柱状图） -->
      <el-card class="chart-card">
        <template #header>
          <h3>每日活跃用户</h3>
        </template>
        <div class="chart-container">
          <canvas id="dailyActiveChart"></canvas>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import Chart from 'chart.js/auto' // 引入Chart.js

// 时间范围选择
const timeRange = ref('30d')

// 统计数据
const totalUsers = ref(128)
const totalCheckins = ref(3562)
const activeUsers = ref(89)
const participationRate = ref(68.7)

// 趋势数据（较上期变化百分比）
const totalUsersTrend = ref(5.2)
const checkinsTrend = ref(12.8)
const activeUsersTrend = ref(-2.1)
const participationTrend = ref(3.5)

// 图表实例（初始化为null）
let userGrowthChart = null
let checkinTypeChart = null
let dailyActiveChart = null

// 初始化图表（添加实例检查）
const initCharts = () => {
  // 1. 用户增长趋势图（折线图）
  if (userGrowthChart) userGrowthChart.destroy() // 销毁旧实例
  const userGrowthCtx = document.getElementById('userGrowthChart').getContext('2d')
  userGrowthChart = new Chart(userGrowthCtx, {
    type: 'line',
    data: {
      labels: getDateLabels(), // 动态生成日期标签
      datasets: [
        {
          label: '新增用户',
          data: [8, 12, 9, 15, 11, 14, 18, 22, 19, 25], // 模拟近10天数据
          borderColor: '#409eff',
          backgroundColor: 'rgba(64, 158, 255, 0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '用户数' } },
      },
    },
  })

  // 2. 打卡类型分布图（饼图）
  if (checkinTypeChart) checkinTypeChart.destroy() // 销毁旧实例
  const checkinTypeCtx = document.getElementById('checkinTypeChart').getContext('2d')
  checkinTypeChart = new Chart(checkinTypeCtx, {
    type: 'doughnut',
    data: {
      labels: ['学习', '运动', '阅读', '冥想', '其他'],
      datasets: [
        {
          data: [35, 25, 20, 15, 5], // 百分比分布
          backgroundColor: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } },
    },
  })

  // 3. 每日活跃用户图（柱状图）
  if (dailyActiveChart) dailyActiveChart.destroy() // 销毁旧实例
  const dailyActiveCtx = document.getElementById('dailyActiveChart').getContext('2d')
  dailyActiveChart = new Chart(dailyActiveCtx, {
    type: 'bar',
    data: {
      labels: getDateLabels(),
      datasets: [
        {
          label: '活跃用户数',
          data: [45, 52, 49, 63, 58, 72, 65, 78, 69, 82],
          backgroundColor: '#67c23a',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '活跃用户数' } },
      },
    },
  })
}

// 生成日期标签（根据时间范围动态生成）
const getDateLabels = () => {
  const labels = []
  const days = timeRange.value === '7d' ? 7 : timeRange.value === '30d' ? 10 : 12
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    labels.push(`${date.getMonth() + 1}/${date.getDate()}`)
  }
  return labels
}

// 刷新数据
const refreshData = () => {
  // 模拟数据加载
  ElMessage({ message: '数据刷新中...', type: 'info' })

  // 模拟异步请求
  setTimeout(() => {
    // 随机更新部分数据
    activeUsers.value = Math.floor(activeUsers.value * (0.95 + Math.random() * 0.1))
    participationRate.value = (participationRate.value * (0.98 + Math.random() * 0.04)).toFixed(1)

    // 更新图表（带实例检查）
    updateCharts()
    ElNotification({ title: '成功', message: '数据已更新', type: 'success' })
  }, 800)
}

// 更新图表数据（修复空实例访问）
const updateCharts = () => {
  // 检查实例是否存在且数据有效
  if (userGrowthChart && userGrowthChart.data?.datasets) {
    userGrowthChart.data.datasets[0].data = userGrowthChart.data.datasets[0].data.map((val) =>
      Math.floor(val * (0.9 + Math.random() * 0.2)),
    )
    userGrowthChart.update()
  }

  if (dailyActiveChart && dailyActiveChart.data?.datasets) {
    dailyActiveChart.data.datasets[0].data = dailyActiveChart.data.datasets[0].data.map((val) =>
      Math.floor(val * (0.9 + Math.random() * 0.2)),
    )
    dailyActiveChart.update()
  }
}

// 时间范围变化处理（销毁所有实例）
const handleTimeRangeChange = () => {
  // 销毁所有图表实例
  if (userGrowthChart) {
    userGrowthChart.destroy()
    userGrowthChart = null
  }
  if (checkinTypeChart) {
    checkinTypeChart.destroy()
    checkinTypeChart = null
  }
  if (dailyActiveChart) {
    dailyActiveChart.destroy()
    dailyActiveChart = null
  }
  // 重新初始化图表
  initCharts()
}

// 导出报表
const exportReport = () => {
  const data = [
    ['指标', '当前值', '较上期变化'],
    ['总用户数', totalUsers.value, `${totalUsersTrend.value}%`],
    ['总打卡次数', totalCheckins.value, `${checkinsTrend.value}%`],
    ['活跃用户数', activeUsers.value, `${activeUsersTrend.value}%`],
    ['活动参与率', `${participationRate.value}%`, `${participationTrend.value}%`],
  ]
  const csvContent = 'data:text/csv;charset=utf-8,' + data.map((row) => row.join(',')).join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `数据统计报表_${new Date().toLocaleDateString()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('报表导出成功')
}

// 页面加载时初始化
onMounted(() => {
  initCharts()
})

// 组件卸载时彻底销毁图表（防止内存泄漏）
onUnmounted(() => {
  if (userGrowthChart) userGrowthChart.destroy()
  if (checkinTypeChart) checkinTypeChart.destroy()
  if (dailyActiveChart) dailyActiveChart.destroy()
})
</script>

<style scoped>
.statistics-page {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-weight: 600;
}

.header-controls {
  display: flex;
  align-items: center;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  height: 140px;
  overflow: hidden;
}

.stat-content {
  padding: 16px;
}

.stat-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.stat-change {
  font-size: 12px;
  margin: 0;
}

.increase {
  color: #00b42a;
}

.decrease {
  color: #f53f3f;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  color: #1d2129;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: rgba(0, 0, 0, 0.05);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  width: 100%;
  height: calc(100% - 56px); /* 减去标题高度 */
}

/* 响应式调整 */
@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .chart-card {
    height: 300px;
  }
}
</style>
