<template>
  <div class="record-container">
    <h2>打卡记录</h2>

    <!-- 筛选和分页控制区 -->
    <div class="record-controls">
      <div class="filter-group">
        <span class="filter-label">筛选类型：</span>
        <button
          class="filter-btn"
          :class="{ active: activeType === '全部' }"
          @click="activeType = '全部'"
        >
          全部
        </button>
        <!-- 动态加载自定义打卡类型 -->
        <button
          class="filter-btn"
          :class="{ active: activeType === type }"
          @click="activeType = type"
          v-for="type in checkinTypes"
          :key="type"
        >
          {{ type }}
        </button>
      </div>

      <div class="pagination-control">
        <span>每页显示：</span>
        <select v-model="pageSize" @change="handlePageSizeChange">
          <option value="10">10条</option>
          <option value="20">20条</option>
          <option value="50">50条</option>
        </select>
      </div>
    </div>

    <!-- 记录列表容器 -->
    <div class="record-list-container">
      <!-- 打卡记录列表 -->
      <div class="record-list" v-if="filteredRecords.length > 0">
        <div class="record-item" v-for="record in filteredRecords" :key="record.id">
          <!-- 打卡类型标签 -->
          <div class="record-type" :class="getTypeClass(record.type)">
            {{ record.type }}
          </div>

          <!-- 打卡时间 -->
          <div class="record-time">{{ formatTime(record.time) }}</div>

          <!-- 打卡备注（如果有） -->
          <div class="record-note" v-if="record.note">
            <span class="note-label">备注：</span>
            {{ record.note }}
          </div>

          <!-- 操作按钮 -->
          <div class="record-actions">
            <button class="edit-btn" @click="handleEdit(record.id)">编辑</button>
            <button class="delete-btn" @click="handleDelete(record.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div class="empty-state" v-else>
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无符合条件的打卡记录</div>
        <div class="empty-desc">快去添加今天的打卡吧~</div>
      </div>
    </div>

    <!-- 分页组件 -->
    <div class="pagination" v-if="totalPages > 1">
      <button @click="currentPage = currentPage - 1" :disabled="currentPage === 1">上一页</button>
      <span class="page-info"> 第 {{ currentPage }} / {{ totalPages }} 页 </span>
      <button @click="currentPage = currentPage + 1" :disabled="currentPage === totalPages">
        下一页
      </button>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="isEditModalShow" class="modal-mask">
      <div class="modal-content">
        <h4>编辑打卡记录</h4>
        <div class="modal-form-item">
          <label>打卡类型：</label>
          <select v-model="editRecord.type" class="modal-select">
            <option v-for="type in checkinTypes" :key="type">{{ type }}</option>
          </select>
        </div>
        <div class="modal-form-item">
          <label>打卡备注：</label>
          <textarea v-model="editRecord.note" class="modal-textarea" rows="4"></textarea>
        </div>
        <div class="modal-btns">
          <button class="cancel-btn" @click="isEditModalShow = false">取消</button>
          <button class="confirm-btn" @click="confirmEdit">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// 修正Element Plus导入：使用ElMessageBox替代ElConfirm
import { ElMessage, ElMessageBox } from 'element-plus'

// 状态管理
const allRecords = ref([]) // 所有打卡记录
const activeType = ref('全部') // 当前筛选类型
const pageSize = ref(10) // 每页显示条数
const currentPage = ref(1) // 当前页码
const checkinTypes = ref(['学习', '健身', '阅读', '其他']) // 打卡类型
const isEditModalShow = ref(false) // 编辑弹窗状态
const editRecord = ref({}) // 当前编辑的记录

// 加载数据
onMounted(() => {
  // 加载自定义打卡类型
  const savedTypes = localStorage.getItem('checkinTypes')
  if (savedTypes) {
    checkinTypes.value = JSON.parse(savedTypes)
  }

  // 加载所有打卡记录
  const savedRecords = localStorage.getItem('checkinRecords')
  if (savedRecords) {
    allRecords.value = JSON.parse(savedRecords).sort((a, b) => new Date(b.time) - new Date(a.time)) // 按时间倒序
  }
})

// 筛选后的记录（按类型）
const filteredByType = computed(() => {
  if (activeType.value === '全部') {
    return allRecords.value
  }
  return allRecords.value.filter((item) => item.type === activeType.value)
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(filteredByType.value.length / pageSize.value)
})

// 分页后的记录
const filteredRecords = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredByType.value.slice(startIndex, endIndex)
})

// 处理每页显示条数变化
const handlePageSizeChange = () => {
  currentPage.value = 1 // 重置为第一页
}

// 格式化时间显示
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return date.toLocaleString() // 显示完整的日期和时间
}

// 根据类型获取样式类名
const getTypeClass = (type) => {
  const colorMap = {
    学习: 'type-study',
    健身: 'type-sport',
    阅读: 'type-read',
    其他: 'type-other',
  }
  return colorMap[type] || 'type-custom'
}

// 编辑打卡记录
const handleEdit = (recordId) => {
  const record = allRecords.value.find((item) => item.id === recordId)
  if (record) {
    editRecord.value = { ...record } // 复制记录用于编辑
    isEditModalShow.value = true
  }
}

// 确认编辑
const confirmEdit = () => {
  if (!editRecord.value.id) return
  // 更新原记录
  const index = allRecords.value.findIndex((item) => item.id === editRecord.value.id)
  if (index !== -1) {
    allRecords.value[index] = editRecord.value
    localStorage.setItem('checkinRecords', JSON.stringify(allRecords.value))
    ElMessage.success('记录已更新')
    isEditModalShow.value = false
  }
}

// 删除打卡记录（使用ElMessageBox.confirm）
const handleDelete = (recordId) => {
  ElMessageBox.confirm('确定要删除这条打卡记录吗？', '确认删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      // 确认删除
      allRecords.value = allRecords.value.filter((item) => item.id !== recordId)
      localStorage.setItem('checkinRecords', JSON.stringify(allRecords.value))
      ElMessage.success('记录已删除')
    })
    .catch(() => {
      // 取消删除（可选）
      ElMessage.info('已取消删除')
    })
}
</script>

<style scoped>
/* 页面容器 */
.record-container {
  padding: 0;
}

.record-container h2 {
  color: #1890ff;
  font-size: 24px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* 筛选和分页控制区 */
.record-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  color: #666;
  white-space: nowrap;
}

.filter-btn {
  padding: 5px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.filter-btn:hover:not(.active) {
  border-color: #1890ff;
  color: #1890ff;
}

.pagination-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.pagination-control select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 记录列表容器 */
.record-list-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

/* 记录列表 */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.record-item {
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  position: relative;
  transition: box-shadow 0.2s;
}

.record-item:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 类型标签样式 */
.record-type {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 10px;
  color: white;
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

/* 时间和备注 */
.record-time {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.record-note {
  color: #333;
  line-height: 1.6;
  padding: 8px 0;
  border-top: 1px dashed #eee;
  margin-top: 8px;
}

.note-label {
  color: #999;
  font-weight: 500;
}

/* 操作按钮 */
.record-actions {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 10px;
}

.edit-btn {
  padding: 3px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.delete-btn {
  padding: 3px 8px;
  background: #fff1f0;
  color: #ff4d4f;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #ddd;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #ccc;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

.pagination button {
  padding: 5px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  color: #999;
  cursor: not-allowed;
  background: #f5f5f5;
}

.page-info {
  color: #666;
}

/* 编辑弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 300px;
}

.modal-content h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 16px;
}

.modal-form-item {
  margin-bottom: 15px;
}

.modal-form-item label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.modal-select,
.modal-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.modal-textarea {
  resize: vertical;
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 15px;
  background: #eee;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 15px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .record-actions {
    position: static;
    margin-top: 10px;
    justify-content: flex-end;
  }

  .record-controls {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
