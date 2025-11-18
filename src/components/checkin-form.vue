<template>
  <div class="checkin-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>今日打卡</h2>
      <div class="date-info">{{ todayDate }}</div>
    </div>

    <!-- 连续打卡提示（动态计算天数） -->
    <div class="streak-card" v-if="streakCount > 0">
      <div class="streak-icon">🔥</div>
      <div class="streak-content">
        <div class="streak-title">连续打卡</div>
        <div class="streak-desc">
          {{ streakCount }} 天 · 坚持就是胜利！
          <span v-if="streakCount >= 7" class="streak-milestone">达成周挑战！</span>
        </div>
      </div>
    </div>

    <!-- 快捷打卡区域 -->
    <div class="quick-checkin" v-if="commonTypes.length > 0">
      <h4>快捷打卡</h4>
      <div class="quick-type-buttons">
        <el-button
          v-for="type in commonTypes"
          :key="type"
          :class="['quick-type-btn', 'type-' + type.toLowerCase()]"
          @click="handleQuickCheckin(type)"
        >
          {{ type }}
        </el-button>
        <!-- 添加自定义类型按钮 -->
        <el-button class="quick-type-btn add-type-btn" @click="showAddTypeDialog = true">
          + 新增类型
        </el-button>
      </div>
    </div>

    <!-- 新增打卡类型弹窗 -->
    <el-dialog
      title="添加打卡类型"
      v-model="showAddTypeDialog"
      width="300px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="newTypeName"
        placeholder="请输入类型名称（如：工作、冥想）"
        @keyup.enter="handleAddType"
      ></el-input>
      <template #footer>
        <el-button @click="showAddTypeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddType">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 打卡表单卡片 -->
    <div class="checkin-form-card card">
      <h3 class="form-title">添加新打卡</h3>
      <div class="form-item">
        <label class="form-label">打卡类型</label>
        <select v-model="selectedType" class="form-select">
          <option v-for="type in checkinTypes" :key="type">{{ type }}</option>
        </select>
      </div>

      <!-- 增强版备注区域 -->
      <div class="form-item">
        <label class="form-label">打卡备注</label>
        <textarea
          v-model="note"
          class="form-textarea"
          placeholder="记录今天的收获、时长或感受（可添加 #话题 或 链接）..."
          rows="4"
          @input="handleNoteInput"
        ></textarea>

        <!-- 备注工具条 -->
        <div class="note-tools">
          <button class="tool-btn" @click="insertTopic" title="添加话题">
            <span>#</span> 话题
          </button>
          <label class="tool-btn file-upload-btn" title="添加照片/视频">
            <span>📷</span> 媒体
            <input
              type="file"
              accept="image/*,video/*"
              class="file-input"
              @change="handleFileUpload"
              multiple
            />
          </label>
        </div>

        <!-- 媒体预览区域 -->
        <div class="media-preview" v-if="mediaFiles.length > 0">
          <div class="preview-label">媒体文件：</div>
          <div class="media-files">
            <div v-for="(file, index) in mediaFiles" :key="index" class="media-item">
              <template v-if="file.type.startsWith('image/')">
                <img
                  :src="file.url"
                  class="media-thumbnail"
                  :alt="'图片 ' + (index + 1)"
                  @click="openMediaViewer(mediaFiles, index)"
                />
              </template>
              <template v-else-if="file.type.startsWith('video/')">
                <video
                  :src="file.url"
                  class="media-thumbnail"
                  controls
                  @click="openMediaViewer(mediaFiles, index)"
                ></video>
              </template>
              <button class="remove-media" @click="removeMedia(index)">×</button>
            </div>
          </div>
        </div>

        <!-- 格式化预览（仅当有内容时显示） -->
        <div class="note-preview" v-if="formattedNote">
          <div class="preview-label">预览：</div>
          <div class="formatted-content" v-html="formattedNote"></div>
        </div>
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
        <span class="record-count">({{ todayRecords.length }})</span>
      </h3>

      <div class="records-list">
        <div class="record-item card" v-for="record in todayRecords" :key="record.id">
          <div class="record-header">
            <div class="record-type" :class="getTypeClass(record.type)">
              {{ record.type }}
            </div>
            <div class="record-time">{{ formatTime(record.time) }}</div>
          </div>
          <div class="record-body" v-html="formatRecordNote(record.note)"></div>

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

          <!-- 操作按钮（悬停显示） -->
          <div class="record-actions">
            <button class="action-btn edit-btn" @click="handleEditRecord(record)" title="编辑">
              编辑
            </button>
            <button
              class="action-btn delete-btn"
              @click="handleDeleteRecord(record.id)"
              title="删除"
            >
              删除
            </button>
          </div>
        </div>

        <!-- 空状态优化 -->
        <div class="empty-state" v-if="todayRecords.length === 0">
          <div class="empty-icon">📅</div>
          <div class="empty-text">今天还没有打卡记录</div>
          <div class="empty-desc">点击上方快捷按钮或表单开始今日打卡吧~</div>
          <el-button class="empty-action-btn" @click="scrollToForm"> 立即打卡 </el-button>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElDialog, ElInput, ElButton } from 'element-plus'

// 状态管理
const commonTypes = ref([]) // 常用打卡类型
const checkinTypes = ref(['学习', '健身', '阅读', '其他']) // 所有打卡类型
const selectedType = ref('学习') // 选中的类型
const note = ref('') // 备注内容
const streakCount = ref(0) // 连续打卡天数（动态计算）
const todayRecords = ref([]) // 今日记录
const formattedNote = ref('') // 备注格式化预览
const showAddTypeDialog = ref(false) // 新增类型弹窗开关
const newTypeName = ref('') // 新类型名称
const editingRecordId = ref('') // 正在编辑的记录ID
const mediaFiles = ref([]) // 存储上传的媒体文件

// 媒体查看器相关状态
const showMediaViewer = ref(false)
const mediaList = ref([])
const currentMediaIndex = ref(0)
const currentMedia = ref(null)
const isFullscreen = ref(false)

// 格式化今日日期
const todayDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return new Date().toLocaleDateString('zh-CN', options)
})

// 初始化数据
onMounted(() => {
  loadCheckinTypes()
  loadAllRecords()
  calculateStreakCount() // 计算连续打卡天数
})

// 1. 加载打卡类型（支持本地存储持久化）
const loadCheckinTypes = () => {
  const savedTypes = localStorage.getItem('checkinTypes')
  if (savedTypes) {
    checkinTypes.value = JSON.parse(savedTypes)
  }
}

// 2. 加载所有记录并筛选今日记录
const loadAllRecords = () => {
  const savedRecords = localStorage.getItem('checkinRecords') || '[]'
  const allRecords = JSON.parse(savedRecords)
  const today = new Date().toLocaleDateString()

  todayRecords.value = allRecords
    .filter((item) => new Date(item.time).toLocaleDateString() === today)
    .sort((a, b) => new Date(b.time) - new Date(a.time)) // 最新的在前

  calculateCommonTypes() // 重新计算常用类型
}

// 3. 计算常用类型（前3种）
const calculateCommonTypes = () => {
  const savedRecords = localStorage.getItem('checkinRecords') || '[]'
  const allRecords = JSON.parse(savedRecords)

  if (allRecords.length === 0) {
    commonTypes.value = checkinTypes.value.slice(0, 3)
    return
  }

  // 统计类型出现次数
  const typeCount = {}
  allRecords.forEach((record) => {
    typeCount[record.type] = (typeCount[record.type] || 0) + 1
  })

  // 排序取前3（排除"其他"类型，优先级降低）
  commonTypes.value = Object.entries(typeCount)
    .sort((a, b) => {
      // "其他"类型排在后面
      if (a[0] === '其他') return 1
      if (b[0] === '其他') return -1
      return b[1] - a[1]
    })
    .slice(0, 3)
    .map((item) => item[0])
}

// 4. 动态计算连续打卡天数（核心优化）
const calculateStreakCount = () => {
  const savedRecords = localStorage.getItem('checkinRecords') || '[]'
  const allRecords = JSON.parse(savedRecords)
  if (allRecords.length === 0) {
    streakCount.value = 0
    return
  }

  // 提取所有打卡日期（去重）
  const checkinDates = new Set()
  allRecords.forEach((record) => {
    checkinDates.add(new Date(record.time).toLocaleDateString())
  })

  // 转换为日期数组并排序
  const sortedDates = Array.from(checkinDates)
    .map((date) => new Date(date))
    .sort((a, b) => b - a) // 从新到旧

  let count = 1
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 检查是否包含今天
  const hasToday = sortedDates.some((date) => {
    return date.toLocaleDateString() === today.toLocaleDateString()
  })
  if (!hasToday) {
    streakCount.value = 0
    return
  }

  // 计算连续天数
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diffTime = sortedDates[i] - sortedDates[i + 1]
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      count++
    } else {
      break
    }
  }

  streakCount.value = count
}

// 备注输入处理（实时格式化）
const handleNoteInput = () => {
  let text = note.value
  // 话题高亮（#xxx）
  text = text.replace(/#([^#\s]+)/g, '<span class="topic">#$1</span>')
  // 链接识别（http://xxx）
  text = text.replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank" class="link">$&</a>')
  formattedNote.value = text
}

// 插入话题示例
const insertTopic = () => {
  note.value += ' #'
  handleNoteInput()
  // 聚焦到输入框
  nextTick(() => {
    const textarea = document.querySelector('.form-textarea')
    textarea?.focus()
  })
}

// 处理文件上传
const handleFileUpload = (e) => {
  const files = e.target.files
  if (!files.length) return

  Array.from(files).forEach((file) => {
    // 检查文件类型
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      ElMessage.warning('请上传图片或视频文件')
      return
    }

    // 检查文件大小 (5MB以内)
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.warning('文件大小不能超过5MB')
      return
    }

    // 读取文件并转换为DataURL
    const reader = new FileReader()
    reader.onload = (event) => {
      mediaFiles.value.push({
        name: file.name,
        type: file.type,
        size: file.size,
        url: event.target.result,
      })
    }
    reader.readAsDataURL(file)
  })

  // 清空input值，允许重复选择同一文件
  e.target.value = ''
}

// 移除媒体文件
const removeMedia = (index) => {
  mediaFiles.value.splice(index, 1)
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

// 快捷打卡
const handleQuickCheckin = (type) => {
  const newRecord = {
    id: Date.now().toString(),
    type,
    note: '快捷打卡',
    time: new Date().toISOString(),
    media: [], // 快捷打卡默认无媒体
  }

  saveRecord(newRecord)
  ElMessage.success(`✅ 已完成【${type}】快捷打卡`)
}

// 表单提交打卡
const handleSubmit = () => {
  if (!selectedType.value) {
    ElMessage.warning('请选择打卡类型')
    return
  }

  let newRecord
  if (editingRecordId.value) {
    // 编辑模式：更新现有记录
    newRecord = todayRecords.value.find((r) => r.id === editingRecordId.value)
    newRecord.type = selectedType.value
    newRecord.note = note.value.trim() || '无备注'
    newRecord.time = new Date().toISOString() // 更新时间为当前
    // 保留原有媒体或添加新媒体
    newRecord.media = [...mediaFiles.value]
    ElMessage.success('记录已更新')
    editingRecordId.value = ''
  } else {
    // 新增模式：创建新记录
    newRecord = {
      id: Date.now().toString(),
      type: selectedType.value,
      note: note.value.trim() || '无备注',
      time: new Date().toISOString(),
      media: [...mediaFiles.value],
    }
    ElMessage.success('打卡成功！')
  }

  saveRecord(newRecord)
  // 重置表单
  note.value = ''
  formattedNote.value = ''
  mediaFiles.value = []
  selectedType.value = checkinTypes.value[0]
}

// 保存记录到本地存储
const saveRecord = (record) => {
  const savedRecords = localStorage.getItem('checkinRecords') || '[]'
  const allRecords = JSON.parse(savedRecords)

  if (editingRecordId.value) {
    // 替换旧记录
    const index = allRecords.findIndex((r) => r.id === record.id)
    if (index !== -1) allRecords[index] = record
  } else {
    // 添加新记录
    allRecords.push(record)
  }

  localStorage.setItem('checkinRecords', JSON.stringify(allRecords))
  loadAllRecords() // 重新加载记录
  calculateStreakCount() // 重新计算连续天数
}

// 编辑记录
const handleEditRecord = (record) => {
  editingRecordId.value = record.id
  selectedType.value = record.type
  note.value = record.note
  mediaFiles.value = record.media ? [...record.media] : []
  handleNoteInput() // 触发预览
  // 滚动到表单
  scrollToForm()
}

// 删除记录
const handleDeleteRecord = (id) => {
  if (!confirm('确定要删除这条记录吗？')) return

  const savedRecords = localStorage.getItem('checkinRecords') || '[]'
  let allRecords = JSON.parse(savedRecords)
  allRecords = allRecords.filter((record) => record.id !== id)

  localStorage.setItem('checkinRecords', JSON.stringify(allRecords))
  loadAllRecords()
  calculateStreakCount()
  ElMessage.success('记录已删除')
}

// 添加自定义打卡类型
const handleAddType = () => {
  const typeName = newTypeName.value.trim()
  if (!typeName) {
    ElMessage.warning('请输入类型名称')
    return
  }
  if (checkinTypes.value.includes(typeName)) {
    ElMessage.warning('该类型已存在')
    return
  }

  checkinTypes.value.push(typeName)
  localStorage.setItem('checkinTypes', JSON.stringify(checkinTypes.value))
  showAddTypeDialog.value = false
  newTypeName.value = ''
  ElMessage.success(`已添加【${typeName}】类型`)
}

// 滚动到表单
const scrollToForm = () => {
  nextTick(() => {
    document.querySelector('.checkin-form-card')?.scrollIntoView({
      behavior: 'smooth',
    })
  })
}

// 格式化时间（时分秒）
const formatTime = (timeStr) => {
  return new Date(timeStr).toTimeString().slice(0, 8)
}

// 格式化记录中的备注
const formatRecordNote = (text) => {
  if (!text) return '无备注信息'
  let formatted = text
  formatted = formatted.replace(/#([^#\s]+)/g, '<span class="topic">#$1</span>')
  formatted = formatted.replace(
    /https?:\/\/[^\s]+/g,
    '<a href="$&" target="_blank" class="link">$&</a>',
  )
  return formatted
}

// 获取类型对应的样式类
const getTypeClass = (type) => {
  const typeMap = {
    学习: 'type-study',
    健身: 'type-sport',
    阅读: 'type-read',
    其他: 'type-other',
    工作: 'type-work',
    冥想: 'type-meditation',
  }
  return typeMap[type] || 'type-custom'
}
</script>

<style>
/* 原有样式保持不变，添加以下新样式 */
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

/* 其他原有样式... */
.file-upload-btn {
  position: relative;
  overflow: hidden;
}

.file-input {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 100%;
  min-height: 100%;
  font-size: 100px;
  opacity: 0;
  cursor: pointer;
}

.media-preview {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed #e5e9f2;
}

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

.remove-media {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-item:hover .remove-media {
  opacity: 1;
}

/* 其他原有样式保持不变 */
.checkin-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1890ff;
  font-size: 24px;
}

.date-info {
  color: #666;
  font-size: 14px;
}

.streak-card {
  background: linear-gradient(135deg, #fff7e6 0%, #fff0cc 100%);
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.streak-icon {
  font-size: 28px;
}

.streak-title {
  font-weight: 600;
  color: #fa8c16;
  margin-bottom: 3px;
}

.streak-desc {
  color: #d48806;
  font-size: 14px;
}

.streak-milestone {
  background: #faad14;
  color: white;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* 快捷打卡区域 */
.quick-checkin {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.quick-checkin h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-checkin h4::before {
  content: '⚡';
  font-size: 18px;
}

.quick-type-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-type-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  flex: 1;
  min-width: 120px;
  justify-content: center;
  display: flex;
  align-items: center;
}

.quick-type-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 快捷按钮颜色 */
.type-学习 {
  background-color: #e6f4ff;
  color: #1890ff;
}
.type-健身 {
  background-color: #fff7e6;
  color: #faad14;
}
.type-阅读 {
  background-color: #f6ffed;
  color: #52c41a;
}
.type-其他 {
  background-color: #f9f0ff;
  color: #722ed1;
}
.type-工作 {
  background-color: #e8f3ff;
  color: #096dd9;
}
.type-冥想 {
  background-color: #ffe6e6;
  color: #f5222d;
}
.add-type-btn {
  background-color: #f0f2f5;
  color: #666;
  border: 1px dashed #d9d9d9;
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
  position: relative;
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
  min-height: 100px;
}

.form-textarea:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 备注工具条 */
.note-tools {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.tool-btn {
  padding: 4px 12px;
  background: #f5f7fa;
  border: 1px solid #e5e9f2;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

/* 预览样式 */
.note-preview {
  margin-top: 10px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
}

.preview-label {
  color: #666;
  font-size: 13px;
  margin-bottom: 5px;
  display: block;
}

.formatted-content {
  line-height: 1.6;
}

.topic {
  color: #1890ff;
  font-weight: 500;
}

.link {
  color: #722ed1;
  text-decoration: underline;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 12px 0;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #096dd9;
}

/* 今日记录区域 */
.today-records-section {
  margin-top: 30px;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
}

.record-count {
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.record-item {
  position: relative;
  overflow: hidden;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-type {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
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

.record-time {
  color: #666;
  font-size: 13px;
}

.record-body {
  color: #333;
  line-height: 1.6;
  padding-bottom: 5px;
}

/* 记录操作按钮 */
.record-actions {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.record-item:hover .record-actions {
  opacity: 1;
}

.action-btn {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.edit-btn {
  background: #e6f7ff;
  color: #1890ff;
}

.edit-btn:hover {
  background: #bae7ff;
}

.delete-btn {
  background: #fff1f0;
  color: #ff4d4f;
}

.delete-btn:hover {
  background: #ffe3e0;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  background: #fafafa;
  border-radius: 12px;
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
  margin-bottom: 20px;
}

.empty-action-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
