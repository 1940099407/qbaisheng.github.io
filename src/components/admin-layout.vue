<template>
  <div class="app-container">
    <!-- 左侧导航栏（复用用户布局的样式逻辑） -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <h1 class="logo" v-if="!isCollapsed">管理员系统</h1>
        <h1 class="logo collapsed-logo" v-if="isCollapsed"></h1>
        <button class="collapse-btn" @click="toggleCollapse">
          {{ isCollapsed ? '→' : '←' }}
        </button>
      </div>

      <nav class="nav-menu">
        <router-link
          to="/admin/user-management"
          class="nav-item"
          :class="{ active: $route.path === '/admin/user-management' }"
        >
          <i class="icon">👥</i>
          <span class="nav-text" v-if="!isCollapsed">用户管理</span>
        </router-link>
        <router-link
          to="/admin/checkin-review"
          class="nav-item"
          :class="{ active: $route.path === '/admin/checkin-review' }"
        >
          <i class="icon">✅</i>
          <span class="nav-text" v-if="!isCollapsed">打卡审核</span>
        </router-link>
        <router-link
          to="/admin/approval-management"
          class="nav-item"
          :class="{ active: $route.path === '/admin/approval-management' }"
        >
          <i class="icon">📝</i>
          <span class="nav-text" v-if="!isCollapsed">审批管理</span>
        </router-link>
        <router-link
          to="/admin/activity-publish"
          class="nav-item"
          :class="{ active: $route.path === '/admin/activity-publish' }"
        >
          <i class="icon">📢</i>
          <span class="nav-text" v-if="!isCollapsed">活动发布</span>
        </router-link>
      </nav>

      <!-- 退出登录按钮（复用样式） -->
      <button class="logout-item" @click="logout">
        <span class="logout-icon">🚪</span>
        <span class="logout-text" v-if="!isCollapsed">退出登录</span>
      </button>
    </aside>

    <!-- 右侧内容区 -->
    <div class="right-container">
      <div class="user-bar">
        <div class="user-info" @click="showDropdown = !showDropdown">
          <div class="avatar-container">
            <img
              :src="userAvatar"
              alt="管理员头像"
              class="user-avatar"
              @error="handleAvatarError"
            />
          </div>
          <div class="user-details">
            <span class="username">{{ username }}（管理员）</span>
            <i class="el-icon-arrow-down arrow-icon" :class="{ rotated: showDropdown }"></i>
          </div>
          <div class="dropdown-menu" v-if="showDropdown">
            <div class="dropdown-item" @click="logout">退出登录</div>
          </div>
        </div>
      </div>

      <main class="content-wrapper">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const isCollapsed = ref(false) // 导航栏折叠状态
const showDropdown = ref(false) // 下拉菜单状态
const username = computed(() => localStorage.getItem('username') || '管理员')
const userAvatar = ref('https://picsum.photos/200/200?random=2') // 管理员默认头像

// 处理头像加载失败
const handleAvatarError = (e) => {
  e.target.src = 'https://picsum.photos/200/200?random=2'
}

// 点击外部关闭下拉菜单
onMounted(() => {
  const handleClickOutside = (e) => {
    const userInfo = document.querySelector('.user-info')
    if (userInfo && !userInfo.contains(e.target)) {
      showDropdown.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  return () => document.removeEventListener('click', handleClickOutside)
})

// 切换导航栏折叠
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '确认退出').then(() => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    router.push('/login')
    ElMessage.success('已退出登录')
  })
}
</script>

<style scoped>
/* 复用main-layout的样式（直接复制main-layout的style部分） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #001529;
  color: #fff;
  transition: width 0.3s ease;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* 其他样式直接复用main-layout的样式... */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 左侧导航栏 */
.sidebar {
  width: 220px;
  background: #001529;
  color: #fff;
  transition: width 0.3s ease;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 60px;
  border-bottom: 1px solid #1890ff;
}

.logo {
  font-size: 18px;
  margin: 0;
  flex: 1;
  color: #fff;
}

.collapsed-logo {
  font-size: 18px;
  margin: 0;
  text-align: center;
  width: 100%;
  color: #fff;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-menu {
  padding-top: 16px;
  flex: 1;
  overflow-y: auto;
}

/* 普通导航项样式 */
.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-item .icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
  margin-right: 16px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: #1890ff;
  color: #fff;
}

.nav-text {
  flex: 1;
}

/* 退出登录项（底部） */
.logout-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 20px;
  background: #18181c;
  color: rgba(255, 255, 255, 0.65);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  margin-top: auto;
  border-top: 1px solid #2c323f;
  gap: 0;
}

.logout-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
  margin-right: 8px;
  padding: 0;
}

.logout-text {
  flex: 1;
  padding: 0;
  margin: 0;
  line-height: 1;
}

.logout-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* 右侧容器 */
.right-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 顶部用户栏（优化后） */
.user-bar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 用户信息容器 */
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 5px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

/* 头像样式 */
.avatar-container {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  border: 2px solid #f0f2f5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.user-info:hover .user-avatar {
  transform: scale(1.05);
}

/* 用户名和箭头 */
.user-details {
  display: flex;
  align-items: center;
}

.username {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  margin-right: 6px;
}

.arrow-icon {
  color: #909399;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.rotated {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  width: 160px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
  padding: 4px 0;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 10px 16px;
  color: #606266;
  font-size: 14px;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: #f5f7fa;
  color: #1890ff;
}

.dropdown-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

/* 下拉菜单中的退出项 */
.dropdown-menu .logout-item {
  color: #f56c6c;
  background: transparent;
  padding: 10px 16px;
  margin: 0;
  border: none;
  justify-content: flex-start;
}

.dropdown-menu .logout-item:hover {
  color: #f56c6c;
  background: #fff5f5;
}

/* 主内容区 */
.content-wrapper {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;
  overflow-y: auto;
  max-width: calc(100vw - 220px);
  transition: max-width 0.3s ease;
}

.sidebar.collapsed ~ .right-container .content-wrapper {
  max-width: calc(100vw - 64px);
}
</style>
