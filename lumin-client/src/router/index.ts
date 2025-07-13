import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import DetailView from '@/views/DetailView.vue'
import PlayView from '@/views/PlayView.vue'
import EditorView from '@/views/EditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/detail/:id',
      name: 'detail',
      component: DetailView,
    },
    {
      path: '/play/:id',
      name: 'play',
      component: PlayView
    },
    {
      path: '/editor/:id',
      name: 'editor',
      component: EditorView,
      meta: {
        full: true
      }
    }
  ],
})

export default router
