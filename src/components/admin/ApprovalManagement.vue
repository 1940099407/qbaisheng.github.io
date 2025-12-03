<template>
  <div class="approval-management">
    <h2>审批管理</h2>
    <el-card>
      <el-table :data="pendingApprovals" border style="width: 100%">
        <el-table-column prop="username" label="申请人" width="120"></el-table-column>
        <el-table-column prop="type" label="申请类型" width="120">
          <template #default="scope">
            {{ typeTextMap[scope.row.type] || scope.row.type }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申请理由"></el-table-column>
        <el-table-column prop="date" label="申请时间" width="150"></el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="success" @click="handleApprove(scope.row.id)">
              通过
            </el-button>
            <el-button size="small" type="danger" @click="handleReject(scope.row.id)">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态提示 -->
      <div v-if="pendingApprovals.length === 0" class="empty-state">
        <el-empty description="暂无待审批的申请"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElEmpty } from 'element-plus'

// 待审批申请
const pendingApprovals = ref([])

// 类型文本映射
const typeTextMap = {
  leave: '请假',
  reimbursement: '报销',
  other: '其他',
}

// 加载待审批申请
onMounted(() => {
  const saved = localStorage.getItem('pendingApprovals')
  pendingApprovals.value = saved ? JSON.parse(saved) : []
})

// 审批通过
const handleApprove = (id) => {
  const approval = pendingApprovals.value.find((item) => item.id === id)
  if (!approval) return

  // 从待审批列表移除
  pendingApprovals.value = pendingApprovals.value.filter((item) => item.id !== id)

  // 更新状态并保存到已通过列表
  approval.status = 'approved'
  const approved = JSON.parse(localStorage.getItem('approvedApprovals') || '[]')
  approved.push(approval)
  localStorage.setItem('approvedApprovals', JSON.stringify(approved))

  // 更新待审批存储
  localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals.value))

  ElMessage.success('审批已通过')
}

// 审批驳回
const handleReject = (id) => {
  const approval = pendingApprovals.value.find((item) => item.id === id)
  if (!approval) return

  // 从待审批列表移除
  pendingApprovals.value = pendingApprovals.value.filter((item) => item.id !== id)

  // 更新状态并保存到已驳回列表
  approval.status = 'rejected'
  const rejected = JSON.parse(localStorage.getItem('rejectedApprovals') || '[]')
  rejected.push(approval)
  localStorage.setItem('rejectedApprovals', JSON.stringify(rejected))

  // 更新待审批存储
  localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals.value))

  ElMessage.success('已驳回申请')
}
</script>

<style scoped>
.approval-management {
  padding: 20px;
}

h2 {
  margin-bottom: 15px;
  color: #333;
}

.empty-state {
  margin: 50px 0;
  text-align: center;
}
</style>
