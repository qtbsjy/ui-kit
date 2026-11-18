import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/doc/:id?',
      name: 'doc',
      // 数据驱动文档站（作品⑱）：一个页面渲染所有组件文档（懒加载）
      component: () => import('../views/ComponentDoc.vue'),
    },
    {
      path: '/button',
      name: 'button',
      // lazy-loaded: 按需加载
      component: () => import('../views/ButtonView.vue'),
    },
    {
      path: '/modal',
      name: 'modal',
      component: () => import('../views/ModalView.vue'),
    },
    {
      path: '/toast',
      name: 'toast',
      component: () => import('../views/ToastView.vue'),
    },
    {
      path: '/form',
      name: 'form',
      component: () => import('../views/FormView.vue'),
    },
    {
      path: '/layout',
      name: 'layout',
      component: () => import('../views/LayoutView.vue'),
    },
    {
      path: '/theme',
      name: 'theme',
      component: () => import('../views/ThemeView.vue'),
    },
    {
      path: '/virtual',
      name: 'virtual',
      component: () => import('../views/VirtualListView.vue'),
    },
    {
      path: '/async',
      name: 'async',
      component: () => import('../views/AsyncView.vue'),
    },
    {
      path: '/directives',
      name: 'directives',
      component: () => import('../views/DirectivesView.vue'),
    },
    {
      path: '/table',
      name: 'table',
      component: () => import('../views/TableView.vue'),
    },
    {
      path: '/tabs',
      name: 'tabs',
      component: () => import('../views/TabsView.vue'),
    },
    {
      path: '/checkbox',
      name: 'checkbox',
      component: () => import('../views/CheckboxView.vue'),
    },
    {
      path: '/slider',
      name: 'slider',
      component: () => import('../views/SliderView.vue'),
    },
    {
      path: '/input-number',
      name: 'input-number',
      component: () => import('../views/InputNumberView.vue'),
    },
    {
      path: '/tree',
      name: 'tree',
      component: () => import('../views/TreeView.vue'),
    },
    {
      path: '/steps',
      name: 'steps',
      component: () => import('../views/StepsView.vue'),
    },
  ],
})

export default router
