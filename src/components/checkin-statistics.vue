<template>
  <div class="statistics-container container">
    <h2>打卡数据统计</h2>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="overview-card">
        <div class="card-title">本月打卡次数</div>
        <div class="card-value">{{ monthlyCheckins }}</div>
      </div>
      <div class="overview-card">
        <div class="card-title">平均每周打卡</div>
        <div class="card-value">{{ weeklyAvg.toFixed(1) }} 次</div>
      </div>
      <div class="overview-card">
        <div class="card-title">最常打卡类型</div>
        <div class="card-value">{{ mostFrequentType || '暂无' }}</div>
      </div>
    </div>

    <!-- 打卡趋势图 -->
    <div class="chart-section">
      <h3>近30天打卡趋势</h3>
      <div class="chart-container">
        <v-chart :option="trendOption" autoresize />
      </div>
    </div>

    <!-- 打卡类型分布图 -->
    <div class="chart-section">
      <h3>打卡类型分布</h3>
      <div class="chart-container">
        <v-chart :option="typeDistributionOption" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts' // 整体导入echarts
import VChart from 'vue-echarts' // 导入vue-echarts组件

// 所有打卡记录
const records = ref([])

onMounted(() => {
  const savedRecords = localStorage.getItem('checkinRecords')
  records.value = savedRecords ? JSON.parse(savedRecords) : []
})

// 1. 统计概览数据
// 本月打卡次数
const monthlyCheckins = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  return records.value.filter((item) => {
    const date = new Date(item.time)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length
})

// 平均每周打卡次数
const weeklyAvg = computed(() => {
  if (records.value.length === 0) return 0
  // 计算首条记录到今天的周数
  const firstRecordDate = new Date(records.value[records.value.length - 1].time)
  const now = new Date()
  const daysDiff = Math.ceil((now - firstRecordDate) / (1000 * 60 * 60 * 24))
  const weeks = Math.max(1, daysDiff / 7) // 至少算1周
  return records.value.length / weeks
})

// 最常打卡类型
const mostFrequentType = computed(() => {
  if (records.value.length === 0) return null
  const typeCount = {}
  records.value.forEach((item) => {
    typeCount[item.type] = (typeCount[item.type] || 0) + 1
  })
  return Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0][0]
})

// 2. 近30天打卡趋势图数据
const trendOption = computed(() => {
  // 生成近30天日期
  const dates = []
  const countMap = {}
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString()
    dates.push(dateStr)
    countMap[dateStr] = 0
  }

  // 统计每天打卡次数
  records.value.forEach((item) => {
    const dateStr = new Date(item.time).toLocaleDateString()
    if (countMap[dateStr] !== undefined) {
      countMap[dateStr]++
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        interval: 2, // 每隔2天显示一个标签，避免拥挤
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      interval: 1, // 只显示整数
    },
    series: [
      {
        data: dates.map((date) => countMap[date]),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#1890ff' },
        lineStyle: { color: '#1890ff' },
      },
    ],
  }
})

// 3. 打卡类型分布图数据
const typeDistributionOption = computed(() => {
  const typeCount = {
    学习: 0,
    健身: 0,
    阅读: 0,
    其他: 0,
  }
  records.value.forEach((item) => {
    if (typeCount[item.type] !== undefined) {
      typeCount[item.type]++
    }
  })

  const data = Object.entries(typeCount).map(([name, value]) => ({ name, value }))

  return {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      top: '5%',
      left: 'center',
    },
    series: [
      {
        name: '打卡类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
  }
})
</script>

<style scoped>
.statistics-container {
  padding: 30px 0;
}

.statistics-container h2 {
  color: #1890ff;
  font-size: 24px;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.overview-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.card-title {
  color: #666;
  font-size: 16px;
  margin-bottom: 10px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
}

/* 图表区域 */
.chart-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.chart-section h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
