<template>
  <div class="template-manager">
    <div class="header-actions">
      <h3>打卡模板管理</h3>
      <el-button type="primary" @click="showAddTemplateDialog = true">
        <el-icon><Plus /></el-icon> 新增模板
      </el-button>
    </div>

    <!-- 模板列表 -->
    <el-table :data="templates" border style="width: 100%; margin-top: 20px">
      <el-table-column prop="name" label="模板名称" width="200"></el-table-column>
      <el-table-column label="字段数量" width="120">
        <template #default="scope">{{ scope.row.fields.length }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="200">
        <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑模板弹窗 -->
    <el-dialog title="编辑模板" v-model="showAddTemplateDialog" width="600px">
      <el-form ref="templateForm" :model="currentTemplate" label-width="100px">
        <el-form-item
          label="模板名称"
          prop="name"
          :rules="[{ required: true, message: '请输入模板名称' }]"
        >
          <el-input
            v-model="currentTemplate.name"
            placeholder="例如：健身打卡、学习记录"
          ></el-input>
        </el-form-item>

        <el-form-item label="自定义字段">
          <div v-for="(field, index) in currentTemplate.fields" :key="index" class="field-item">
            <el-input
              v-model="field.name"
              placeholder="字段名称（如：时长、内容）"
              style="width: 200px; margin-right: 10px"
            ></el-input>
            <el-select
              v-model="field.type"
              style="width: 150px; margin-right: 10px"
              placeholder="字段类型"
            >
              <el-option label="文本" value="text"></el-option>
              <el-option label="数字" value="number"></el-option>
              <el-option label="评分" value="rating"></el-option>
            </el-select>
            <el-button
              type="danger"
              icon="Delete"
              size="small"
              @click="currentTemplate.fields.splice(index, 1)"
              :disabled="currentTemplate.fields.length <= 1"
            ></el-button>
          </div>
          <el-button
            type="text"
            @click="currentTemplate.fields.push({ name: '', type: 'text' })"
            style="margin-top: 10px"
          >
            <el-icon><Plus /></el-icon> 添加字段
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模板列表
const templates = ref([])
// 弹窗状态
const showAddTemplateDialog = ref(false)
// 当前编辑的模板
const currentTemplate = ref({
  id: '',
  name: '',
  fields: [], // 字段配置：[{ name: '时长', type: 'number' }, ...]
  createTime: '',
})

// 加载本地存储的模板
onMounted(() => {
  const saved = localStorage.getItem('checkinTemplates')
  templates.value = saved ? JSON.parse(saved) : []
})

// 格式化日期
const formatDate = (time) => {
  return new Date(time).toLocaleString()
}

// 新增模板
// const handleAdd = () => {
//   currentTemplate.value = {
//     id: Date.now().toString(),
//     name: '',
//     fields: [{ name: '', type: 'text' }],
//     createTime: new Date().toISOString(),
//   }
//   showAddTemplateDialog.value = true
// }

// 编辑模板
const handleEdit = (template) => {
  currentTemplate.value = JSON.parse(JSON.stringify(template)) // 深拷贝
  showAddTemplateDialog.value = true
}

// 删除模板
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该模板吗？关联的打卡记录不会受影响', '确认删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    templates.value = templates.value.filter((t) => t.id !== id)
    saveTemplatesToLocal()
    ElMessage.success('模板已删除')
  })
}

// 保存模板
const saveTemplate = () => {
  if (!currentTemplate.value.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (currentTemplate.value.fields.some((f) => !f.name.trim())) {
    ElMessage.warning('请完善所有字段名称')
    return
  }

  // 新增/更新模板
  const index = templates.value.findIndex((t) => t.id === currentTemplate.value.id)
  if (index > -1) {
    templates.value[index] = currentTemplate.value
  } else {
    templates.value.push(currentTemplate.value)
  }

  saveTemplatesToLocal()
  showAddTemplateDialog.value = false
  ElMessage.success('模板保存成功')
}

// 保存到本地存储
const saveTemplatesToLocal = () => {
  localStorage.setItem('checkinTemplates', JSON.stringify(templates.value))
}
</script>

<style scoped>
.template-manager {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
}
</style>
