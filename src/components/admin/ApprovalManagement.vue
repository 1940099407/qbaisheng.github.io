<template>
  <div class="approval-management">
    <h2>审批管理</h2>

    <!-- 操作栏：搜索+状态筛选+类型筛选 -->
    <div class="operation-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索申请人/申请理由"
        prefix-icons="Search"
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="currentStatus" @change="handleStatusChange">
        <el-option label="待审批" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select v-model="filterType" placeholder="申请类型" @change="handleTypeFilter">
        <el-option label="全部类型" value="" />
        <el-option label="运动打卡豁免（因病）" value="leave" />
        <el-option label="学习打卡豁免（因病）" value="reimbursement" />
        <el-option label="其他打卡豁免（因病）" value="other" />
      </el-select>
    </div>

    <el-card>
      <el-table :data="filteredApprovals" border style="width: 100%">
        <el-table-column prop="username" label="申请人" width="120"></el-table-column>
        <el-table-column prop="type" label="申请类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ typeTextMap[scope.row.type] || scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申请理由"></el-table-column>
        <el-table-column prop="date" label="申请日期" width="150"></el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="180"></el-table-column>
        <!-- 审批状态列（非待审批视图显示） -->
        <el-table-column
          prop="status"
          label="审批状态"
          width="120"
          v-if="currentStatus !== 'pending'"
        >
          <template #default="scope">
            <el-tag :type="scope.row.status === 'approved' ? 'success' : 'danger'">
              {{ scope.row.status === 'approved' ? '已通过' : '已驳回' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 审批备注列（非待审批视图显示） -->
        <el-table-column
          prop="approvalRemark"
          label="审批备注"
          width="200"
          v-if="currentStatus !== 'pending'"
        ></el-table-column>
        <el-table-column label="操作" width="240">
          <template #default="scope">
            <!-- 待审批操作 -->
            <template v-if="currentStatus === 'pending'">
              <el-button size="small" type="success" @click="handleApprove(scope.row)">
                通过
              </el-button>
              <el-button size="small" type="danger" @click="openRejectDialog(scope.row)">
                驳回
              </el-button>
              <el-button size="small" type="info" @click="viewDetail(scope.row)"> 详情 </el-button>
            </template>
            <!-- 历史记录操作 -->
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
        v-if="filteredApprovals.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :total="totalCount"
        style="margin-top: 15px; text-align: right"
      />

      <!-- 空状态提示 -->
      <div v-if="filteredApprovals.length === 0" class="empty-state">
        <el-empty :description="getEmptyDescription()"></el-empty>
      </div>
    </el-card>

    <!-- 驳回理由弹窗 -->
    <el-dialog title="填写驳回理由" v-model="rejectDialogVisible" width="400px">
      <el-form :model="rejectForm">
        <el-form-item label="驳回原因" required>
          <el-input
            type="textarea"
            v-model="rejectForm.remark"
            placeholder="请说明驳回原因（必填）"
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
import { ElMessage, ElMessageBox } from 'element-plus'

// 审批数据存储
const pendingApprovals = ref([])
const approvedApprovals = ref([])
const rejectedApprovals = ref([])

// 状态与筛选
const currentStatus = ref('pending') // pending/approved/rejected
const searchKeyword = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 驳回弹窗相关
const rejectDialogVisible = ref(false)
const rejectForm = ref({ remark: '' })
const currentApproval = ref(null)

// 类型文本映射
const typeTextMap = {
  leave: '运动打卡豁免',
  reimbursement: '学习打卡豁免',
  other: '其他打卡豁免',
}

// 初始化数据
onMounted(() => {
  // 从本地存储加载数据
  pendingApprovals.value = JSON.parse(localStorage.getItem('pendingApprovals') || '[]')
  approvedApprovals.value = JSON.parse(localStorage.getItem('approvedApprovals') || '[]')
  rejectedApprovals.value = JSON.parse(localStorage.getItem('rejectedApprovals') || '[]')

  // 首次使用添加模拟数据
  if (pendingApprovals.value.length === 0) {
    pendingApprovals.value = [
      {
        id: '1',
        username: '张三',
        type: 'leave', // 仍用leave，对应“病假”
        reason: '因感冒发烧，无法完成12月10日-12日的每日跑步打卡', // 替换为病假（学健打卡豁免）理由
        date: '2025-12-08',
        submitTime: new Date(Date.now() - 3600000).toLocaleString(), // 1小时前
        details: '豁免打卡类型：运动打卡；豁免日期：2025-12-10至2025-12-12；附医院诊断证明', // 补充学健打卡豁免详情
      },
      {
        id: '2',
        username: '李四',
        type: 'reimbursement', // 仍用reimbursement，对应“事假”
        reason: '因家中急事，无法完成12月8日的网课学习打卡', // 替换为事假（学健打卡豁免）理由
        date: '2025-12-08',
        submitTime: new Date(Date.now() - 7200000).toLocaleString(), // 2小时前
        details: '豁免打卡类型：学习打卡；豁免日期：2025-12-08；无相关证明（紧急事务）', // 补充学健打卡豁免详情
      },
    ]
    localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals.value))
  }
})

// 总记录数（用于分页）
const totalCount = computed(() => {
  if (currentStatus.value === 'pending') return pendingApprovals.value.length
  if (currentStatus.value === 'approved') return approvedApprovals.value.length
  return rejectedApprovals.value.length
})

// 筛选后的审批列表
const filteredApprovals = computed(() => {
  // 1. 获取当前状态的数据源
  let source = []
  if (currentStatus.value === 'pending') source = [...pendingApprovals.value]
  if (currentStatus.value === 'approved') source = [...approvedApprovals.value]
  if (currentStatus.value === 'rejected') source = [...rejectedApprovals.value]

  // 2. 搜索筛选（申请人/申请理由）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    source = source.filter(
      (item) =>
        item.username.toLowerCase().includes(keyword) ||
        item.reason.toLowerCase().includes(keyword),
    )
  }

  // 3. 申请类型筛选
  if (filterType.value) {
    source = source.filter((item) => item.type === filterType.value)
  }

  // 4. 分页处理
  const start = (currentPage.value - 1) * pageSize.value
  return source.slice(start, start + pageSize.value)
})

// 类型标签样式
const getTypeTag = (type) => {
  const typeMap = { leave: 'warning', reimbursement: 'success', other: 'info' }
  return typeMap[type] || 'default'
}

// 空状态描述
const getEmptyDescription = () => {
  const descMap = {
    pending: '暂无待审批的申请',
    approved: '暂无已通过的申请',
    rejected: '暂无已驳回的申请',
  }
  return descMap[currentStatus.value]
}

// 状态切换（重置分页）
const handleStatusChange = () => {
  currentPage.value = 1
}

// 搜索（重置分页）
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

// 审批通过
const handleApprove = (row) => {
  ElMessageBox.confirm('确定通过该申请吗？', '提示', {
    type: 'success',
  }).then(() => {
    // 从待审批列表移除
    pendingApprovals.value = pendingApprovals.value.filter((item) => item.id !== row.id)
    // 添加到已通过列表（含审批信息）
    approvedApprovals.value.push({
      ...row,
      status: 'approved',
      approvalRemark: '审批通过',
      approvalTime: new Date().toLocaleString(),
      approver: '管理员', // 实际项目从登录信息获取
    })
    // 同步存储
    syncStorage()
    ElMessage.success('审批已通过')
  })
}

// 打开驳回弹窗
const openRejectDialog = (row) => {
  currentApproval.value = row
  rejectForm.value.remark = ''
  rejectDialogVisible.value = true
}

// 确认驳回
const confirmReject = () => {
  if (!rejectForm.value.remark.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  // 从待审批列表移除
  pendingApprovals.value = pendingApprovals.value.filter(
    (item) => item.id !== currentApproval.value.id,
  )
  // 添加到已驳回列表
  rejectedApprovals.value.push({
    ...currentApproval.value,
    status: 'rejected',
    approvalRemark: rejectForm.value.remark,
    approvalTime: new Date().toLocaleString(),
    approver: '管理员',
  })
  // 同步存储
  syncStorage()
  rejectDialogVisible.value = false
  ElMessage.success('已驳回申请')
}

// 查看详情
const viewDetail = (row) => {
  // 构造详情内容（区分待审批和已处理状态）
  const detailContent = `
    <div style="text-align: left; line-height: 1.8">
      <p><strong>申请人：</strong>${row.username}</p>
      <p><strong>申请类型：</strong>${typeTextMap[row.type]}</p>
      <p><strong>申请日期：</strong>${row.date}</p>
      <p><strong>提交时间：</strong>${row.submitTime}</p>
      <p><strong>申请理由：</strong>${row.reason}</p>
      <p><strong>申请详情：</strong>${row.details || '无'}</p>
      ${
        row.status
          ? `
        <p><strong>审批状态：</strong>${row.status === 'approved' ? '已通过' : '已驳回'}</p>
        <p><strong>审批人：</strong>${row.approver}</p>
        <p><strong>审批时间：</strong>${row.approvalTime}</p>
        <p><strong>审批备注：</strong>${row.approvalRemark}</p>
      `
          : ''
      }
    </div>
  `
  ElMessageBox.alert(detailContent, '申请详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭',
  })
}

// 同步数据到本地存储
const syncStorage = () => {
  localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals.value))
  localStorage.setItem('approvedApprovals', JSON.stringify(approvedApprovals.value))
  localStorage.setItem('rejectedApprovals', JSON.stringify(rejectedApprovals.value))
}
</script>

<style scoped>
.approval-management {
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

/* 响应式调整 */
@media (max-width: 768px) {
  .approval-management {
    padding: 10px;
  }
  .search-input,
  .el-select {
    width: 100%;
  }
}
</style>
