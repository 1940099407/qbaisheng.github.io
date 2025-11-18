<template>
  <div class="user-management-container">
    <h2>用户管理</h2>
    <el-card>
      <!-- 搜索框 -->
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名"
        prefix-icon="Search"
        style="width: 300px; margin-bottom: 15px"
      ></el-input>

      <!-- 用户列表 -->
      <el-table
        :data="filteredUsers"
        border
        style="width: 100%"
        :empty-text="searchKeyword ? '未找到匹配用户' : '暂无用户数据'"
      >
        <el-table-column prop="username" label="用户名" width="150"></el-table-column>
        <el-table-column prop="joinDate" label="注册时间" width="200"></el-table-column>
        <el-table-column prop="totalCheckins" label="总打卡次数" width="120"></el-table-column>
        <el-table-column prop="lastCheckin" label="最后打卡" width="200"></el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row.username)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElTable, ElTableColumn, ElButton, ElInput, ElCard } from 'element-plus'

// 用户列表数据
const users = ref([])
// 搜索关键词
const searchKeyword = ref('')

// 初始化：从本地存储加载用户数据
onMounted(() => {
  const savedUsers = localStorage.getItem('systemUsers')
  if (savedUsers) {
    users.value = JSON.parse(savedUsers)
  } else {
    // 模拟初始用户数据
    users.value = [
      {
        username: '张三',
        joinDate: '2023-01-15',
        totalCheckins: 42,
        lastCheckin: new Date(Date.now() - 86400000).toLocaleDateString(), // 昨天
      },
      {
        username: '李四',
        joinDate: '2023-03-22',
        totalCheckins: 28,
        lastCheckin: new Date(Date.now() - 2 * 86400000).toLocaleDateString(), // 前天
      },
      {
        username: '王五',
        joinDate: '2023-05-10',
        totalCheckins: 15,
        lastCheckin: new Date().toLocaleDateString(), // 今天
      },
    ]
    localStorage.setItem('systemUsers', JSON.stringify(users.value))
  }
})

// 过滤后的用户列表（根据搜索关键词）
const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  return users.value.filter((user) => user.username.includes(searchKeyword.value))
})

// 编辑用户（示例：仅弹窗提示，实际可扩展表单）
const handleEdit = (user) => {
  ElMessage.info(`编辑用户：${user.username}（实际项目可打开编辑表单）`)
  // 扩展方向：打开编辑弹窗，修改用户信息后保存
}

// 删除用户
const handleDelete = (username) => {
  // 确认删除
  if (confirm(`确定要删除用户"${username}"吗？`)) {
    users.value = users.value.filter((user) => user.username !== username)
    localStorage.setItem('systemUsers', JSON.stringify(users.value))
    ElMessage.success('用户已删除')
  }
}
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

h2 {
  margin-bottom: 15px;
  color: #333;
}
</style>
