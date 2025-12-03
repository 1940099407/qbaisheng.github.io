<template>
  <div class="health-container">
    <el-page-header content="健康测评与指导" />

    <el-tabs v-model="activeTab" class="health-tabs">
      <el-tab-pane label="开始测评" name="assessment"></el-tab-pane>
      <el-tab-pane label="测评历史" name="history"></el-tab-pane>
    </el-tabs>

    <!-- 开始测评 -->
    <div v-show="activeTab === 'assessment'">
      <el-card class="assessment-card">
        <el-stepper
          v-model="activeStep"
          :steps="steps"
          @change="handleStepChange"
          direction="vertical"
          :finish-status="isStepFinished"
        >
          <template #default>
            <!-- 第一步：基本信息（完全自主校验） -->
            <div v-show="activeStep === 0" class="step-content">
              <h3 class="step-title">基本身体信息</h3>
              <!-- 顶部总错误提示 -->
              <div v-if="baseTotalError" class="form-error-alert">
                <i class="el-icon el-icon-warning"></i> {{ baseTotalError }}
              </div>

              <!-- 去掉Element Plus表单校验，完全自主控制 -->
              <el-form :model="assessmentData.baseInfo" class="step-form" label-width="100px">
                <!-- 身高：自主控制错误提示与样式 -->
                <el-form-item label="身高(cm)">
                  <el-input
                    v-model.number="assessmentData.baseInfo.height"
                    type="number"
                    placeholder="请输入100-250之间的数字"
                    :min="100"
                    :max="250"
                    clearable
                    input-mode="numeric"
                    :class="heightError ? 'custom-error-input' : ''"
                  ></el-input>
                  <span v-if="heightError" class="custom-error-text">{{ heightError }}</span>
                </el-form-item>

                <!-- 体重：自主控制 -->
                <el-form-item label="体重(kg)">
                  <el-input
                    v-model.number="assessmentData.baseInfo.weight"
                    type="number"
                    placeholder="请输入30-200之间的数字"
                    :min="30"
                    :max="200"
                    clearable
                    input-mode="numeric"
                    :class="weightError ? 'custom-error-input' : ''"
                  ></el-input>
                  <span v-if="weightError" class="custom-error-text">{{ weightError }}</span>
                </el-form-item>

                <!-- 年龄：自主控制 -->
                <el-form-item label="年龄">
                  <el-input
                    v-model.number="assessmentData.baseInfo.age"
                    type="number"
                    placeholder="请输入1-120之间的数字"
                    :min="1"
                    :max="120"
                    clearable
                    input-mode="numeric"
                    :class="ageError ? 'custom-error-input' : ''"
                  ></el-input>
                  <span v-if="ageError" class="custom-error-text">{{ ageError }}</span>
                </el-form-item>

                <!-- 性别：自主控制 -->
                <el-form-item label="性别">
                  <el-radio-group v-model="assessmentData.baseInfo.gender">
                    <el-radio label="male">男</el-radio>
                    <el-radio label="female">女</el-radio>
                  </el-radio-group>
                  <span v-if="genderError" class="custom-error-text">{{ genderError }}</span>
                </el-form-item>
              </el-form>

              <!-- BMI计算结果 -->
              <div v-if="bmiValue !== null && !isNaN(bmiValue)" class="bmi-result">
                <h4>BMI指数：{{ bmiValue.toFixed(1) }}</h4>
                <p class="bmi-desc">{{ getBMIDesc(bmiValue) }}</p>
              </div>
            </div>

            <!-- 第二步：生活习惯（同步自主校验） -->
            <div v-show="activeStep === 1" class="step-content">
              <h3 class="step-title">生活习惯调查</h3>
              <div v-if="habitTotalError" class="form-error-alert">
                <i class="el-icon el-icon-warning"></i> {{ habitTotalError }}
              </div>

              <el-form :model="assessmentData.habits" class="step-form" label-width="100px">
                <el-form-item label="睡眠质量">
                  <el-radio-group v-model="assessmentData.habits.sleep">
                    <el-radio label="excellent">良好（7-8小时/天，深度睡眠充足）</el-radio>
                    <el-radio label="good">一般（6-7小时/天，偶尔失眠）</el-radio>
                    <el-radio label="poor">较差（少于6小时/天，经常失眠）</el-radio>
                  </el-radio-group>
                  <span v-if="sleepError" class="custom-error-text">{{ sleepError }}</span>
                </el-form-item>

                <el-form-item label="每周运动次数">
                  <el-radio-group v-model="assessmentData.habits.exercise">
                    <el-radio label="0">几乎不运动</el-radio>
                    <el-radio label="1-2">1-2次</el-radio>
                    <el-radio label="3-5">3-5次</el-radio>
                    <el-radio label="5+">5次以上</el-radio>
                  </el-radio-group>
                  <span v-if="exerciseError" class="custom-error-text">{{ exerciseError }}</span>
                </el-form-item>

                <el-form-item label="饮食习惯">
                  <el-radio-group v-model="assessmentData.habits.diet">
                    <el-radio label="healthy">健康（均衡饮食，少油腻辛辣）</el-radio>
                    <el-radio label="general">一般（偶尔外卖，饮食不规律）</el-radio>
                    <el-radio label="unhealthy">不健康（经常外卖，高油高糖）</el-radio>
                  </el-radio-group>
                  <span v-if="dietError" class="custom-error-text">{{ dietError }}</span>
                </el-form-item>

                <el-form-item label="压力水平">
                  <el-radio-group v-model="assessmentData.habits.stress">
                    <el-radio label="low">较低（心态平和，压力小）</el-radio>
                    <el-radio label="medium">中等（有一定压力，可自我调节）</el-radio>
                    <el-radio label="high">较高（压力大，难以调节）</el-radio>
                  </el-radio-group>
                  <span v-if="stressError" class="custom-error-text">{{ stressError }}</span>
                </el-form-item>
              </el-form>
            </div>

            <!-- 第三步：健康状况（同步自主校验） -->
            <div v-show="activeStep === 2" class="step-content">
              <h3 class="step-title">健康状况自评</h3>
              <div v-if="healthTotalError" class="form-error-alert">
                <i class="el-icon el-icon-warning"></i> {{ healthTotalError }}
              </div>

              <el-form :model="assessmentData.health" class="step-form" label-width="100px">
                <el-form-item label="是否有慢性疾病">
                  <el-radio-group v-model="assessmentData.health.chronicDisease">
                    <el-radio label="no">无</el-radio>
                    <el-radio label="yes">有（可在备注说明）</el-radio>
                  </el-radio-group>
                  <span v-if="chronicDiseaseError" class="custom-error-text">{{
                    chronicDiseaseError
                  }}</span>
                </el-form-item>

                <el-form-item
                  v-if="assessmentData.health.chronicDisease === 'yes'"
                  label="疾病说明"
                >
                  <el-input
                    type="textarea"
                    v-model="assessmentData.health.diseaseDesc"
                    rows="2"
                    placeholder="请简要描述疾病情况（至少5个字符）"
                    :class="diseaseDescError ? 'custom-error-input' : ''"
                  ></el-input>
                  <span v-if="diseaseDescError" class="custom-error-text">{{
                    diseaseDescError
                  }}</span>
                </el-form-item>

                <el-form-item label="近期身体状态">
                  <el-radio-group v-model="assessmentData.health.status">
                    <el-radio label="excellent">良好（精力充沛，无不适）</el-radio>
                    <el-radio label="good">一般（偶尔疲劳，无明显不适）</el-radio>
                    <el-radio label="poor">较差（经常疲劳，有明显不适）</el-radio>
                  </el-radio-group>
                  <span v-if="statusError" class="custom-error-text">{{ statusError }}</span>
                </el-form-item>

                <el-form-item label="健康诉求">
                  <el-input
                    type="textarea"
                    v-model="assessmentData.health.demand"
                    rows="2"
                    placeholder="例如：减重、增肌、改善睡眠等（至少3个字符）"
                    :class="demandError ? 'custom-error-input' : ''"
                  ></el-input>
                  <span v-if="demandError" class="custom-error-text">{{ demandError }}</span>
                </el-form-item>
              </el-form>
            </div>

            <!-- 第四步：测评结果 -->
            <div v-show="activeStep === 3" class="step-content result-step">
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
                  <div class="advice-list" v-if="result.advices.length > 0">
                    <p v-for="(advice, idx) in result.advices" :key="idx" class="advice-item">
                      <i class="el-icon el-icon-info"></i> {{ advice }}
                    </p>
                  </div>
                  <div v-else class="empty-advice">暂无特殊建议，继续保持良好状态～</div>
                </div>

                <el-divider></el-divider>

                <div class="action-section">
                  <h4>推荐行动计划</h4>
                  <div class="action-list" v-if="result.actions.length > 0">
                    <div v-for="(action, idx) in result.actions" :key="idx" class="action-item">
                      <el-tag :type="action.type">{{ action.title }}</el-tag>
                      <p>{{ action.desc }}</p>
                    </div>
                  </div>
                  <div v-else class="empty-action">当前状态良好，维持现有生活方式即可～</div>
                </div>

                <div class="result-footer">
                  <el-button type="primary" @click="saveResult" :loading="saveLoading"
                    >保存测评报告</el-button
                  >
                  <el-button @click="resetAssessment">重新测评</el-button>
                </div>
              </div>
            </div>
          </template>
        </el-stepper>

        <!-- 步骤导航按钮 -->
        <div class="stepper-nav">
          <el-button v-if="activeStep > 0" @click="goPrevStep" class="prev-btn"> 上一步 </el-button>

          <el-button
            v-if="activeStep < steps.length - 1"
            type="primary"
            @click="goNextStep"
            :loading="nextLoading"
            class="next-btn"
          >
            下一步
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 测评历史 -->
    <div v-show="activeTab === 'history'">
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
            <el-table-column prop="bmi" label="BMI指数" width="100">
              <template #default="scope">{{ scope.row.bmi || '--' }}</template>
            </el-table-column>
            <el-table-column prop="level" label="健康等级" width="120">
              <template #default="scope">{{ scope.row.level || '--' }}</template>
            </el-table-column>
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
            <h3>测评日期：{{ currentHistory.date || '未知日期' }}</h3>
            <div class="detail-score">
              综合评分：<span class="score">{{ currentHistory.score || 0 }}</span>
              <span class="level">{{ currentHistory.level || '未评级' }}</span>
            </div>
          </div>

          <el-divider></el-divider>

          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="info-list" v-if="currentHistory.baseInfo">
              <span>身高：{{ currentHistory.baseInfo.height || '--' }}cm</span>
              <span>体重：{{ currentHistory.baseInfo.weight || '--' }}kg</span>
              <span>BMI：{{ currentHistory.bmi || '--' }}</span>
              <span>年龄：{{ currentHistory.baseInfo.age || '--' }}岁</span>
              <span
                >性别：{{
                  currentHistory.baseInfo.gender === 'male'
                    ? '男'
                    : currentHistory.baseInfo.gender === 'female'
                      ? '女'
                      : '--'
                }}</span
              >
            </div>
            <div v-else class="empty-info">暂无基本信息</div>
          </div>

          <el-divider></el-divider>

          <div class="detail-section">
            <h4>健康建议</h4>
            <div
              class="advice-list"
              v-if="currentHistory.advices && currentHistory.advices.length > 0"
            >
              <p v-for="(advice, idx) in currentHistory.advices" :key="idx">
                {{ idx + 1 }}. {{ advice }}
              </p>
            </div>
            <div v-else class="empty-advice">暂无健康建议</div>
          </div>
        </div>
        <div v-else class="empty-detail">暂无详情数据</div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ===================== 核心状态变量 =====================
const activeTab = ref('assessment')
const activeStep = ref(0)
const showResult = ref(false)
const nextLoading = ref(false)
const saveLoading = ref(false)

// 第一步：基本信息的错误提示（自主控制）
const heightError = ref('')
const weightError = ref('')
const ageError = ref('')
const genderError = ref('')
const baseTotalError = ref('')

// 第二步：生活习惯的错误提示（自主控制）
const sleepError = ref('')
const exerciseError = ref('')
const dietError = ref('')
const stressError = ref('')
const habitTotalError = ref('')

// 第三步：健康状况的错误提示（自主控制）
const chronicDiseaseError = ref('')
const diseaseDescError = ref('')
const statusError = ref('')
const demandError = ref('')
const healthTotalError = ref('')

// 步骤配置
const steps = ref([
  { title: '基本信息' },
  { title: '生活习惯' },
  { title: '健康状况' },
  { title: '测评结果' },
])

// ===================== 表单数据 =====================
const assessmentData = ref({
  baseInfo: {
    height: null,
    weight: null,
    age: null,
    gender: 'male',
  },
  habits: {
    sleep: '',
    exercise: '',
    diet: '',
    stress: '',
  },
  health: {
    chronicDisease: 'no',
    diseaseDesc: '',
    status: '',
    demand: '',
  },
})

// ===================== 测评结果相关 =====================
const result = ref({
  score: 0,
  level: '',
  bmi: '0.0',
  advices: [],
  actions: [],
  baseInfo: {},
})

const bmiValue = computed(() => {
  const { height, weight } = assessmentData.value.baseInfo
  if (
    height !== null &&
    weight !== null &&
    !isNaN(height) &&
    !isNaN(weight) &&
    height > 0 &&
    weight > 0
  ) {
    const bmi = weight / (height / 100) ** 2
    return Number.isNaN(bmi) ? null : bmi
  }
  return null
})

const isStepFinished = computed(() => {
  return activeStep.value > 0 ? 'success' : 'wait'
})

// ===================== 模板核心函数 =====================
const getScoreLevel = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '一般'
  return '需改善'
}

const getScoreTag = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

const getBMIDesc = (bmi) => {
  if (bmi < 18.5) return '偏瘦：建议增加优质蛋白质摄入（鸡蛋、牛奶、瘦肉），每天保证三餐规律'
  if (bmi < 24) return '正常：恭喜！体重处于健康范围，继续保持均衡饮食和适度运动'
  if (bmi < 28) return '超重：建议控制高热量食物摄入，减少外卖和含糖饮料，每周增加3-5次有氧运动'
  return '肥胖：建议制定科学的减重计划，控制饮食总热量，搭配有氧运动和力量训练，必要时咨询专业人士'
}

// ===================== 步骤切换函数 =====================
const handleStepChange = (val) => {
  activeStep.value = val
  // 切换步骤后清空所有错误提示
  if (val === 0) {
    heightError.value = ''
    weightError.value = ''
    ageError.value = ''
    genderError.value = ''
    baseTotalError.value = ''
  } else if (val === 1) {
    sleepError.value = ''
    exerciseError.value = ''
    dietError.value = ''
    stressError.value = ''
    habitTotalError.value = ''
  } else if (val === 2) {
    chronicDiseaseError.value = ''
    diseaseDescError.value = ''
    statusError.value = ''
    demandError.value = ''
    healthTotalError.value = ''
  }
}

const goPrevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

const goNextStep = async () => {
  nextLoading.value = true
  let isFormValid = false

  // 按步骤自主校验
  if (activeStep.value === 0) {
    isFormValid = validateBaseInfo()
  } else if (activeStep.value === 1) {
    isFormValid = validateHabits()
  } else if (activeStep.value === 2) {
    isFormValid = validateHealth()
  }

  // 校验通过则跳步骤
  if (isFormValid && activeStep.value < steps.value.length - 1) {
    activeStep.value++
  }

  nextLoading.value = false
}

// ===================== 自主校验函数（彻底控制）=====================
// 校验基本信息
const validateBaseInfo = () => {
  let isValid = true
  const { height, weight, age, gender } = assessmentData.value.baseInfo

  // 清空之前的错误
  heightError.value = ''
  weightError.value = ''
  ageError.value = ''
  genderError.value = ''
  baseTotalError.value = ''

  // 校验身高
  if (height === null || height === '' || isNaN(height)) {
    heightError.value = '身高不能为空'
    isValid = false
  } else if (height < 100 || height > 250) {
    heightError.value = '身高需在100-250cm之间'
    isValid = false
  }

  // 校验体重
  if (weight === null || weight === '' || isNaN(weight)) {
    weightError.value = '体重不能为空'
    isValid = false
  } else if (weight < 30 || weight > 200) {
    weightError.value = '体重需在30-200kg之间'
    isValid = false
  }

  // 校验年龄
  if (age === null || age === '' || isNaN(age)) {
    ageError.value = '年龄不能为空'
    isValid = false
  } else if (age < 1 || age > 120) {
    ageError.value = '年龄需在1-120岁之间'
    isValid = false
  }

  // 校验性别
  if (!gender) {
    genderError.value = '请选择性别'
    isValid = false
  }

  // 总错误提示
  if (!isValid) {
    baseTotalError.value = '基本信息填写不规范，请检查后再提交'
    ElMessage.warning(baseTotalError.value)
  }

  return isValid
}

// 校验生活习惯
const validateHabits = () => {
  let isValid = true
  const { sleep, exercise, diet, stress } = assessmentData.value.habits

  sleepError.value = ''
  exerciseError.value = ''
  dietError.value = ''
  stressError.value = ''
  habitTotalError.value = ''

  if (!sleep) {
    sleepError.value = '请选择睡眠质量'
    isValid = false
  }
  if (!exercise) {
    exerciseError.value = '请选择运动次数'
    isValid = false
  }
  if (!diet) {
    dietError.value = '请选择饮食习惯'
    isValid = false
  }
  if (!stress) {
    stressError.value = '请选择压力水平'
    isValid = false
  }

  if (!isValid) {
    habitTotalError.value = '生活习惯填写不规范，请检查后再提交'
    ElMessage.warning(habitTotalError.value)
  }

  return isValid
}

// 校验健康状况
const validateHealth = () => {
  let isValid = true
  const { chronicDisease, diseaseDesc, status, demand } = assessmentData.value.health

  chronicDiseaseError.value = ''
  diseaseDescError.value = ''
  statusError.value = ''
  demandError.value = ''
  healthTotalError.value = ''

  if (!chronicDisease) {
    chronicDiseaseError.value = '请选择是否有慢性疾病'
    isValid = false
  }
  if (chronicDisease === 'yes' && (diseaseDesc === '' || diseaseDesc.length < 5)) {
    diseaseDescError.value = '疾病说明至少5个字符'
    isValid = false
  }
  if (!status) {
    statusError.value = '请选择身体状态'
    isValid = false
  }
  if (demand === '' || demand.length < 3) {
    demandError.value = '健康诉求至少3个字符'
    isValid = false
  }

  if (!isValid) {
    healthTotalError.value = '健康状况填写不规范，请检查后再提交'
    ElMessage.warning(healthTotalError.value)
  }

  return isValid
}

// ===================== 业务逻辑函数 =====================
const calculateResult = () => {
  const { baseInfo, habits, health } = assessmentData.value
  let score = 60

  if (bmiValue.value !== null && !isNaN(bmiValue.value)) {
    if (bmiValue.value >= 18.5 && bmiValue.value < 24) score += 20
    else if (bmiValue.value >= 24 && bmiValue.value < 28) score += 10
    else if (bmiValue.value < 18.5) score += 5
  }

  if (habits.sleep === 'excellent') score += 8
  else if (habits.sleep === 'good') score += 5

  if (habits.exercise === '3-5' || habits.exercise === '5+') score += 7
  else if (habits.exercise === '1-2') score += 3

  if (habits.diet === 'healthy') score += 5
  else if (habits.diet === 'general') score += 3

  if (health.status === 'excellent') score += 10
  else if (health.status === 'good') score += 7

  if (health.chronicDisease === 'no') score += 10

  const level = getScoreLevel(score)

  const advices = []
  const actions = []

  if (bmiValue.value !== null && !isNaN(bmiValue.value)) {
    if (bmiValue.value < 18.5) {
      advices.push('增加优质蛋白质摄入（鸡蛋、牛奶、瘦肉），每天保证三餐规律，避免节食')
      actions.push({
        title: '力量训练',
        desc: '每周3次，每次30分钟，针对胸、背、腿等肌群训练，增强肌肉量',
        type: 'success',
      })
    } else if (bmiValue.value >= 24) {
      advices.push('控制高热量食物摄入，减少外卖和含糖饮料，每餐七八分饱')
      actions.push({
        title: '有氧运动',
        desc: '每周4-5次，每次40分钟（跑步、游泳、跳绳等），燃烧多余脂肪',
        type: 'primary',
      })
    }
  }

  if (habits.sleep !== 'excellent' && habits.sleep) {
    advices.push('建立规律的作息，每天固定时间入睡和起床，睡前1小时远离电子设备，避免熬夜')
    actions.push({
      title: '睡眠打卡',
      desc: '参与"7天早睡挑战"，每天23点前入睡，记录睡眠时长和质量',
      type: 'info',
    })
  }

  if ((habits.exercise === '0' || habits.exercise === '1-2') && habits.exercise) {
    advices.push('逐步增加运动频率，从每周1-2次开始，选择散步、慢跑等容易坚持的运动方式')
    actions.push({
      title: '运动计划',
      desc: '制定每周运动表，每次运动后打卡记录，逐步提升运动时长和强度',
      type: 'warning',
    })
  }

  if (habits.stress === 'high' && habits.stress) {
    advices.push('学习冥想、深呼吸等减压方式，每天预留30分钟兴趣时间，适当参与社交活动释放压力')
  }

  if (health.chronicDisease === 'yes' && health.diseaseDesc) {
    advices.push('定期监测病情，严格遵循医嘱用药，避免过度劳累和情绪波动，定期复查')
    actions.push({
      title: '定期复查',
      desc: '根据病情制定复查计划，每次复查后记录关键指标变化，及时调整方案',
      type: 'danger',
    })
  }

  result.value = {
    score: Math.min(100, score),
    level,
    bmi: bmiValue.value !== null && !isNaN(bmiValue.value) ? bmiValue.value.toFixed(1) : '--',
    baseInfo,
    advices,
    actions: actions.slice(0, 3),
  }

  showResult.value = true
}

const saveResult = async () => {
  if (saveLoading.value) return
  saveLoading.value = true

  try {
    const record = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      username: localStorage.getItem('username') || '匿名用户',
      ...result.value,
    }

    let savedHistory = []
    const storedHistory = localStorage.getItem('healthAssessments')
    if (storedHistory) {
      try {
        savedHistory = JSON.parse(storedHistory)
        if (!Array.isArray(savedHistory)) savedHistory = []
      } catch (err) {
        console.error('【历史记录解析异常】', err)
        savedHistory = []
        ElMessage.warning('历史记录解析异常，已重置')
      }
    }

    const lastRecord = savedHistory[savedHistory.length - 1]
    if (lastRecord && lastRecord.score === record.score && lastRecord.bmi === record.bmi) {
      const lastTime = new Date(lastRecord.date).getTime()
      const currentTime = new Date().getTime()
      if (currentTime - lastTime < 60 * 1000) {
        ElMessage.info('1分钟内已保存过相同测评结果，无需重复保存')
        return
      }
    }

    savedHistory.push(record)
    localStorage.setItem('healthAssessments', JSON.stringify(savedHistory))
    assessmentHistory.value = savedHistory
      .filter((item) => item.username === record.username)
      .reverse()

    ElMessage.success('测评报告保存成功！已自动跳转到历史记录')
    activeTab.value = 'history'
  } catch (err) {
    console.error('【保存测评结果失败】', err)
    ElMessage.error('保存失败，请重试')
  } finally {
    saveLoading.value = false
  }
}

const resetAssessment = () => {
  ElMessageBox.confirm('确定要重新测评吗？当前已填写的数据将全部清空，不可恢复', '确认重置', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      assessmentData.value = {
        baseInfo: { height: null, weight: null, age: null, gender: 'male' },
        habits: { sleep: '', exercise: '', diet: '', stress: '' },
        health: { chronicDisease: 'no', diseaseDesc: '', status: '', demand: '' },
      }
      result.value = { score: 0, level: '', bmi: '0.0', advices: [], actions: [], baseInfo: {} }
      showResult.value = false
      activeStep.value = 0
      // 清空所有错误提示
      heightError.value = ''
      weightError.value = ''
      ageError.value = ''
      genderError.value = ''
      baseTotalError.value = ''
      sleepError.value = ''
      exerciseError.value = ''
      dietError.value = ''
      stressError.value = ''
      habitTotalError.value = ''
      chronicDiseaseError.value = ''
      diseaseDescError.value = ''
      statusError.value = ''
      demandError.value = ''
      healthTotalError.value = ''
      ElMessage.success('已成功重置测评，可重新填写')
    })
    .catch((err) => {
      console.error('【取消重置测评】', err)
      ElMessage.info('已取消重置')
    })
}

// ===================== 测评历史相关 =====================
const assessmentHistory = ref([])
const showHistoryModal = ref(false)
const currentHistory = ref(null)

const loadAssessmentHistory = () => {
  try {
    const username = localStorage.getItem('username') || '匿名用户'
    const storedHistory = localStorage.getItem('healthAssessments')
    if (storedHistory) {
      const savedHistory = JSON.parse(storedHistory)
      if (Array.isArray(savedHistory)) {
        assessmentHistory.value = savedHistory
          .filter((item) => item.username === username)
          .reverse()
      }
    }
  } catch (err) {
    console.error('【加载测评历史失败】', err)
    assessmentHistory.value = []
    ElMessage.warning('测评历史加载失败，已清空异常数据')
  }
}

const viewHistoryDetail = (row) => {
  if (row && row.id) {
    currentHistory.value = { ...row }
    showHistoryModal.value = true
  } else {
    ElMessage.warning('无效的测评记录，无法查看详情')
  }
}

// 初始化执行
loadAssessmentHistory()

// 暴露isNaN供模板使用
const isNaN = (val) => Number.isNaN(val)
</script>

<style scoped>
/* 自主控制的错误样式（仅在自己判断错误时显示） */
.custom-error-input {
  border-color: #f56c6c !important;
}
.custom-error-text {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  display: inline-block;
}

/* 表单错误提示样式 */
.form-error-alert {
  color: #f56c6c;
  background: #fef0f0;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 其他样式保持不变 */
.health-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

.health-tabs {
  margin-bottom: 20px;
}

.assessment-card,
.history-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-bottom: 20px;
}

.step-content {
  padding: 10px 0;
  display: block !important;
  width: 100%;
}

.step-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 500;
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
  background: #e8f4f8;
  border-radius: 6px;
}

.bmi-result h4 {
  color: #409eff;
  margin: 0 0 8px 0;
  font-size: 16px;
}

.bmi-result .bmi-desc {
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.stepper-nav {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.prev-btn,
.next-btn {
  padding: 8px 16px;
  border-radius: 4px;
}

.result-step {
  text-align: center;
  padding: 30px 20px;
}

.score-card {
  margin-bottom: 30px;
}

.score-value {
  font-size: 72px;
  font-weight: 700;
  color: #409eff;
  margin: 10px 0;
  line-height: 1;
}

.score-level {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.advice-section,
.action-section {
  text-align: left;
  margin-bottom: 30px;
  padding: 0 20px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.advice-section h4,
.action-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: 500;
}

.advice-list {
  line-height: 2;
  color: #666;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.advice-item i {
  color: #409eff;
  margin-top: 4px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  padding: 15px;
  background: #f0f8fb;
  border-radius: 6px;
  text-align: left;
}

.action-item el-tag {
  margin-bottom: 8px;
}

.action-item p {
  margin: 8px 0 0 0;
  color: #666;
  line-height: 1.6;
}

.history-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
  font-weight: 500;
}

.history-list el-table {
  width: 100%;
}

.empty-history,
.empty-advice,
.empty-action,
.empty-info,
.empty-detail {
  color: #999;
  padding: 20px 0;
  text-align: center;
  font-size: 14px;
}

.empty-history {
  padding: 50px 0;
}

@media (max-width: 768px) {
  .health-container {
    padding: 10px;
  }

  .step-form {
    max-width: 100%;
  }

  .score-value {
    font-size: 48px;
  }

  .stepper-nav {
    flex-direction: column;
    align-items: stretch;
  }

  .advice-section,
  .action-section {
    padding: 0 10px;
  }
}
</style>
