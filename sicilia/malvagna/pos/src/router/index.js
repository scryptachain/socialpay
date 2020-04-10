import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/refund',
    name: 'Refund',
    component: () => import('../views/Refund.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue')
  },
  {
    path: '/card',
    name: 'Card',
    component: () => import('../views/Card.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
