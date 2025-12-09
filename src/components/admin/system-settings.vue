<template>
  <div class="system-config-page">
    <!-- 页面标题 -->
    <div class="page-title">
      <h2>系统配置管理</h2>
      <p>配置系统基础参数、权限规则及通知策略</p>
    </div>

    <!-- 配置导航 -->
    <el-row :gutter="20" class="config-container">
      <el-col :span="6" class="config-sidebar">
        <el-menu default-active="base" class="config-menu" @select="handleMenuSelect">
          <el-menu-item index="base">
            <el-icon><Setting /></el-icon>
            <span>基础设置</span>
          </el-menu-item>
          <el-menu-item index="permission">
            <el-icon><Lock /></el-icon>
            <span>权限管理</span>
          </el-menu-item>
          <el-menu-item index="notification">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          <el-menu-item index="data">
            <el-icon><DataLine /></el-icon>
            <span>数据管理</span>
          </el-menu-item>
        </el-menu>
      </el-col>

      <!-- 配置内容区 -->
      <el-col :span="18" class="config-content">
        <!-- 基础设置 -->
        <div v-if="activeConfig === 'base'" class="config-panel">
          <h3>基础系统参数</h3>
          <el-form
            ref="baseForm"
            :model="baseConfig"
            :rules="baseFormRules"
            label-width="150px"
            class="config-form"
          >
            <el-form-item label="系统名称" prop="systemName">
              <el-input
                v-model="baseConfig.systemName"
                placeholder="输入系统名称（如：学健打卡平台）"
              />
            </el-form-item>
            <el-form-item label="系统Logo">
              <el-upload
                action="/api/upload/logo"
                list-type="picture"
                :show-file-list="false"
                :on-success="handleLogoUpload"
              >
                <img v-if="baseConfig.logoUrl" :src="baseConfig.logoUrl" class="logo-preview" />
                <el-button v-else type="primary">
                  <el-icon><Upload /></el-icon> 上传Logo
                </el-button>
              </el-upload>
            </el-form-item>
            <el-form-item label="默认时区" prop="timezone">
              <el-select v-model="baseConfig.timezone" placeholder="选择时区">
                <el-option label="UTC+8 北京时间" value="Asia/Shanghai" />
                <el-option label="UTC+0 格林尼治时间" value="UTC" />
              </el-select>
            </el-form-item>
            <el-form-item label="系统语言" prop="language">
              <el-radio-group v-model="baseConfig.language">
                <el-radio label="zh-CN">简体中文</el-radio>
                <el-radio label="en-US">英文</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="是否开放注册" prop="allowRegister">
              <el-switch
                v-model="baseConfig.allowRegister"
                active-text="允许"
                inactive-text="禁止"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBaseConfig">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 权限管理 -->
        <div v-if="activeConfig === 'permission'" class="config-panel">
          <h3>角色权限配置</h3>
          <el-table :data="roles" border style="margin-bottom: 20px">
            <el-table-column prop="id" label="角色ID" width="80" />
            <el-table-column prop="name" label="角色名称" />
            <el-table-column prop="desc" label="角色描述" />
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button size="small" @click="editRole(scope.row)">编辑权限</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 权限编辑弹窗 -->
          <el-dialog title="编辑角色权限" v-model="showRoleDialog" width="600px">
            <el-tree
              :data="permissionTree"
              show-checkbox
              node-key="id"
              :default-checked-keys="checkedPermissions"
              @check-change="handlePermissionChange"
            />
            <template #footer>
              <el-button @click="showRoleDialog = false">取消</el-button>
              <el-button type="primary" @click="saveRolePermission">保存权限</el-button>
            </template>
          </el-dialog>
        </div>

        <!-- 通知设置 -->
        <div v-if="activeConfig === 'notification'" class="config-panel">
          <h3>通知渠道配置</h3>
          <el-form
            :model="notificationConfig"
            :rules="emailRules"
            label-width="150px"
            class="config-form"
          >
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationConfig.email.enabled" @change="toggleEmailConfig" />
              <el-collapse v-if="notificationConfig.email.enabled">
                <el-collapse-item title="邮件服务器配置">
                  <el-form-item label="SMTP服务器" prop="email.smtpServer">
                    <el-input v-model="notificationConfig.email.smtpServer" />
                  </el-form-item>
                  <el-form-item label="端口" prop="email.port">
                    <el-input v-model.number="notificationConfig.email.port" />
                  </el-form-item>
                  <el-form-item label="发送账号" prop="email.account">
                    <el-input v-model="notificationConfig.email.account" />
                  </el-form-item>
                  <el-form-item label="授权密码" prop="email.password">
                    <el-input v-model="notificationConfig.email.password" type="password" />
                  </el-form-item>
                </el-collapse-item>
              </el-collapse>
            </el-form-item>

            <el-form-item label="短信通知">
              <el-switch v-model="notificationConfig.sms.enabled" />
            </el-form-item>

            <el-form-item label="通知模板">
              <el-select v-model="activeTemplateType" placeholder="选择通知类型">
                <el-option label="打卡提醒" value="checkin_remind" />
                <el-option label="活动开始" value="activity_start" />
              </el-select>
              <el-input
                v-model="notificationTemplates[activeTemplateType]"
                type="textarea"
                rows="4"
                placeholder="使用{{变量名}}插入动态内容（如：{{username}}、{{activityName}}）"
                style="margin-top: 10px"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveNotificationConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据管理 -->
        <div v-if="activeConfig === 'data'" class="config-panel">
          <h3>数据备份与清理</h3>
          <el-card>
            <h4>自动备份设置</h4>
            <el-form :model="dataConfig.backup" label-width="150px" class="config-form">
              <el-form-item label="启用自动备份">
                <el-switch v-model="dataConfig.backup.enabled" />
              </el-form-item>
              <el-form-item label="备份周期">
                <el-select v-model="dataConfig.backup.cycle">
                  <el-option label="每日" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </el-form-item>
              <el-form-item label="保留备份数量">
                <el-input v-model.number="dataConfig.backup.keepCount" />
              </el-form-item>
            </el-form>
          </el-card>

          <el-card style="margin-top: 20px">
            <h4>数据清理规则</h4>
            <el-form :model="dataConfig.clean" label-width="150px" class="config-form">
              <el-form-item label="清理过期打卡数据">
                <el-switch v-model="dataConfig.clean.expiredCheckin" />
                <el-select v-model="dataConfig.clean.checkinExpireDays" style="margin-left: 10px">
                  <el-option label="30天前" value="30" />
                  <el-option label="90天前" value="90" />
                  <el-option label="180天前" value="180" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="warning" @click="handleCleanData" :loading="cleanLoading">
                  立即执行清理
                </el-button>
                <el-button type="primary" style="margin-left: 10px" @click="saveDataConfig">
                  保存规则
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Lock, Bell, DataLine, Upload } from '@element-plus/icons-vue'

// 激活的配置项
const activeConfig = ref('base')

// 基础设置数据及验证规则
const baseConfig = reactive({
  systemName: '学健打卡系统',
  logoUrl: '',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  allowRegister: true,
})

const baseFormRules = reactive({
  systemName: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  timezone: [{ required: true, message: '请选择时区', trigger: 'change' }],
  language: [{ required: true, message: '请选择系统语言', trigger: 'change' }],
})

// 角色权限数据
const roles = ref([
  { id: 1, name: '超级管理员', desc: '拥有系统全部权限' },
  { id: 2, name: '活动管理员', desc: '管理活动及打卡数据' },
  { id: 3, name: '普通用户', desc: '参与活动及打卡' },
])
const permissionTree = ref([
  {
    id: 'system',
    label: '系统管理',
    children: [
      { id: 'system.config', label: '配置管理' },
      { id: 'system.user', label: '用户管理' },
    ],
  },
  {
    id: 'activity',
    label: '活动管理',
    children: [
      { id: 'activity.create', label: '创建活动' },
      { id: 'activity.edit', label: '编辑活动' },
    ],
  },
])
const showRoleDialog = ref(false)
const currentRole = ref(null)
const checkedPermissions = ref([])

// 通知配置数据及验证规则
const notificationConfig = reactive({
  email: {
    enabled: true,
    smtpServer: 'smtp.qq.com',
    port: 465,
    account: 'notifications@example.com',
    password: '',
  },
  sms: {
    enabled: false,
  },
})

const emailRules = reactive({
  'email.smtpServer': [{ required: true, message: '请输入SMTP服务器', trigger: 'blur' }],
  'email.port': [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', message: '端口号必须为数字', trigger: 'blur' },
  ],
  'email.account': [{ required: true, message: '请输入发送账号', trigger: 'blur' }],
  'email.password': [{ required: true, message: '请输入授权密码', trigger: 'blur' }],
})

const notificationTemplates = reactive({
  checkin_remind: '亲爱的{{username}}，您参与的{{activityName}}活动今日尚未打卡，记得完成哦！',
  activity_start: '{{activityName}}活动已开始，点击查看详情并参与：{{link}}',
})
const activeTemplateType = ref('checkin_remind')

// 数据管理配置
const dataConfig = reactive({
  backup: {
    enabled: true,
    cycle: 'weekly',
    keepCount: 10,
  },
  clean: {
    expiredCheckin: false,
    checkinExpireDays: '90',
  },
})
const cleanLoading = ref(false)

// 切换配置项
const handleMenuSelect = (key) => {
  activeConfig.value = key
}

// 上传Logo
const handleLogoUpload = (response) => {
  if (response.code === 200) {
    baseConfig.logoUrl = response.data.url
    ElMessage.success('Logo上传成功')
  }
}

// 保存基础设置
const saveBaseConfig = () => {
  // 模拟接口请求
  setTimeout(() => {
    ElMessage.success('基础设置保存成功')
  }, 500)
}

// 编辑角色权限
const editRole = (role) => {
  currentRole.value = role
  // 模拟获取角色已有权限
  if (role.id === 1) {
    checkedPermissions.value = ['system.config', 'system.user', 'activity.create', 'activity.edit']
  } else if (role.id === 2) {
    checkedPermissions.value = ['activity.create', 'activity.edit']
  } else {
    checkedPermissions.value = []
  }
  showRoleDialog.value = true
}

// 权限变更处理
const handlePermissionChange = (data, checked, indeterminate) => {
  // 选中时添加权限
  if (checked && !indeterminate) {
    if (!checkedPermissions.value.includes(data.id)) {
      checkedPermissions.value.push(data.id)
    }
  }
  // 取消选中时移除权限
  if (!checked && !indeterminate) {
    checkedPermissions.value = checkedPermissions.value.filter((id) => id !== data.id)
  }
}

// 保存角色权限
const saveRolePermission = () => {
  showRoleDialog.value = false
  ElMessage.success(`角色【${currentRole.value.name}】权限保存成功`)
}

// 切换邮件配置显示
const toggleEmailConfig = () => {
  if (!notificationConfig.email.enabled) {
    ElMessage.info('已关闭邮件通知，相关配置将不生效')
  }
}

// 保存通知配置
const saveNotificationConfig = () => {
  setTimeout(() => {
    ElMessage.success('通知设置保存成功')
  }, 500)
}

// 执行数据清理
const handleCleanData = () => {
  ElMessageBox.confirm('确定要执行数据清理吗？清理后的数据将无法恢复', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    cleanLoading.value = true
    setTimeout(() => {
      cleanLoading.value = false
      ElMessage.success('数据清理完成')
    }, 800)
  })
}

// 保存数据管理配置
const saveDataConfig = () => {
  setTimeout(() => {
    ElMessage.success('数据管理规则保存成功')
  }, 500)
}
</script>

<style scoped>
.system-config-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-title {
  margin-bottom: 30px;
}

.page-title p {
  color: #666;
  margin-top: 8px;
}

.config-container {
  margin-top: 20px;
}

.config-sidebar {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.config-menu {
  border-right: none;
  height: 100%;
  min-height: 600px;
}

.config-content {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.config-panel {
  animation: fadeIn 0.3s ease;
}

.config-panel h3 {
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.config-form {
  margin-top: 20px;
}

.logo-preview {
  width: 120px;
  height: 40px;
  object-fit: contain;
  border: 1px dashed #ccc;
  border-radius: 4px;
  padding: 5px;
}

.el-collapse {
  margin-top: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.el-collapse-item__content {
  padding-top: 15px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
