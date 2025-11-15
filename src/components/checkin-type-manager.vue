<template>
  <div class="type-manager-container">
    <h3>打卡类型管理</h3>

    <!-- 添加新类型 -->
    <div class="add-type-form">
      <input
        v-model="newTypeName"
        placeholder="输入新打卡类型（如：工作、运动）"
        class="type-input"
      />
      <button @click="addType" class="add-btn">添加类型</button>
    </div>

    <!-- 类型列表 -->
    <div class="type-list">
      <div class="type-item" v-for="(type, index) in checkinTypes" :key="index">
        <span class="type-name">{{ type }}</span>
        <div class="type-actions">
          <button @click="editType(index)" class="edit-btn">编辑</button>
          <button @click="deleteType(index)" class="delete-btn">删除</button>
        </div>
      </div>
    </div>

    <!-- 编辑类型弹窗 -->
    <div class="modal-mask" v-if="isEditModalShow">
      <div class="modal-content">
        <h4>编辑类型</h4>
        <input v-model="editTypeName" class="type-input" />
        <div class="modal-btns">
          <button @click="cancelEdit" class="cancel-btn">取消</button>
          <button @click="confirmEdit" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 新类型输入框
const newTypeName = ref('')
// 编辑相关
const isEditModalShow = ref(false)
const editIndex = ref(-1)
const editTypeName = ref('')
// 打卡类型列表
const checkinTypes = ref(['学习', '健身', '阅读', '其他']) // 默认类型

// 从本地存储加载类型
const loadTypes = () => {
  const saved = localStorage.getItem('checkinTypes')
  if (saved) {
    checkinTypes.value = JSON.parse(saved)
  }
}

// 保存类型到本地存储
const saveTypes = () => {
  localStorage.setItem('checkinTypes', JSON.stringify(checkinTypes.value))
}

// 监听类型变化，自动保存
watch(checkinTypes, saveTypes, { deep: true })

// 页面加载时加载类型
onMounted(() => {
  loadTypes()
})

// 添加新类型
const addType = () => {
  const type = newTypeName.value.trim()
  if (!type) {
    ElMessage.warning('类型名称不能为空')
    return
  }
  if (checkinTypes.value.includes(type)) {
    ElMessage.warning('该类型已存在')
    return
  }
  checkinTypes.value.push(type)
  newTypeName.value = ''
  ElMessage.success('类型添加成功')
}

// 编辑类型
const editType = (index) => {
  editIndex.value = index
  editTypeName.value = checkinTypes.value[index]
  isEditModalShow.value = true
}

// 取消编辑
const cancelEdit = () => {
  isEditModalShow.value = false
  editIndex.value = -1
  editTypeName.value = ''
}

// 确认编辑
const confirmEdit = () => {
  const type = editTypeName.value.trim()
  if (!type) {
    ElMessage.warning('类型名称不能为空')
    return
  }
  if (checkinTypes.value.includes(type) && type !== checkinTypes.value[editIndex.value]) {
    ElMessage.warning('该类型已存在')
    return
  }
  checkinTypes.value[editIndex.value] = type
  isEditModalShow.value = false
  ElMessage.success('类型编辑成功')
}

// 删除类型
const deleteType = (index) => {
  // 不能删除最后一个类型
  if (checkinTypes.value.length <= 1) {
    ElMessage.warning('至少保留一个打卡类型')
    return
  }
  checkinTypes.value.splice(index, 1)
  ElMessage.success('类型删除成功')
}
</script>

<style scoped>
.type-manager-container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.type-manager-container h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
}

.add-type-form {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
}

.type-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.add-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #096dd9;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: background 0.2s;
}

.type-item:hover {
  background: #f9f9f9;
}

.type-name {
  font-size: 16px;
  color: #333;
}

.type-actions {
  display: flex;
  gap: 10px;
}

.edit-btn {
  padding: 5px 10px;
  background: #f5a623;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn {
  padding: 5px 10px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 300px;
}

.modal-content h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 16px;
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 15px;
  background: #eee;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 15px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
