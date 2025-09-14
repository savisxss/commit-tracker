import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import CommitsPage from './pages/CommitsPage.vue'
import ProjectsPage from './pages/ProjectsPage.vue'
import './index.css'

const routes = [
  { path: '/', component: CommitsPage },
  { path: '/projects', component: ProjectsPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(Toast)
app.mount('#root')