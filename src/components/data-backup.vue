<template>
  <div class="data-backup">
    <h3>数据备份与导入</h3>

    <div class="backup-section">
      <h4>创建备份</h4>
      <p>将所有打卡数据导出为 JSON 文件保存到本地</p>
      <el-button type="primary" @click="exportData">导出数据</el-button>
    </div>

    <div class="import-section">
      <h4>导入备份</h4>
      <p>从 JSON 备份文件恢复数据（将覆盖现有数据）</p>
      <el-upload
        class="upload-demo"
        action="#"
        :before-upload="handleImport"
        :auto-upload="true"
        accept=".json"
      >
        <el-button type="success">选择备份文件</el-button>
      </el-upload>
    </div>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'

// 导出数据
const exportData = () => {
  try {
    // 收集所有需要备份的数据
    const backupData = {
      checkinRecords: JSON.parse(localStorage.getItem('checkinRecords') || '[]'),
      checkinTypes: JSON.parse(localStorage.getItem('checkinTypes') || '[]'),
      checkinGoals: JSON.parse(localStorage.getItem('checkinGoals') || '{}'),
      userAchievements: JSON.parse(localStorage.getItem('userAchievements') || '[]'),
      weeklyGoalsCompleted: JSON.parse(localStorage.getItem('weeklyGoalsCompleted') || '0'),
      backupTime: new Date().toLocaleString(),
    }

    // 创建JSON文件并下载
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `打卡系统备份_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('数据导出成功！')
  } catch (error) {
    ElMessage.error('数据导出失败：' + error.message)
  }
}

// 导入数据
const handleImport = (rawFile) => {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result)

      // 验证备份文件格式
      if (!importedData.checkinRecords || !importedData.checkinTypes) {
        throw new Error('备份文件格式不正确')
      }

      // 确认导入（覆盖现有数据）
      ElMessageBox.confirm(
        '确定要导入数据吗？这将覆盖当前所有的打卡记录、类型和设置。',
        '确认导入',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
        .then(() => {
          // 保存导入的数据到localStorage
          localStorage.setItem('checkinRecords', JSON.stringify(importedData.checkinRecords))
          localStorage.setItem('checkinTypes', JSON.stringify(importedData.checkinTypes))
          localStorage.setItem('checkinGoals', JSON.stringify(importedData.checkinGoals || {}))
          localStorage.setItem(
            'userAchievements',
            JSON.stringify(importedData.userAchievements || []),
          )
          localStorage.setItem(
            'weeklyGoalsCompleted',
            JSON.stringify(importedData.weeklyGoalsCompleted || 0),
          )

          ElMessage.success('数据导入成功！')
          // 刷新页面使数据生效
          setTimeout(() => window.location.reload(), 1000)
        })
        .catch(() => {
          ElMessage.info('已取消导入')
        })
    } catch (error) {
      ElMessage.error('数据导入失败：' + error.message)
    }
  }

  reader.readAsText(rawFile)
  return false // 阻止默认上传行为
}
</script>

<style scoped>
.data-backup {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.backup-section,
.import-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 16px;
}

p {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
}
</style>
