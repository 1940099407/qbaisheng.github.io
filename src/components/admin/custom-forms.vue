<template>
  <div class="custom-forms-page">
    <div class="page-header">
      <h2>自定义表单与模板管理</h2>
      <div class="header-actions">
        <!-- 模板分类筛选 -->
        <el-select
          v-model="selectedCategory"
          placeholder="所有分类"
          style="width: 160px; margin-right: 10px"
          @change="filterTemplates"
        >
          <el-option label="所有分类" value="" />
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>

        <!-- 搜索框 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板名称"
          style="width: 200px; margin-right: 10px"
          clearable
          @input="handleSearch"
        />

        <!-- 新增按钮 -->
        <el-button type="primary" @click="showAddFormDialog = true">
          <el-icon><Plus /></el-icon> 新增表单模板
        </el-button>
      </div>
    </div>

    <!-- 表单模板列表 -->
    <el-card>
      <el-table
        :data="filteredTemplates"
        border
        style="width: 100%"
        empty-text="暂无模板数据，请点击新增按钮创建"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="模板名称" width="200" />
        <el-table-column
          prop="categoryId"
          label="所属分类"
          width="120"
          :formatter="formatCategory"
        />
        <el-table-column label="字段数量" width="100">
          <template #default="scope">{{ scope.row.fields.length }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="usedCount" label="使用次数" width="100" />
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button size="small" @click="previewTemplate(scope.row)">预览</el-button>
            <el-button size="small" type="primary" @click="editTemplate(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="copyTemplate(scope.row)">复制</el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteTemplate(scope.row.id)"
              :disabled="scope.row.usedCount > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑表单模板弹窗 -->
    <el-dialog
      :title="isEditMode ? '编辑表单模板' : '新增表单模板'"
      v-model="showAddFormDialog"
      width="700px"
      :destroy-on-close="true"
    >
      <el-form
        ref="formTemplateRef"
        :model="currentTemplate"
        label-width="100px"
        :rules="formRules"
        class="form-template"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="currentTemplate.name" placeholder="请输入模板名称" />
        </el-form-item>

        <el-form-item label="所属分类" prop="categoryId">
          <el-select v-model="currentTemplate.categoryId" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="表单字段">
          <!-- 字段列表 -->
          <div
            v-for="(field, index) in currentTemplate.fields"
            :key="index"
            class="field-item"
            :class="{ 'field-item-active': activeFieldIndex === index }"
          >
            <div class="field-basic">
              <el-input
                v-model="field.label"
                placeholder="字段标签"
                style="width: 150px; margin-right: 10px"
              />
              <el-select
                v-model="field.type"
                style="width: 150px; margin-right: 10px"
                placeholder="字段类型"
                @change="handleFieldTypeChange(index)"
              >
                <el-option label="文本" value="text" />
                <el-option label="数字" value="number" />
                <el-option label="单选" value="radio" />
                <el-option label="多选" value="checkbox" />
                <el-option label="日期" value="date" />
                <el-option label="多行文本" value="textarea" />
              </el-select>
              <el-checkbox v-model="field.required" label="必填" style="margin-right: 10px" />
              <el-button
                type="danger"
                size="small"
                icon="Delete"
                @click="removeField(index)"
                :disabled="currentTemplate.fields.length <= 1"
              />
              <el-button type="text" size="small" @click="activeFieldIndex = index">
                高级设置
              </el-button>
            </div>

            <!-- 字段高级设置（根据类型动态显示） -->
            <div v-if="activeFieldIndex === index" class="field-advanced">
              <el-divider content-position="left">高级设置</el-divider>

              <!-- 通用设置 -->
              <el-form-item label="占位提示" prop="placeholder">
                <el-input v-model="field.placeholder" placeholder="例如：请输入内容" />
              </el-form-item>

              <!-- 单选/多选选项设置 -->
              <template v-if="['radio', 'checkbox'].includes(field.type)">
                <el-form-item label="选项配置">
                  <el-tag
                    v-for="(opt, optIdx) in field.options"
                    :key="optIdx"
                    closable
                    @close="removeOption(index, optIdx)"
                  >
                    {{ opt }}
                  </el-tag>
                  <el-input
                    v-model="newOptionText"
                    placeholder="添加选项"
                    style="width: 200px; margin-top: 10px"
                    @keyup.enter="addOption(index)"
                  />
                  <el-button
                    type="text"
                    size="small"
                    @click="addOption(index)"
                    style="vertical-align: bottom"
                  >
                    添加
                  </el-button>
                </el-form-item>
              </template>

              <!-- 数字类型设置 -->
              <template v-if="field.type === 'number'">
                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-form-item label="最小值">
                      <el-input v-model.number="field.min" type="number" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="最大值">
                      <el-input v-model.number="field.max" type="number" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </template>

              <!-- 文本/多行文本设置 -->
              <template v-if="['text', 'textarea'].includes(field.type)">
                <el-form-item label="最大长度">
                  <el-input
                    v-model.number="field.maxLength"
                    type="number"
                    placeholder="0表示不限制"
                  />
                </el-form-item>
              </template>
            </div>
          </div>

          <el-button type="text" @click="addField" style="margin-top: 10px">
            <el-icon><Plus /></el-icon> 添加字段
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFormDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 表单预览弹窗（修复后） -->
    <el-dialog title="表单预览" v-model="showPreviewDialog" width="600px">
      <div class="preview-container">
        <h3 style="text-align: center; margin-bottom: 20px">{{ previewTemplateData.name }}</h3>
        <el-form :model="previewFormData" label-width="100px">
          <el-form-item
            v-for="(field, index) in previewTemplateData.fields"
            :key="index"
            :label="field.label"
            :required="field.required"
          >
            <!-- 文本类型 -->
            <el-input
              v-if="field.type === 'text'"
              v-model="previewFormData[`field_${index}`]"
              :placeholder="field.placeholder"
              :maxlength="field.maxLength || undefined"
            />

            <!-- 数字类型 -->
            <el-input
              v-else-if="field.type === 'number'"
              v-model.number="previewFormData[`field_${index}`]"
              type="number"
              :placeholder="field.placeholder"
              :min="field.min"
              :max="field.max"
            />

            <!-- 单选类型 -->
            <el-radio-group
              v-else-if="field.type === 'radio'"
              v-model="previewFormData[`field_${index}`]"
            >
              <el-radio
                v-for="(opt, optIdx) in field.options"
                :key="optIdx"
                :label="opt"
                style="margin-right: 15px"
              >
                {{ opt }}
              </el-radio>
            </el-radio-group>

            <!-- 多选类型 -->
            <el-checkbox-group
              v-else-if="field.type === 'checkbox'"
              v-model="previewFormData[`field_${index}`]"
            >
              <el-checkbox
                v-for="(opt, optIdx) in field.options"
                :key="optIdx"
                :label="opt"
                style="margin-right: 15px"
              >
                {{ opt }}
              </el-checkbox>
            </el-checkbox-group>

            <!-- 日期类型 -->
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="previewFormData[`field_${index}`]"
              type="date"
              :placeholder="field.placeholder"
            />

            <!-- 多行文本类型 -->
            <el-input
              v-else-if="field.type === 'textarea'"
              v-model="previewFormData[`field_${index}`]"
              type="textarea"
              :placeholder="field.placeholder"
              :maxlength="field.maxLength || undefined"
              rows="3"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭预览</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { Plus } from '@element-plus/icons-vue' // 补充导入Delete图标

// 分类数据
const categories = ref([
  { id: 1, name: '打卡表单' },
  { id: 2, name: '评估表单' },
  { id: 3, name: '反馈表单' },
  { id: 4, name: '报名表单' },
])

// 表单模板数据
const formTemplates = ref([
  {
    id: 1,
    name: '日常打卡模板',
    categoryId: 1,
    fields: [
      {
        label: '打卡内容',
        type: 'text',
        required: true,
        placeholder: '请输入今日打卡内容',
        maxLength: 100,
      },
      {
        label: '时长(分钟)',
        type: 'number',
        required: true,
        min: 5,
        max: 1440,
      },
      {
        label: '完成情况',
        type: 'radio',
        required: true,
        options: ['全部完成', '部分完成', '未完成'],
      },
    ],
    createTime: '2023-06-15 10:30',
    usedCount: 128,
  },
  {
    id: 2,
    name: '月度评估表',
    categoryId: 2,
    fields: [
      {
        label: '本月目标',
        type: 'text',
        required: true,
        placeholder: '请输入本月目标',
      },
      {
        label: '完成度',
        type: 'number',
        required: true,
        min: 0,
        max: 100,
        placeholder: '0-100之间的数字',
      },
      {
        label: '下月计划',
        type: 'textarea',
        required: false,
        maxLength: 500,
      },
    ],
    createTime: '2023-06-01 09:15',
    usedCount: 56,
  },
])

// 搜索与筛选
const searchKeyword = ref('')
const selectedCategory = ref('')
const filteredTemplates = computed(() => {
  return formTemplates.value.filter((template) => {
    const matchesSearch = template.name.includes(searchKeyword.value)
    const matchesCategory =
      !selectedCategory.value || template.categoryId === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

// 弹窗状态
const showAddFormDialog = ref(false)
const showPreviewDialog = ref(false)
const isEditMode = ref(false)
const activeFieldIndex = ref(-1) // 当前激活的字段索引（用于显示高级设置）
const newOptionText = ref('') // 新增选项的临时文本

// 当前编辑的模板
const currentTemplate = reactive({
  id: null,
  name: '',
  categoryId: null,
  fields: [
    {
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      min: null,
      max: null,
      maxLength: 0,
    },
  ],
})

// 预览相关
const previewTemplateData = ref({})
const previewFormData = ref({})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

// 添加字段
const addField = () => {
  currentTemplate.fields.push({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: [],
    min: null,
    max: null,
    maxLength: 0,
  })
}

// 移除字段
const removeField = (index) => {
  currentTemplate.fields.splice(index, 1)
  if (activeFieldIndex.value === index) {
    activeFieldIndex.value = -1
  }
}

// 字段类型变化时重置相关配置
const handleFieldTypeChange = (index) => {
  const field = currentTemplate.fields[index]
  // 重置与类型相关的配置
  if (!['radio', 'checkbox'].includes(field.type)) {
    field.options = []
  }
  if (field.type !== 'number') {
    field.min = null
    field.max = null
  }
  if (!['text', 'textarea'].includes(field.type)) {
    field.maxLength = 0
  }
}

// 添加选项（单选/多选）
const addOption = (fieldIndex) => {
  if (!newOptionText.value.trim()) return
  currentTemplate.fields[fieldIndex].options.push(newOptionText.value.trim())
  newOptionText.value = ''
}

// 移除选项
const removeOption = (fieldIndex, optIndex) => {
  currentTemplate.fields[fieldIndex].options.splice(optIndex, 1)
}

// 编辑模板
const editTemplate = (template) => {
  isEditMode.value = true
  // 深拷贝避免直接修改原数据
  Object.assign(currentTemplate, JSON.parse(JSON.stringify(template)))
  activeFieldIndex.value = -1
  showAddFormDialog.value = true
}

// 复制模板
const copyTemplate = (template) => {
  const newTemplate = JSON.parse(JSON.stringify(template))
  newTemplate.id = Date.now()
  newTemplate.name = `${template.name}_副本`
  newTemplate.createTime = new Date().toLocaleString()
  newTemplate.usedCount = 0
  formTemplates.value.push(newTemplate)
  ElMessage.success('模板复制成功')
}

// 预览模板（修复后）
const previewTemplate = (template) => {
  previewTemplateData.value = JSON.parse(JSON.stringify(template))
  // 初始化预览表单数据（适配不同字段类型）
  const previewData = {}
  template.fields.forEach((field, index) => {
    const key = `field_${index}`
    if (field.type === 'checkbox') {
      previewData[key] = [] // 多选初始化为空数组
    } else if (field.type === 'date') {
      previewData[key] = null // 日期初始化为null
    } else if (field.type === 'radio' && field.options.length > 0) {
      previewData[key] = field.options[0] // 单选默认选第一个选项
    } else {
      previewData[key] = '' // 其他类型初始化为空字符串
    }
  })
  previewFormData.value = previewData
  showPreviewDialog.value = true
}

// 删除模板
const deleteTemplate = (id) => {
  const template = formTemplates.value.find((t) => t.id === id)
  ElMessageBox.confirm(`确定要删除模板"${template.name}"吗？删除后将无法恢复`, '确认删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    formTemplates.value = formTemplates.value.filter((item) => item.id !== id)
    ElMessage.success('模板已删除')
  })
}

// 保存模板
const saveTemplate = () => {
  // 简单验证
  if (!currentTemplate.name || !currentTemplate.categoryId) {
    ElMessage.error('请完善模板名称和分类信息')
    return
  }
  // 验证单选/多选字段的选项配置
  const hasInvalidField = currentTemplate.fields.some((field) => {
    if (['radio', 'checkbox'].includes(field.type) && field.options.length === 0) {
      ElMessage.error(`字段"${field.label}"需配置至少一个选项`)
      return true
    }
    return false
  })
  if (hasInvalidField) return

  if (isEditMode.value) {
    // 编辑模式
    const index = formTemplates.value.findIndex((item) => item.id === currentTemplate.id)
    if (index !== -1) {
      formTemplates.value[index] = { ...currentTemplate }
    }
    ElMessage.success('模板更新成功')
  } else {
    // 新增模式
    currentTemplate.id = Date.now()
    currentTemplate.createTime = new Date().toLocaleString()
    currentTemplate.usedCount = 0
    formTemplates.value.push({ ...currentTemplate })
    ElMessage.success('模板创建成功')
  }

  showAddFormDialog.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  currentTemplate.id = null
  currentTemplate.name = ''
  currentTemplate.categoryId = null
  currentTemplate.fields = [
    {
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      min: null,
      max: null,
      maxLength: 0,
    },
  ]
  isEditMode.value = false
  activeFieldIndex.value = -1
  newOptionText.value = ''
}

// 搜索防抖计时器
let timer = null

// 搜索处理
const handleSearch = (val) => {
  searchKeyword.value = val // 使用参数val更新搜索关键词
  // 搜索防抖
  clearTimeout(timer)
  timer = setTimeout(() => {
    // 后续可添加后端搜索接口逻辑
  }, 300)
}

// 筛选模板（computed自动处理）
const filterTemplates = () => {}

// 格式化分类显示
const formatCategory = (row) => {
  const category = categories.value.find((cat) => cat.id === row.categoryId)
  return category ? category.name : '未分类'
}
</script>
<style scoped>
.custom-forms-page {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.field-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  transition: all 0.3s;
}

.field-item-active {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}

.field-basic {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.field-advanced {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e6eb;
}

.preview-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .field-basic {
    flex-direction: column;
    align-items: flex-start;
  }
  .field-basic .el-input,
  .field-basic .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }
}
</style>
