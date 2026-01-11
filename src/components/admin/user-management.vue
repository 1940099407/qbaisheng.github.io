<template>
  <div class="user-management-page">
    <!-- 页面标题与操作区 -->
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名/角色"
          prefix-icons="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" icons="Download" @click="handleExport">导出用户</el-button>
        <el-upload
          class="upload-btn"
          action="javascript:void(0)"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :auto-upload="false"
          @change="handleFileChange"
          :http-request="() => {}"
          accept=".xlsx,.xls"
        >
          <el-button type="warning" icons="Upload">导入用户</el-button>
        </el-upload>
        <el-button type="primary" icons="Plus" @click="openAddUserDialog">新增用户</el-button>
      </div>
    </div>

    <!-- 导入结果提示 -->
    <el-alert
      v-if="importResult.show"
      :title="importResult.title"
      :description="importResult.desc"
      :type="importResult.type"
      show-icon
      closable
      @close="importResult.show = false"
      style="margin-bottom: 15px"
    />

    <!-- 用户列表表格 -->
    <el-card class="user-table-card">
      <el-table :data="filteredUsers" border stripe :loading="tableLoading" style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" width="80" />
        <el-table-column label="角色" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'warning' : 'success'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="active"
              inactive-value="inactive"
              @change="handleStatusChange(scope.row)"
              :disabled="scope.row.username === currentAdmin"
            />
          </template>
        </el-table-column>
        <el-table-column prop="joinDate" label="注册时间" width="100" />
        <el-table-column prop="totalCheckins" label="总打卡次数" width="100" align="center" />
        <!-- 积分列与个人页面同步（共用totalPoints字段） -->
        <el-table-column label="总积分" width="80" align="center">
          <template #default="scope">
            {{ scope.row.totalPoints ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" width="90">
          <template #default="scope">
            {{ scope.row.lastActive ?? '未活跃' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" icons="Eye" @click="openUserDetail(scope.row)"
              >查看详情</el-button
            >
            <el-button
              size="small"
              type="success"
              icons="Edit"
              @click="openEditUserDialog(scope.row)"
              :disabled="scope.row.username === currentAdmin"
            >
              编辑
            </el-button>
            <!-- 新增：密码重置按钮 -->
            <el-button
              size="small"
              type="info"
              icons="Key"
              @click="openResetPasswordDialog(scope.row)"
              :disabled="scope.row.username === currentAdmin"
            >
              重置密码
            </el-button>
            <el-button
              size="small"
              type="danger"
              icons="Delete"
              @click="handleDeleteUser(scope.row)"
              :disabled="scope.row.username === currentAdmin"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredUsers.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentPageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog :title="isEditMode ? '编辑用户' : '新增用户'" v-model="showUserDialog" width="500px">
      <el-form ref="userFormRef" :model="userForm" label-width="100px" :rules="userFormRules">
        <el-form-item label="用户名" prop="username" :disabled="isEditMode">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item
          label="密码"
          prop="password"
          :rules="isEditMode ? [] : userFormRules.password"
        >
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="新增用户需设置密码，编辑可留空"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status" placeholder="请选择状态">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <!-- 编辑用户弹窗的表单中（template中） -->
        <el-form-item label="总积分" prop="totalPoints">
          <el-input
            v-model.number="userForm.totalPoints"
            type="number"
            min="0"
            placeholder="请输入总积分（非负整数）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUserDialog = false">取消</el-button>
        <el-button type="primary" @click="submitUserForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 密码重置弹窗 -->
    <el-dialog title="重置密码" v-model="showResetPwdDialog" width="400px">
      <el-form
        ref="resetPwdFormRef"
        :model="resetPwdForm"
        label-width="100px"
        :rules="resetPwdRules"
      >
        <el-form-item label="用户名" disabled>
          <el-input v-model="resetPwdForm.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPwdForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPwdForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResetPwdDialog = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword">确认重置</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情弹窗 -->
    <el-dialog title="用户详情" v-model="showUserDetailDialog" width="600px">
      <el-descriptions column="1" border class="user-detail-descriptions">
        <el-descriptions-item label="用户名">{{ currentUserDetail.username }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{
          currentUserDetail.role === 'admin' ? '管理员' : '普通用户'
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          currentUserDetail.status === 'active' ? '启用' : '禁用'
        }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{
          currentUserDetail.joinDate
        }}</el-descriptions-item>
        <el-descriptions-item label="最后活跃">{{
          currentUserDetail.lastActive
        }}</el-descriptions-item>
        <el-descriptions-item label="总打卡次数">{{
          currentUserDetail.totalCheckins
        }}</el-descriptions-item>
        <!-- 详情页积分与个人页面同步 -->
        <el-descriptions-item label="总积分">{{
          currentUserDetail.totalPoints
        }}</el-descriptions-item>
        <el-descriptions-item label="本周打卡">
          <el-progress
            :percentage="currentUserDetail.weeklyCheckinRate"
            stroke-width="6"
            :status="currentUserDetail.weeklyCheckinRate === 100 ? 'success' : 'active'"
          />
          <div class="progress-text">
            {{ currentUserDetail.weeklyCheckins }}/{{ currentUserDetail.weeklyTarget }} 次（{{
              currentUserDetail.weeklyCheckinRate
            }}%）
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="拥有徽章">
          <div class="badges-list">
            <span v-for="badge in currentUserDetail.badges" :key="badge.id" class="badge-item">
              {{ badge.icon }} {{ badge.name }}
            </span>
            <span v-if="currentUserDetail.badges.length === 0" class="no-badge">暂无徽章</span>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import * as XLSX from 'xlsx'

// 表单引用
const userFormRef = ref(null)
const resetPwdFormRef = ref(null) // 新增：密码重置表单引用

// 状态管理
const searchKeyword = ref('')
const tableLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const showUserDialog = ref(false)
const isEditMode = ref(false)
const showUserDetailDialog = ref(false)
const currentUserDetail = ref({ badges: [] })
const currentAdmin = ref(localStorage.getItem('currentAdmin') || '')
const importResult = ref({ show: false, title: '', desc: '', type: '' })
const showResetPwdDialog = ref(false) // 新增：密码重置弹窗开关

// 用户列表数据（totalPoints与个人页面共用，确保数据一致性）
const users = ref([])

// 筛选后的用户列表
const filteredUsers = computed(() => {
  // 1. 处理搜索关键词：去除首尾空格 + 转小写，兜底空字符串避免undefined
  const keyword = searchKeyword.value?.trim().toLowerCase() || ''

  // 2. 先过滤掉users中无效的元素（null/undefined），再做关键词匹配
  let result = users.value.filter((user) => {
    // 跳过无效用户对象
    if (!user) return false

    // 用String()强制转成字符串，确保后续能调用toLowerCase()
    const userName = String(user.username ?? '').toLowerCase()
    const userRole = String(user.role ?? '').toLowerCase()

    return userName.includes(keyword) || userRole.includes(keyword)
  })

  const startIndex = (currentPage.value - 1) * pageSize.value
  return result.slice(startIndex, startIndex + pageSize.value)
})

// 新增：密码重置表单数据与规则
const resetPwdForm = reactive({
  username: '',
  newPassword: '',
  confirmPassword: '',
})

const resetPwdRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 表单数据与验证规则
const userForm = reactive({
  username: '',
  password: '',
  role: 'user',
  status: 'active',
  totalPoints: 0, // 新增：总积分字段
})

const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  totalPoints: [
    { required: true, message: '请输入总积分', trigger: 'blur' },
    { type: 'number', message: '积分必须是数字', trigger: 'blur' },
    // 修正逻辑：只有value < 0时才提示“不能为负数”
    {
      validator: (rule, value, callback) => {
        if (value < 0) {
          callback(new Error('积分不能为负数'))
        } else {
          callback() // 正数/0都通过
        }
      },
      trigger: ['blur', 'change'],
    },
  ],
}

// 加载用户数据（确保积分数据与个人页面同步）
const loadUsers = () => {
  tableLoading.value = true
  nextTick(() => {
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('systemUsers')
      users.value = savedUsers ? JSON.parse(savedUsers) : []
    }
    tableLoading.value = false
  })
}

// 导入功能：文件上传前验证
const beforeUpload = (file) => {
  const isExcel =
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isExcel) {
    ElMessage.error('请上传Excel文件（.xlsx或.xls格式）')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('文件大小不能超过2MB')
    return false
  }
  return true
}

// 导入功能：解析Excel并处理数据（替换原handleImportSuccess）
const handleFileChange = (uploadFile) => {
  // 仅在选择文件后执行（过滤清空文件的情况）
  if (!uploadFile.raw) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const requiredFields = ['username', 'role', 'status']
      let successCount = 0
      let failCount = 0
      const failReasons = []

      jsonData.forEach((row, index) => {
        const missingFields = requiredFields.filter((field) => !row[field])
        if (missingFields.length > 0) {
          failCount++
          failReasons.push(`第${index + 2}行：缺少必填字段${missingFields.join(',')}`)
          return
        }

        const exists = users.value.some((u) => u.username === row.username)
        if (exists) {
          // 找到已存在的用户索引，执行更新操作
          const userIndex = users.value.findIndex((u) => u.username === row.username)
          // 保留原有核心字段（如注册时间、打卡次数等），仅更新导入的字段
          users.value[userIndex] = {
            ...users.value[userIndex], // 保留原有数据
            role: row.role, // 更新角色
            status: row.status, // 更新状态
            ...(row.password && { password: row.password }), // 若导入了密码则更新（可选）
          }
          successCount++ // 计入成功数
          return
        }

        if (!['user', 'admin'].includes(row.role)) {
          failCount++
          failReasons.push(`第${index + 2}行：角色必须为user或admin`)
          return
        }
        if (!['active', 'inactive'].includes(row.status)) {
          failCount++
          failReasons.push(`第${index + 2}行：状态必须为active或inactive`)
          return
        }

        users.value.push({
          username: row.username,
          password: row.password || '123456',
          role: row.role,
          status: row.status,
          joinDate: new Date().toLocaleString(),
          lastActive: '未活跃',
          totalCheckins: 0,
          totalPoints: 0,
          weeklyCheckins: 0,
          weeklyTarget: 5,
          weeklyCheckinRate: 0,
          badges: [],
        })
        successCount++
      })

      localStorage.setItem('systemUsers', JSON.stringify(users.value))
      importResult.value = {
        show: true,
        title: `导入完成：成功${successCount}条，失败${failCount}条`,
        desc: failReasons.length > 0 ? `失败原因：\n${failReasons.join('\n')}` : '所有用户导入成功',
        type: failCount > 0 ? 'warning' : 'success',
      }
    } catch (error) {
      importResult.value = {
        show: true,
        title: '导入失败',
        desc: `文件解析错误：${error.message}，请检查文件格式`,
        type: 'error',
      }
    }
  }
  // 原file.raw改为uploadFile.raw（适配change事件的参数）
  reader.readAsArrayBuffer(uploadFile.raw)
}

const handleExport = () => {
  if (users.value.length === 0) {
    ElMessage.warning('暂无用户数据可导出')
    return
  }

  // 补充status字段到导出数据中
  const exportData = users.value.map((user) => ({
    用户名: user.username,
    角色: user.role === 'admin' ? '管理员' : '普通用户',
    状态: user.status, // 新增：导出status原始值（active/inactive）
    注册时间: user.joinDate,
    总打卡次数: user.totalCheckins,
    总积分: user.totalPoints,
    最后活跃: user.lastActive,
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  // 调整表头顺序（可选，让字段与导入要求一致）
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [['username', 'role', 'status', '注册时间', '总打卡次数', '总积分', '最后活跃']],
    { origin: 'A1' },
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表')
  XLSX.writeFile(workbook, `用户列表_${new Date().toLocaleDateString()}.xlsx`)
  ElMessage.success('用户数据导出成功')
}

// 搜索与分页处理
const handleSearch = () => {
  currentPage.value = 1
}
const handlePageSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}
const handleCurrentPageChange = (val) => {
  currentPage.value = val
}

// 状态变更（启用/禁用）
const handleStatusChange = (user) => {
  const targetUser = users.value.find((u) => u.username === user.username)
  if (targetUser) {
    targetUser.status = user.status
    localStorage.setItem('systemUsers', JSON.stringify(users.value))
    ElMessage.success(`用户「${user.username}」已${user.status === 'active' ? '启用' : '禁用'}`)
  }
}

// 新增：打开密码重置弹窗
const openResetPasswordDialog = (user) => {
  resetPwdForm.username = user.username
  resetPwdForm.newPassword = ''
  resetPwdForm.confirmPassword = ''
  showResetPwdDialog.value = true
}

// 新增：提交密码重置
const submitResetPassword = () => {
  resetPwdFormRef.value.validate((valid) => {
    if (valid) {
      const targetUser = users.value.find((u) => u.username === resetPwdForm.username)
      if (targetUser) {
        targetUser.password = resetPwdForm.newPassword // 更新密码
        targetUser.lastActive = new Date().toLocaleString() // 记录重置时间为最后活跃
        localStorage.setItem('systemUsers', JSON.stringify(users.value))
        ElMessage.success(`用户「${resetPwdForm.username}」密码重置成功`)
        showResetPwdDialog.value = false
      }
    }
  })
}

// 新增/编辑用户弹窗
const openAddUserDialog = () => {
  isEditMode.value = false
  userFormRef.value?.resetFields()
  userForm.username = ''
  userForm.password = ''
  userForm.role = 'user'
  userForm.status = 'active'
  showUserDialog.value = true
}

const openEditUserDialog = (user) => {
  isEditMode.value = true
  userForm.username = user.username
  userForm.password = ''
  userForm.role = user.role
  userForm.status = user.status
  showUserDialog.value = true
  // 新增：加载总积分，空值默认0
  userForm.totalPoints = user.totalPoints ?? 0
  showUserDialog.value = true
}

// 提交用户表单
const submitUserForm = () => {
  userFormRef.value.validate((valid) => {
    if (valid) {
      if (isEditMode.value) {
        const index = users.value.findIndex((u) => u.username === userForm.username)
        if (index !== -1) {
          users.value[index] = {
            ...users.value[index],
            role: userForm.role,
            status: userForm.status,
            ...(userForm.password && { password: userForm.password }),
            // 保留原有注册时间，确保积分被覆盖更新
            totalPoints: userForm.totalPoints, // 新增：同步总积分的修改
            joinDate: users.value[index].joinDate, // 保留注册时间
          }
          localStorage.setItem('systemUsers', JSON.stringify(users.value))
          ElMessage.success('用户编辑成功')
          ElMessage.success('用户编辑成功（含积分更新）')
        }
      } else {
        const exists = users.value.some((u) => u.username === userForm.username)
        if (exists) {
          // 替换原“失败”逻辑为“更新用户”
          const index = users.value.findIndex((u) => u.username === userForm.username)
          users.value[index] = { ...users.value[index], ...userForm } // 用新数据覆盖旧数据
          ElMessage.success('用户信息已更新')
          return
        }
        users.value.push({
          username: userForm.username,
          password: userForm.password,
          role: userForm.role,
          status: userForm.status,
          joinDate: new Date().toLocaleString(),
          lastActive: '未活跃',
          totalCheckins: 0,
          totalPoints: 0, // 初始积分与个人页面一致
          weeklyCheckins: 0,
          weeklyTarget: 5,
          weeklyCheckinRate: 0,
          badges: [],
        })
        localStorage.setItem('systemUsers', JSON.stringify(users.value))
        ElMessage.success('用户新增成功')
      }
      showUserDialog.value = false
    }
  })
}

// 查看详情与删除用户
const openUserDetail = (user) => {
  currentUserDetail.value = { ...user, badges: user.badges || [] }
  showUserDetailDialog.value = true
}

const handleDeleteUser = (user) => {
  ElMessageBox.confirm(`确定要删除用户「${user.username}」吗？此操作不可恢复！`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    users.value = users.value.filter((u) => u.username !== user.username)
    localStorage.setItem('systemUsers', JSON.stringify(users.value))
    ElMessage.success('用户已删除')
  })
}

// 初始化
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
/* 样式与之前保持一致，新增密码重置弹窗相关样式无需额外调整 */
.user-management-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-weight: 600;
}

.page-header h2 {
  margin: 0;
  /* font-size: 20px; */
  color: #1d2129;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* .page-header h2::before {
  content: '👥';
  font-size: 24px;
} */

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
  min-width: 200px;
}
.upload-btn {
  width: auto;
}

.user-table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
}

.pagination-container {
  margin-top: 15px;
  text-align: right;
}

.user-detail-descriptions {
  margin-top: 10px;
}
.progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 13px;
  color: #666;
}

.badges-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.badge-item {
  background-color: #f0f7ff;
  color: #409eff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.no-badge {
  color: #999;
  font-size: 13px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
  }
  .search-input {
    width: 100%;
  }
}
</style>
