<template>
  <div class="checkin-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>今日打卡</h2>
      <div class="date-info">{{ todayDate }}</div>
    </div>

    <!-- 连续打卡提示 -->
    <div class="streak-card" v-if="streakCount > 0">
      <div class="streak-icon">🔥</div>
      <div class="streak-content">
        <div class="streak-title">连续打卡</div>
        <div class="streak-desc">{{ streakCount }} 天 · 坚持就是胜利！</div>
      </div>
    </div>

    <!-- 打卡表单卡片 -->
    <div class="checkin-form-card card">
      <h3 class="form-title">添加新打卡</h3>
      <div class="form-item">
        <label class="form-label">打卡类型</label>
        <select v-model="selectedType" class="form-select">
          <option v-for="type in checkinTypes" :key="type">{{ type }}</option>
        </select>
      </div>

      <div class="form-item">
        <label class="form-label">打卡备注</label>
        <textarea
          v-model="note"
          class="form-textarea"
          placeholder="记录今天的收获、时长或感受（可选）..."
          rows="4"
        ></textarea>
      </div>

      <button class="submit-btn" @click="handleSubmit">
        <span class="btn-text">完成打卡</span>
        <span class="btn-icon">✅</span>
      </button>
    </div>

    <!-- 今日打卡记录 -->
    <div class="today-records-section">
      <h3 class="section-title">
        <span class="title-icon">📝</span>
        今日打卡记录
      </h3>

      <div class="records-list">
        <div class="record-item card" v-for="record in todayRecords" :key="record.id">
          <div class="record-header">
            <div class="record-type" :class="getTypeClass(record.type)">
              {{ record.type }}
            </div>
            <div class="record-time">{{ formatTime(record.time) }}</div>
          </div>
          <div class="record-body">
            {{ record.note || '无备注信息' }}
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="todayRecords.length === 0">
          <div class="empty-icon">⏳</div>
          <div class="empty-text">今天还没有打卡记录</div>
          <div class="empty-desc">点击上方按钮添加今日第一次打卡吧~</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 打卡类型（与记录页面同步）
const checkinTypes = ref(['学习', '健身', '阅读', '其他'])
// 表单数据
const selectedType = ref('学习')
const note = ref('')
// 连续打卡天数
const streakCount = ref(3)
// 今日打卡记录
const todayRecords = ref([])

// 格式化今日日期
const todayDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return new Date().toLocaleDateString('zh-CN', options)
})

// 初始化数据
onMounted(() => {
  // 加载自定义打卡类型
  const savedTypes = localStorage.getItem('checkinTypes')
  if (savedTypes) {
    checkinTypes.value = JSON.parse(savedTypes)
  }

  // 加载今日打卡记录
  const savedRecords = localStorage.getItem('checkinRecords') || '[]'
  const allRecords = JSON.parse(savedRecords)
  const today = new Date().toLocaleDateString()

  todayRecords.value = allRecords
    .filter((item) => new Date(item.time).toLocaleDateString() === today)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
})

// 提交打卡
const handleSubmit = () => {
  const newRecord = {
    id: Date.now().toString(),
    type: selectedType.value,
    note: note.value.trim(),
    time: new Date().toISOString(),
  }

  // 保存到本地存储
  const savedRecords = localStorage.getItem('checkinRecords') || '[]'
  const allRecords = JSON.parse(savedRecords)
  allRecords.push(newRecord)
  localStorage.setItem('checkinRecords', JSON.stringify(allRecords))

  // 更新今日记录
  todayRecords.value.unshift(newRecord)
  ElMessage.success('打卡成功！')
  note.value = ''
}

// 格式化时间（仅显示时分秒）
const formatTime = (timeStr) => {
  return new Date(timeStr).toTimeString().slice(0, 8)
}

// 类型样式映射
const getTypeClass = (type) => {
  const map = {
    学习: 'type-study',
    健身: 'type-sport',
    阅读: 'type-read',
    其他: 'type-other',
  }
  return map[type] || 'type-custom'
}
</script>

<style scoped>
/* 核心：减少页面左右空白，与记录页保持一致 */
.checkin-container {
  width: 100%;
  padding: 0; /* 移除默认外间距，利用父容器的padding */
}

/* 页面标题区 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.page-header h2 {
  color: #1890ff;
  font-size: 24px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-info {
  color: #666;
  font-size: 14px;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 16px;
}

/* 连续打卡提示 */
.streak-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff1cc 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  border-left: 4px solid #faad14;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.1);
}

.streak-icon {
  font-size: 28px;
}

.streak-title {
  font-weight: 600;
  color: #fa8c16;
  margin-bottom: 4px;
}

.streak-desc {
  color: #d48806;
  font-size: 14px;
}

/* 通用卡片样式 */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 打卡表单 */
.checkin-form-card {
  margin-bottom: 30px;
}

.form-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.form-item {
  margin-bottom: 22px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: #fff;
  transition: border-color 0.2s;
}

.form-select:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 提交按钮 */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #096dd9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

/* 今日记录区域 */
.today-records-section {
  margin-top: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #333;
  margin: 0 0 18px;
}

.title-icon {
  font-size: 20px;
  color: #1890ff;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 记录项样式 */
.record-item {
  padding: 16px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.type-study {
  background: #1890ff;
}
.type-sport {
  background: #faad14;
}
.type-read {
  background: #52c41a;
}
.type-other {
  background: #722ed1;
}
.type-custom {
  background: #8c8c8c;
}

.record-time {
  color: #999;
  font-size: 13px;
}

.record-body {
  color: #555;
  font-size: 14px;
  line-height: 1.6;
  padding-top: 10px;
  border-top: 1px dashed #f0f0f0;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #eee;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #ccc;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .streak-card {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
}
</style>
