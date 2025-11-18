<template>
  <div class="checkin-review-container">
    <h2>打卡审核</h2>
    <el-card>
      <el-table :data="pendingCheckins" border style="width: 100%">
        <el-table-column prop="username" label="用户名称" width="150"></el-table-column>
        <el-table-column prop="type" label="打卡类型" width="120">
          <template #default="scope">
            <el-tag>{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="打卡内容"></el-table-column>
        <el-table-column prop="time" label="提交时间" width="200"></el-table-column>
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
      <div v-if="pendingCheckins.length === 0" class="empty-state">
        <el-empty description="暂无待审核的打卡记录"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElTable, ElTableColumn, ElButton, ElTag, ElCard, ElEmpty } from 'element-plus'

// 待审核打卡记录
const pendingCheckins = ref([])

// 初始化：从本地存储加载待审核数据
onMounted(() => {
  const savedCheckins = localStorage.getItem('pendingCheckins')
  if (savedCheckins) {
    pendingCheckins.value = JSON.parse(savedCheckins)
  } else {
    // 模拟初始数据（首次使用时）
    pendingCheckins.value = [
      {
        id: '1',
        username: '张三',
        type: '运动',
        content: '今日跑步5公里',
        time: new Date(Date.now() - 3600000).toLocaleString(), // 1小时前
      },
      {
        id: '2',
        username: '李四',
        type: '学习',
        content: '完成Vue组件学习',
        time: new Date(Date.now() - 7200000).toLocaleString(), // 2小时前
      },
    ]
    localStorage.setItem('pendingCheckins', JSON.stringify(pendingCheckins.value))
  }
})

// 审核通过
const handleApprove = (id) => {
  // 从待审核列表移除
  const approvedItem = pendingCheckins.value.find((item) => item.id === id)
  pendingCheckins.value = pendingCheckins.value.filter((item) => item.id !== id)

  // 保存到已通过列表（实际项目可同步到用户打卡记录）
  const approvedList = JSON.parse(localStorage.getItem('approvedCheckins') || '[]')
  approvedList.push({ ...approvedItem, status: 'approved' })
  localStorage.setItem('approvedCheckins', JSON.stringify(approvedList))

  // 更新待审核列表存储
  localStorage.setItem('pendingCheckins', JSON.stringify(pendingCheckins.value))
  ElMessage.success('审核通过')
}

// 审核驳回
const handleReject = (id) => {
  // 从待审核列表移除
  pendingCheckins.value = pendingCheckins.value.filter((item) => item.id !== id)

  // 保存到驳回列表（可选）
  const rejectedList = JSON.parse(localStorage.getItem('rejectedCheckins') || '[]')
  rejectedList.push({ id, rejectTime: new Date().toLocaleString() })
  localStorage.setItem('rejectedCheckins', JSON.stringify(rejectedList))

  // 更新待审核列表存储
  localStorage.setItem('pendingCheckins', JSON.stringify(pendingCheckins.value))
  ElMessage.success('已驳回')
}
</script>

<style scoped>
.checkin-review-container {
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
