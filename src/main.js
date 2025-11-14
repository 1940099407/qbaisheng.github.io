import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from './api/axios'
// 新增：引入 Element Plus 和样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/global.css'

const app = createApp(App)
app.config.globalProperties.$axios = axios
app.use(router)
app.use(ElementPlus) // 注册 Element Plus
app.mount('#app')
