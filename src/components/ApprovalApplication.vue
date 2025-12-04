<template>
  <div class="approval-application">
    <el-card>
      <h2>申请发起</h2>
      <el-form ref="approvalForm" :model="form" label-width="120px" class="approval-form">
        <el-form-item
          label="申请类型"
          prop="type"
          :rules="[{ required: true, message: '请选择申请类型' }]"
        >
          <el-select v-model="form.type" placeholder="请选择">
            <el-option label="请假" value="leave"></el-option>
            <el-option label="报销" value="reimbursement"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item
          label="申请理由"
          prop="reason"
          :rules="[{ required: true, message: '请输入申请理由' }]"
        >
          <el-input
            type="textarea"
            v-model="form.reason"
            rows="4"
            placeholder="请详细描述申请理由"
          ></el-input>
        </el-form-item>

        <el-form-item
          label="申请时间"
          prop="date"
          :rules="[{ required: true, message: '请选择申请时间' }]"
        >
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">提交申请</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的申请记录 -->
    <el-card style="margin-top: 20px">
      <h3>我的申请记录</h3>
      <el-table :data="myApplications" style="width: 100%">
        <el-table-column prop="type" label="申请类型" width="120"></el-table-column>
        <el-table-column prop="reason" label="申请理由"></el-table-column>
        <el-table-column prop="date" label="申请时间" width="150"></el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 表单数据
const form = ref({
  type: '',
  reason: '',
  date: '',
})

// 状态映射
const statusTextMap = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
}

const statusTypeMap = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

// 我的申请记录
const myApplications = ref([])

// 加载我的申请记录
onMounted(() => {
  const username = localStorage.getItem('username')
  const allApplications = JSON.parse(localStorage.getItem('pendingApprovals') || '[]')
    .concat(JSON.parse(localStorage.getItem('approvedApprovals') || '[]'))
    .concat(JSON.parse(localStorage.getItem('rejectedApprovals') || '[]'))

  myApplications.value = allApplications.filter((app) => app.username === username)
})

// 提交表单
const submitForm = () => {
  const username = localStorage.getItem('username')
  if (!username) {
    ElMessage.error('请先登录')
    return
  }

  // 创建申请记录
  const newApplication = {
    id: Date.now().toString(),
    username,
    ...form.value,
    status: 'pending',
    submitTime: new Date().toLocaleString(),
  }

  // 保存到本地存储
  const pendingApprovals = JSON.parse(localStorage.getItem('pendingApprovals') || '[]')
  pendingApprovals.push(newApplication)
  localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals))

  // 更新我的申请列表
  myApplications.value.push(newApplication)

  ElMessage.success('申请提交成功')
  resetForm()
}

// 重置表单
const resetForm = () => {
  form.value = {
    type: '',
    reason: '',
    date: '',
  }
}
</script>

<style scoped>
.approval-application {
  padding: 20px;
}

h2,
h3 {
  margin-bottom: 15px;
  color: #333;
}

.approval-form {
  margin-top: 15px;
}
</style>
