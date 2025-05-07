import { createApp } from 'vue'
import './style.css'
import Antd from 'ant-design-vue';

import 'ant-design-vue/dist/reset.css';
import App from './App.vue'

createApp(App).mount('#app')
App.use(Antd).mount('#app');