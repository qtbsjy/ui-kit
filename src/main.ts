import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import UiKit from './components'

const app = createApp(App)

app.use(router)
app.use(UiKit) // 全局安装 UI 组件库

app.mount('#app')
