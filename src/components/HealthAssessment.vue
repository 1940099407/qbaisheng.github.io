<template>
  <div class="health-container">
    <el-page-header content="健康测评与指导" />

    <el-tabs v-model="activeTab" class="health-tabs">
      <el-tab-pane label="开始测评" name="assessment"></el-tab-pane>
      <el-tab-pane label="测评历史" name="history"></el-tab-pane>
    </el-tabs>

    <!-- 开始测评 -->
    <div v-if="activeTab === 'assessment'">
      <el-card class="assessment-card">
        <el-stepper
          v-model="activeStep"
          :steps="steps"
          @change="handleStepChange"
          direction="vertical"
        >
          <template #default="{ step }">
            <!-- 第一步：基本信息 -->
            <div v-if="step === 0" class="step-content">
              <h3 class="step-title">基本身体信息</h3>
              <el-form :model="assessmentData.baseInfo" class="step-form">
                <el-form-item label="身高(cm)" prop="height">
                  <el-input
                    v-model.number="assessmentData.baseInfo.height"
                    type="number"
                    placeholder="请输入"
                    @input="validateBaseInfo"
                  ></el-input>
                </el-form-item>
                <el-form-item label="体重(kg)" prop="weight">
                  <el-input
                    v-model.number="assessmentData.baseInfo.weight"
                    type="number"
                    placeholder="请输入"
                    @input="validateBaseInfo"
                  ></el-input>
                </el-form-item>
                <el-form-item label="年龄" prop="age">
                  <el-input
                    v-model.number="assessmentData.baseInfo.age"
                    type="number"
                    placeholder="请输入"
                    @input="validateBaseInfo"
                  ></el-input>
                </el-form-item>
                <el-form-item label="性别" prop="gender">
                  <el-radio-group v-model="assessmentData.baseInfo.gender">
                    <el-radio label="male">男</el-radio>
                    <el-radio label="female">女</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>

              <!-- BMI计算结果 -->
              <div v-if="bmiValue" class="bmi-result">
                <h4>BMI指数：{{ bmiValue.toFixed(1) }}</h4>
                <p class="bmi-desc">{{ getBMIDesc(bmiValue) }}</p>
              </div>
            </div>

            <!-- 第二步：生活习惯 -->
            <div v-if="step === 1" class="step-content">
              <h3 class="step-title">生活习惯调查</h3>
              <el-form :model="assessmentData.habits" class="step-form">
                <el-form-item label="睡眠质量">
                  <el-radio-group v-model="assessmentData.habits.sleep">
                    <el-radio label="excellent">良好（7-8小时/天，深度睡眠充足）</el-radio>
                    <el-radio label="good">一般（6-7小时/天，偶尔失眠）</el-radio>
                    <el-radio label="poor">较差（少于6小时/天，经常失眠）</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="每周运动次数">
                  <el-radio-group v-model="assessmentData.habits.exercise">
                    <el-radio label="0">几乎不运动</el-radio>
                    <el-radio label="1-2">1-2次</el-radio>
                    <el-radio label="3-5">3-5次</el-radio>
                    <el-radio label="5+">5次以上</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="饮食习惯">
                  <el-radio-group v-model="assessmentData.habits.diet">
                    <el-radio label="healthy">健康（均衡饮食，少油腻辛辣）</el-radio>
                    <el-radio label="general">一般（偶尔外卖，饮食不规律）</el-radio>
                    <el-radio label="unhealthy">不健康（经常外卖，高油高糖）</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="压力水平">
                  <el-radio-group v-model="assessmentData.habits.stress">
                    <el-radio label="low">较低（心态平和，压力小）</el-radio>
                    <el-radio label="medium">中等（有一定压力，可自我调节）</el-radio>
                    <el-radio label="high">较高（压力大，难以调节）</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>

            <!-- 第三步：健康状况 -->
            <div v-if="step === 2" class="step-content">
              <h3 class="step-title">健康状况自评</h3>
              <el-form :model="assessmentData.health" class="step-form">
                <el-form-item label="是否有慢性疾病">
                  <el-radio-group v-model="assessmentData.health.chronicDisease">
                    <el-radio label="no">无</el-radio>
                    <el-radio label="yes">有（可在备注说明）</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item
                  v-if="assessmentData.health.chronicDisease === 'yes'"
                  label="疾病说明"
                >
                  <el-input
                    type="textarea"
                    v-model="assessmentData.health.diseaseDesc"
                    rows="2"
                  ></el-input>
                </el-form-item>
                <el-form-item label="近期身体状态">
                  <el-radio-group v-model="assessmentData.health.status">
                    <el-radio label="excellent">良好（精力充沛，无不适）</el-radio>
                    <el-radio label="good">一般（偶尔疲劳，无明显不适）</el-radio>
                    <el-radio label="poor">较差（经常疲劳，有明显不适）</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="健康诉求">
                  <el-input
                    type="textarea"
                    v-model="assessmentData.health.demand"
                    rows="2"
                    placeholder="例如：减重、增肌、改善睡眠等"
                  ></el-input>
                </el-form-item>
              </el-form>
            </div>

            <!-- 第四步：测评结果 -->
            <div v-if="step === 3" class="step-content result-step">
              <h3 class="step-title">健康测评结果</h3>

              <div v-if="!showResult" class="result-loading">
                <el-button type="primary" @click="calculateResult">生成测评报告</el-button>
              </div>

              <div v-else class="result-content">
                <div class="score-card">
                  <h4>综合健康评分</h4>
                  <div class="score-value">{{ result.score }}</div>
                  <div class="score-level">{{ getScoreLevel(result.score) }}</div>
                </div>

                <el-divider></el-divider>

                <div class="advice-section">
                  <h4>个性化健康建议</h4>
                  <div class="advice-list">
                    <p v-for="(advice, idx) in result.advices" :key="idx" class="advice-item">
                      <i class="el-icon el-icon-info"></i> {{ advice }}
                    </p>
                  </div>
                </div>

                <el-divider></el-divider>

                <div class="action-section">
                  <h4>推荐行动计划</h4>
                  <div class="action-list">
                    <div v-for="(action, idx) in result.actions" :key="idx" class="action-item">
                      <el-tag :type="action.type">{{ action.title }}</el-tag>
                      <p>{{ action.desc }}</p>
                    </div>
                  </div>
                </div>

                <div class="result-footer">
                  <el-button type="primary" @click="saveResult">保存测评报告</el-button>
                  <el-button @click="resetAssessment">重新测评</el-button>
                </div>
              </div>
            </div>
          </template>
        </el-stepper>

        <!-- 步骤导航按钮 -->
        <div class="stepper-nav">
          <el-button v-if="activeStep > 0" @click="activeStep--" class="prev-btn">
            上一步
          </el-button>

          <el-button
            v-if="activeStep < steps.length - 1"
            type="primary"
            @click="nextStep"
            :disabled="!canNextStep"
            class="next-btn"
          >
            下一步
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 测评历史 -->
    <div v-if="activeTab === 'history'">
      <el-card class="history-card">
        <div class="history-header">
          <h3>我的测评记录</h3>
        </div>

        <div v-if="assessmentHistory.length > 0" class="history-list">
          <el-table :data="assessmentHistory" border fit>
            <el-table-column prop="date" label="测评日期" width="120"></el-table-column>
            <el-table-column prop="score" label="健康评分" width="100">
              <template #default="scope">
                <el-tag :type="getScoreTag(scope.row.score)">{{ scope.row.score }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="bmi" label="BMI指数" width="100"></el-table-column>
            <el-table-column prop="level" label="健康等级" width="120"></el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="text" @click="viewHistoryDetail(scope.row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-else class="empty-history">暂无测评记录，快去开始第一次健康测评吧~</div>
      </el-card>

      <!-- 历史详情弹窗 -->
      <el-dialog v-model="showHistoryModal" title="测评详情" width="600px">
        <div v-if="currentHistory" class="history-detail">
          <div class="detail-header">
            <h3>测评日期：{{ currentHistory.date }}</h3>
            <div class="detail-score">
              综合评分：<span class="score">{{ currentHistory.score }}</span>
              <span class="level">{{ currentHistory.level }}</span>
            </div>
          </div>

          <el-divider></el-divider>

          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="info-list">
              <span>身高：{{ currentHistory.baseInfo.height }}cm</span>
              <span>体重：{{ currentHistory.baseInfo.weight }}kg</span>
              <span>BMI：{{ currentHistory.bmi }}</span>
              <span>年龄：{{ currentHistory.baseInfo.age }}岁</span>
              <span>性别：{{ currentHistory.baseInfo.gender === 'male' ? '男' : '女' }}</span>
            </div>
          </div>

          <el-divider></el-divider>

          <div class="detail-section">
            <h4>健康建议</h4>
            <div class="advice-list">
              <p v-for="(advice, idx) in currentHistory.advices" :key="idx">
                {{ idx + 1 }}. {{ advice }}
              </p>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 标签页状态
const activeTab = ref('assessment')

// 测评步骤
const steps = ['基本信息', '生活习惯', '健康状况', '测评结果']
const activeStep = ref(0)
const canNextStep = ref(false)
const showResult = ref(false)

// 测评数据
const assessmentData = ref({
  baseInfo: {
    height: '',
    weight: '',
    age: '',
    gender: 'male',
  },
  habits: {
    sleep: 'good',
    exercise: '1-2',
    diet: 'general',
    stress: 'medium',
  },
  health: {
    chronicDisease: 'no',
    diseaseDesc: '',
    status: 'good',
    demand: '',
  },
})

// 测评结果
const result = ref({
  score: 0,
  level: '',
  bmi: 0,
  advices: [],
  actions: [],
})

// 测评历史
const assessmentHistory = ref([])
const showHistoryModal = ref(false)
const currentHistory = ref(null)

// 计算BMI
const bmiValue = computed(() => {
  const { height, weight } = assessmentData.value.baseInfo
  if (height && weight && height > 0) {
    return weight / (height / 100) ** 2
  }
  return null
})

// 监听基本信息变化，验证是否可下一步
const validateBaseInfo = () => {
  const { height, weight, age } = assessmentData.value.baseInfo
  canNextStep.value = !!height && !!weight && !!age && height > 0 && weight > 0 && age > 0
}

// 处理步骤变化
const handleStepChange = (val) => {
  activeStep.value = val
  // 最后一步不需要验证
  if (val < steps.length - 1) {
    if (val === 0) {
      validateBaseInfo()
    } else {
      canNextStep.value = true
    }
  }
}

// 下一步
const nextStep = () => {
  if (activeStep.value < steps.length - 1) {
    activeStep.value++
  }
}

// 获取BMI描述
const getBMIDesc = (bmi) => {
  if (bmi < 18.5) return '偏瘦：建议增加营养摄入，适当进行力量训练'
  if (bmi < 24) return '正常：恭喜！体重处于健康范围，继续保持'
  if (bmi < 28) return '超重：建议控制饮食，增加有氧运动'
  return '肥胖：建议制定科学的减重计划，咨询专业人士'
}

// 计算测评结果
const calculateResult = () => {
  const { baseInfo, habits, health } = assessmentData.value
  let score = 60

  // BMI评分（20分）
  if (bmiValue.value >= 18.5 && bmiValue.value < 24) score += 20
  else if (bmiValue.value >= 24 && bmiValue.value < 28) score += 10
  else if (bmiValue.value < 18.5) score += 5

  // 生活习惯评分（20分）
  if (habits.sleep === 'excellent') score += 8
  else if (habits.sleep === 'good') score += 5

  if (habits.exercise === '3-5' || habits.exercise === '5+') score += 7
  else if (habits.exercise === '1-2') score += 3

  if (habits.diet === 'healthy') score += 5
  else if (habits.diet === 'general') score += 3

  // 健康状况评分（20分）
  if (health.status === 'excellent') score += 10
  else if (health.status === 'good') score += 7

  if (health.chronicDisease === 'no') score += 10

  // 确定健康等级
  let level = ''
  if (score >= 90) level = '优秀'
  else if (score >= 80) level = '良好'
  else if (score >= 60) level = '一般'
  else level = '需改善'

  // 生成建议
  const advices = []
  const actions = []

  // BMI相关建议
  if (bmiValue.value < 18.5) {
    advices.push('增加优质蛋白质摄入（鸡蛋、牛奶、瘦肉），每天保证三餐规律')
    actions.push({
      title: '力量训练',
      desc: '每周3次，每次30分钟，增强肌肉量',
      type: 'success',
    })
  } else if (bmiValue.value >= 24) {
    advices.push('控制高热量食物摄入，减少外卖和含糖饮料')
    actions.push({
      title: '有氧运动',
      desc: '每周4-5次，每次40分钟（跑步、游泳、跳绳）',
      type: 'primary',
    })
  }

  // 睡眠建议
  if (habits.sleep !== 'excellent') {
    advices.push('建立规律的作息，每天固定时间入睡和起床，睡前1小时远离电子设备')
    actions.push({
      title: '睡眠打卡',
      desc: '参与"7天早睡挑战"活动，培养良好睡眠习惯',
      type: 'info',
    })
  }

  // 运动建议
  if (habits.exercise === '0' || habits.exercise === '1-2') {
    advices.push('逐步增加运动频率，从每周1-2次开始，选择自己喜欢的运动方式')
    actions.push({
      title: '运动计划',
      desc: '制定每周运动表，每次运动后及时打卡记录',
      type: 'warning',
    })
  }

  // 压力管理建议
  if (habits.stress === 'high') {
    advices.push('学习冥想、深呼吸等减压方式，适当参与社交活动，释放压力')
  }

  // 组装结果
  result.value = {
    score,
    level,
    bmi: bmiValue.value.toFixed(1),
    baseInfo,
    advices,
    actions: actions.slice(0, 3), // 最多显示3个行动计划
  }

  showResult.value = true
}

// 保存测评结果
const saveResult = () => {
  const record = {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString(),
    username: localStorage.getItem('username') || '',
    ...result.value,
  }

  // 加载历史记录
  const savedHistory = JSON.parse(localStorage.getItem('healthAssessments') || '[]')
  savedHistory.push(record)
  localStorage.setItem('healthAssessments', JSON.stringify(savedHistory))

  // 更新历史列表
  assessmentHistory.value = savedHistory.reverse()

  ElMessage.success('测评报告保存成功！')
  activeTab.value = 'history'
}

// 重置测评
const resetAssessment = () => {
  assessmentData.value = {
    baseInfo: {
      height: '',
      weight: '',
      age: '',
      gender: 'male',
    },
    habits: {
      sleep: 'good',
      exercise: '1-2',
      diet: 'general',
      stress: 'medium',
    },
    health: {
      chronicDisease: 'no',
      diseaseDesc: '',
      status: 'good',
      demand: '',
    },
  }
  result.value = { score: 0, level: '', bmi: 0, advices: [], actions: [] }
  showResult.value = false
  activeStep.value = 0
  canNextStep.value = false
}

// 获取评分等级
const getScoreLevel = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '一般'
  return '需改善'
}

// 获取评分标签颜色
const getScoreTag = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 加载测评历史
const loadAssessmentHistory = () => {
  const username = localStorage.getItem('username') || ''
  const savedHistory = JSON.parse(localStorage.getItem('healthAssessments') || '[]')
  assessmentHistory.value = savedHistory.filter((record) => record.username === username).reverse()
}

// 查看历史详情
const viewHistoryDetail = (row) => {
  currentHistory.value = row
  showHistoryModal.value = true
}

// 初始化加载历史
loadAssessmentHistory()
</script>

<style scoped>
.health-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.health-tabs {
  margin-bottom: 20px;
}

.assessment-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.step-content {
  padding: 10px 0;
}

.step-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
}

.step-form {
  width: 100%;
  max-width: 600px;
}

.el-form-item {
  margin-bottom: 20px;
}

.bmi-result {
  margin-top: 20px;
  padding: 15px;
  background: #f0f9fb;
  border-radius: 8px;
}

.bmi-result h4 {
  color: #409eff;
  margin: 0 0 8px 0;
}

.stepper-nav {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.result-step {
  text-align: center;
  padding: 20px 0;
}

.score-card {
  margin-bottom: 30px;
}

.score-value {
  font-size: 60px;
  font-weight: 700;
  color: #409eff;
  margin: 10px 0;
}

.score-level {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.advice-section,
.action-section {
  text-align: left;
  margin-bottom: 30px;
}

.advice-section h4,
.action-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.advice-list {
  line-height: 2;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #666;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-item {
  padding: 15px;
  background: #f5fafe;
  border-radius: 8px;
}

.action-item p {
  margin: 8px 0 0 0;
  color: #666;
}

.result-footer {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.history-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.history-header {
  margin-bottom: 20px;
}

.history-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.empty-history {
  text-align: center;
  padding: 50px;
  color: #999;
  font-size: 16px;
}

.history-detail .detail-header {
  margin-bottom: 20px;
}

.history-detail .score {
  font-size: 24px;
  color: #409eff;
  font-weight: 700;
  margin-right: 10px;
}

.history-detail .level {
  color: #666;
}

.detail-section {
  margin-bottom: 20px;
}

.info-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  color: #666;
}

@media (max-width: 768px) {
  .step-form {
    max-width: 100%;
  }

  .score-value {
    font-size: 48px;
  }

  .info-list {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
