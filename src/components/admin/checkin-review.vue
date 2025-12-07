<template>
  <div class="checkin-review-container">
    <h2>打卡审核</h2>

    <!-- 操作栏：搜索+视图切换+类型筛选 -->
    <div class="operation-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名/打卡内容"
        prefix-icons="Search"
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="currentView" @change="handleViewChange">
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select v-model="filterType" placeholder="打卡类型" @change="handleTypeFilter">
        <el-option label="全部类型" value="" />
        <el-option label="运动" value="运动" />
        <el-option label="学习" value="学习" />
        <el-option label="其他" value="其他" />
      </el-select>
    </div>

    <el-card>
      <el-table :data="filteredCheckins" border style="width: 100%">
        <el-table-column prop="username" label="用户名称" width="150"></el-table-column>
        <el-table-column prop="type" label="打卡类型" width="120">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="打卡内容"></el-table-column>
        <el-table-column prop="time" label="提交时间" width="200"></el-table-column>
        <!-- 审核状态列（非待审核视图显示） -->
        <el-table-column
          prop="status"
          label="审核状态"
          width="120"
          v-if="currentView !== 'pending'"
        >
          <template #default="scope">
            <el-tag :type="scope.row.status === 'approved' ? 'success' : 'danger'">
              {{ scope.row.status === 'approved' ? '已通过' : '已驳回' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 审核备注列（非待审核视图显示） -->
        <el-table-column
          prop="reviewRemark"
          label="审核备注"
          width="200"
          v-if="currentView !== 'pending'"
        ></el-table-column>
        <!-- 异常标记列（待审核视图显示） -->
        <el-table-column label="异常标记" width="100" v-if="currentView === 'pending'">
          <template #default="scope">
            <el-tag v-if="scope.row.isAbnormal" type="danger">异常</el-tag>
            <span v-else>正常</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="scope">
            <!-- 待审核视图操作 -->
            <template v-if="currentView === 'pending'">
              <el-button size="small" type="success" @click="handleApprove(scope.row)">
                通过
              </el-button>
              <el-button size="small" type="danger" @click="openRejectDialog(scope.row)">
                驳回
              </el-button>
              <el-button
                size="small"
                :type="scope.row.isAbnormal ? 'default' : 'warning'"
                @click="markAsAbnormal(scope.row)"
              >
                {{ scope.row.isAbnormal ? '取消异常' : '标记异常' }}
              </el-button>
            </template>
            <!-- 历史视图操作 -->
            <template v-else>
              <el-button size="small" type="info" @click="viewDetail(scope.row)">
                查看详情
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <el-pagination
        v-if="filteredCheckins.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :total="totalCheckins"
        style="margin-top: 15px; text-align: right"
      />

      <!-- 空状态提示 -->
      <div v-if="filteredCheckins.length === 0" class="empty-state">
        <el-empty :description="getEmptyDescription()"></el-empty>
      </div>
    </el-card>

    <!-- 驳回备注弹窗 -->
    <el-dialog title="驳回原因" v-model="rejectDialogVisible" width="400px">
      <el-form :model="rejectForm" ref="rejectFormRef">
        <el-form-item label="备注" required>
          <el-input
            type="textarea"
            v-model="rejectForm.remark"
            placeholder="请输入驳回原因（必填）"
            rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'

// 打卡记录数据（待审核/已通过/已驳回）
const pendingCheckins = ref([])
const approvedCheckins = ref([])
const rejectedCheckins = ref([])

// 视图与筛选状态
const currentView = ref('pending') // pending/approved/rejected
const searchKeyword = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 驳回弹窗相关
const rejectDialogVisible = ref(false)
const rejectForm = ref({ remark: '' })
const rejectFormRef = ref(null)
const currentCheckin = ref(null)

// 初始化数据
onMounted(() => {
  // 从本地存储加载数据
  pendingCheckins.value = JSON.parse(localStorage.getItem('pendingCheckins') || '[]')
  approvedCheckins.value = JSON.parse(localStorage.getItem('approvedCheckins') || '[]')
  rejectedCheckins.value = JSON.parse(localStorage.getItem('rejectedCheckins') || '[]')

  // 首次使用添加模拟数据
  if (pendingCheckins.value.length === 0) {
    pendingCheckins.value = [
      {
        id: '1',
        username: '张三',
        type: '运动',
        content: '今日跑步5公里，配速6分钟/公里',
        time: new Date(Date.now() - 3600000).toLocaleString(), // 1小时前
        isAbnormal: false,
      },
      {
        id: '2',
        username: '李四',
        type: '学习',
        content: '完成Vue3组件化开发课程第三章',
        time: new Date(Date.now() - 7200000).toLocaleString(), // 2小时前
        isAbnormal: false,
      },
      {
        id: '3',
        username: '王五',
        type: '其他',
        content: '参加公司技术分享会',
        time: new Date(Date.now() - 10800000).toLocaleString(), // 3小时前
        isAbnormal: false,
      },
    ]
    localStorage.setItem('pendingCheckins', JSON.stringify(pendingCheckins.value))
  }
})

// 总记录数（用于分页）
const totalCheckins = computed(() => {
  if (currentView.value === 'pending') return pendingCheckins.value.length
  if (currentView.value === 'approved') return approvedCheckins.value.length
  return rejectedCheckins.value.length
})

// 筛选后的打卡记录（含搜索、类型筛选、分页）
const filteredCheckins = computed(() => {
  // 1. 获取当前视图数据源
  let sourceData = []
  if (currentView.value === 'pending') sourceData = [...pendingCheckins.value]
  if (currentView.value === 'approved') sourceData = [...approvedCheckins.value]
  if (currentView.value === 'rejected') sourceData = [...rejectedCheckins.value]

  // 2. 搜索筛选（用户名/打卡内容）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    sourceData = sourceData.filter(
      (item) =>
        item.username.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword),
    )
  }

  // 3. 打卡类型筛选
  if (filterType.value) {
    sourceData = sourceData.filter((item) => item.type === filterType.value)
  }

  // 4. 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  return sourceData.slice(startIndex, startIndex + pageSize.value)
})

// 空状态描述文本
const getEmptyDescription = () => {
  const descMap = {
    pending: '暂无待审核的打卡记录',
    approved: '暂无已通过的打卡记录',
    rejected: '暂无已驳回的打卡记录',
  }
  return descMap[currentView.value]
}

// 打卡类型标签样式
const getTagType = (type) => {
  const typeMap = { 运动: 'success', 学习: 'info', 其他: 'warning' }
  return typeMap[type] || 'default'
}

// 视图切换（重置分页）
const handleViewChange = () => {
  currentPage.value = 1
}

// 搜索触发（重置分页）
const handleSearch = () => {
  currentPage.value = 1
}

// 类型筛选（重置分页）
const handleTypeFilter = () => {
  currentPage.value = 1
}

// 分页大小变更
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 页码变更
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 审核通过
const handleApprove = (row) => {
  ElMessageBox.confirm('确定通过该打卡记录吗？', '提示', {
    type: 'success',
  }).then(() => {
    // 从待审核列表移除
    pendingCheckins.value = pendingCheckins.value.filter((item) => item.id !== row.id)
    // 添加到已通过列表（含审核信息）
    approvedCheckins.value.push({
      ...row,
      status: 'approved',
      reviewRemark: '审核通过',
      reviewTime: new Date().toLocaleString(),
    })
    // 同步存储
    syncStorage()
    ElMessage.success('审核通过')
  })
}

// 打开驳回弹窗
const openRejectDialog = (row) => {
  currentCheckin.value = row
  rejectForm.value.remark = ''
  rejectDialogVisible.value = true
}

// 确认驳回
const confirmReject = () => {
  if (!rejectForm.value.remark.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  // 从待审核列表移除
  pendingCheckins.value = pendingCheckins.value.filter(
    (item) => item.id !== currentCheckin.value.id,
  )
  // 添加到已驳回列表（含驳回原因）
  rejectedCheckins.value.push({
    ...currentCheckin.value,
    status: 'rejected',
    reviewRemark: rejectForm.value.remark,
    reviewTime: new Date().toLocaleString(),
  })
  // 同步存储
  syncStorage()
  rejectDialogVisible.value = false
  ElMessage.success('已驳回')
}

// 标记/取消异常
const markAsAbnormal = (row) => {
  const index = pendingCheckins.value.findIndex((item) => item.id === row.id)
  if (index !== -1) {
    pendingCheckins.value[index].isAbnormal = !pendingCheckins.value[index].isAbnormal
    const status = pendingCheckins.value[index].isAbnormal ? '已标记' : '已取消标记'
    syncStorage()
    ElMessage.success(`${status}异常`)
  }
}

// 查看详情
const viewDetail = (row) => {
  ElMessageBox.alert(
    `
    <div style="text-align: left; line-height: 1.8">
      <p><strong>用户名：</strong>${row.username}</p>
      <p><strong>打卡类型：</strong>${row.type}</p>
      <p><strong>打卡内容：</strong>${row.content}</p>
      <p><strong>提交时间：</strong>${row.time}</p>
      <p><strong>审核状态：</strong>${row.status === 'approved' ? '已通过' : '已驳回'}</p>
      <p><strong>审核时间：</strong>${row.reviewTime}</p>
      <p><strong>审核备注：</strong>${row.reviewRemark}</p>
      ${row.isAbnormal ? '<p style="color: #F56C6C"><strong>标记：</strong>异常打卡</p>' : ''}
    </div>
  `,
    '打卡详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
    },
  )
}

// 同步数据到本地存储
const syncStorage = () => {
  localStorage.setItem('pendingCheckins', JSON.stringify(pendingCheckins.value))
  localStorage.setItem('approvedCheckins', JSON.stringify(approvedCheckins.value))
  localStorage.setItem('rejectedCheckins', JSON.stringify(rejectedCheckins.value))
}
</script>

<style scoped>
.checkin-review-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-weight: 600;
}

.operation-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 300px;
}

.el-select {
  width: 180px;
}

.empty-state {
  margin: 50px 0;
  text-align: center;
}

/* 适配小屏幕 */
@media (max-width: 768px) {
  .checkin-review-container {
    padding: 10px;
  }
  .search-input,
  .el-select {
    width: 100%;
  }
}
</style>
