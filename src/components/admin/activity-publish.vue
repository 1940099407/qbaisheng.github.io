<template>
  <div class="activity-publish-container">
    <h2>发布新活动</h2>
    <el-card>
      <el-form ref="activityForm" :model="activity" label-width="120px" class="activity-form">
        <el-form-item
          label="活动名称"
          prop="name"
          :rules="[{ required: true, message: '请输入活动名称' }]"
        >
          <el-input
            v-model="activity.name"
            placeholder="请输入活动名称（如：周末跑步打卡）"
          ></el-input>
        </el-form-item>

        <el-form-item
          label="活动时间"
          prop="time"
          :rules="[{ required: true, message: '请选择活动时间' }]"
        >
          <el-date-picker
            v-model="activity.time"
            type="datetime"
            placeholder="选择活动开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="活动描述" prop="desc">
          <el-input
            type="textarea"
            v-model="activity.desc"
            rows="4"
            placeholder="请输入活动详情（如：活动规则、地点等）"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handlePublish">发布活动</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 活动列表 -->
    <div class="activity-list">
      <h3>已发布活动</h3>
      <el-table :data="publishedActivities" border style="width: 100%">
        <el-table-column prop="name" label="活动名称" width="200"></el-table-column>
        <el-table-column prop="time" label="活动时间" width="200"></el-table-column>
        <el-table-column prop="desc" label="活动描述"></el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="200"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  ElMessage,
  ElForm,
  ElFormItem,
  ElInput,
  ElDatePicker,
  ElButton,
  ElTable,
  ElTableColumn,
  ElCard,
} from 'element-plus'

// 活动表单数据
const activity = ref({
  name: '',
  time: '',
  desc: '',
})

// 已发布活动列表
const publishedActivities = ref([])

// 表单引用
const activityForm = ref(null)

// 初始化：从本地存储加载已发布活动
onMounted(() => {
  const savedActivities = localStorage.getItem('adminActivities')
  if (savedActivities) {
    publishedActivities.value = JSON.parse(savedActivities)
  }
})

// 发布活动
const handlePublish = () => {
  activityForm.value.validate((valid) => {
    if (valid) {
      // 创建活动对象（含发布时间）
      const newActivity = {
        id: Date.now().toString(), // 用时间戳作为唯一ID
        ...activity.value,
        createTime: new Date().toLocaleString(), // 本地时间格式
      }

      // 添加到列表并保存
      publishedActivities.value.unshift(newActivity) // 新增活动放前面
      localStorage.setItem('adminActivities', JSON.stringify(publishedActivities.value))

      // 重置表单并提示
      resetForm()
      ElMessage.success('活动发布成功！')
    }
  })
}

// 重置表单
const resetForm = () => {
  activityForm.value.resetFields()
}
</script>

<style scoped>
.activity-publish-container {
  padding: 20px;
}

.activity-form {
  margin-top: 15px;
}

.activity-list {
  margin-top: 30px;
}

h2,
h3 {
  margin-bottom: 15px;
  color: #333;
}
</style>
