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
            <div class="note-content" v-html="formatRecordNote(record.note)"></div>
          </div>

          <!-- 记录中的媒体文件 -->
          <div class="record-media" v-if="record.media && record.media.length > 0">
            <div class="media-label">附件：</div>
            <div class="media-files">
              <div v-for="(file, index) in record.media" :key="index" class="media-item">
                <template v-if="file.type.startsWith('image/')">
                  <img
                    :src="file.url"
                    class="media-thumbnail"
                    :alt="'图片 ' + (index + 1)"
                    @click="openMediaViewer(record.media, index)"
                  />
                </template>
                <template v-else-if="file.type.startsWith('video/')">
                  <video
                    :src="file.url"
                    class="media-thumbnail"
                    controls
                    @click="openMediaViewer(record.media, index)"
                  ></video>
                </template>
              </div>
            </div>
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

        <!-- 编辑时显示媒体文件 -->
        <div class="modal-form-item" v-if="editRecord.media && editRecord.media.length > 0">
          <label>媒体文件：</label>
          <div class="media-files">
            <div v-for="(file, index) in editRecord.media" :key="index" class="media-item">
              <template v-if="file.type.startsWith('image/')">
                <img
                  :src="file.url"
                  class="media-thumbnail"
                  :alt="'图片 ' + (index + 1)"
                  @click="openMediaViewer(editRecord.media, index)"
                />
              </template>
              <template v-else-if="file.type.startsWith('video/')">
                <video
                  :src="file.url"
                  class="media-thumbnail"
                  controls
                  @click="openMediaViewer(editRecord.media, index)"
                ></video>
              </template>
            </div>
          </div>
        </div>

        <div class="modal-btns">
          <button class="cancel-btn" @click="isEditModalShow = false">取消</button>
          <button class="confirm-btn" @click="confirmEdit">确认</button>
        </div>
      </div>
    </div>

    <!-- 媒体查看器弹窗 -->
    <el-dialog
      title="查看媒体"
      v-model="showMediaViewer"
      width="90%"
      :close-on-click-modal="true"
      :fullscreen="isFullscreen"
    >
      <div class="media-viewer-container">
        <!-- 图片查看器 -->
        <div v-if="currentMedia.type.startsWith('image/')" class="image-viewer">
          <img :src="currentMedia.url" class="full-image" :alt="currentMedia.name" />
        </div>

        <!-- 视频查看器 -->
        <div v-else-if="currentMedia.type.startsWith('video/')" class="video-viewer">
          <video :src="currentMedia.url" class="full-video" controls></video>
        </div>
      </div>

      <template #footer>
        <div class="viewer-controls">
          <span class="media-info"> {{ currentMediaIndex + 1 }} / {{ mediaList.length }} </span>

          <div class="nav-buttons">
            <el-button @click="prevMedia" :disabled="currentMediaIndex === 0" size="small">
              上一个
            </el-button>
            <el-button
              @click="nextMedia"
              :disabled="currentMediaIndex === mediaList.length - 1"
              size="small"
            >
              下一个
            </el-button>
          </div>

          <el-button @click="isFullscreen = !isFullscreen" size="small">
            {{ isFullscreen ? '退出全屏' : '全屏查看' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElDialog, ElButton } from 'element-plus'

// 状态管理
const allRecords = ref([]) // 所有打卡记录
const activeType = ref('全部') // 当前筛选类型
const pageSize = ref(10) // 每页显示条数
const currentPage = ref(1) // 当前页码
const checkinTypes = ref(['学习', '健身', '阅读', '其他']) // 打卡类型
const isEditModalShow = ref(false) // 编辑弹窗状态
const editRecord = ref({}) // 当前编辑的记录

// 媒体查看器相关状态
const showMediaViewer = ref(false)
const mediaList = ref([])
const currentMediaIndex = ref(0)
const currentMedia = ref(null)
const isFullscreen = ref(false)

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
    工作: 'type-work',
    冥想: 'type-meditation',
  }
  return colorMap[type] || 'type-custom'
}

// 格式化记录中的备注（支持话题和链接）
const formatRecordNote = (text) => {
  if (!text) return ''
  let formatted = text
  // 话题高亮（#xxx）
  formatted = formatted.replace(/#([^#\s]+)/g, '<span class="topic">#$1</span>')
  // 链接识别（http://xxx）
  formatted = formatted.replace(
    /https?:\/\/[^\s]+/g,
    '<a href="$&" target="_blank" class="link">$&</a>',
  )
  return formatted
}

// 打开媒体查看器
const openMediaViewer = (files, index) => {
  mediaList.value = files
  currentMediaIndex.value = index
  currentMedia.value = files[index]
  showMediaViewer.value = true
  isFullscreen.value = false
}

// 查看上一个媒体
const prevMedia = () => {
  if (currentMediaIndex.value > 0) {
    currentMediaIndex.value--
    currentMedia.value = mediaList.value[currentMediaIndex.value]
  }
}

// 查看下一个媒体
const nextMedia = () => {
  if (currentMediaIndex.value < mediaList.value.length - 1) {
    currentMediaIndex.value++
    currentMedia.value = mediaList.value[currentMediaIndex.value]
  }
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

// 删除打卡记录
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
      // 取消删除
      ElMessage.info('已取消删除')
    })
}
</script>

<style scoped>
/* 页面容器 */
.record-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
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
.type-work {
  background: #096dd9;
}
.type-meditation {
  background: #f5222d;
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

.note-content {
  margin-top: 5px;
}

.topic {
  color: #1890ff;
  font-weight: 500;
}

.link {
  color: #722ed1;
  text-decoration: underline;
}

/* 媒体文件样式 */
.record-media {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #f0f0f0;
}

.media-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.media-files {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.media-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  cursor: pointer;
}

.media-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  width: 500px;
  max-width: 90%;
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
  min-height: 100px;
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

/* 媒体查看器样式 */
.media-viewer-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.image-viewer {
  width: 100%;
  text-align: center;
}

.full-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
}

.video-viewer {
  width: 100%;
  text-align: center;
}

.full-video {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 4px;
}

.viewer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.media-info {
  color: #666;
  font-size: 14px;
}

.nav-buttons {
  display: flex;
  gap: 10px;
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
