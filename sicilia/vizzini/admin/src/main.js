import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import './assets/style.scss'
import Home from './views/Home.vue'
import Users from './views/Users.vue'
import History from './views/History.vue'
import Settings from './views/Settings.vue'
Vue.config.productionTip = true
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle,
    faArrowUp, faAngleRight, faAngleLeft, faAngleDown, faPen, faTrash, faFileCsv,
    faEye, faEyeSlash, faCaretDown, faCaretUp, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle,
    faArrowUp, faAngleRight, faAngleLeft, faAngleDown, faPen, faTrash, faFileCsv,
    faEye, faEyeSlash, faCaretDown, faCaretUp, faUpload);
Vue.component('vue-fontawesome', FontAwesomeIcon)
Vue.component('home', Home)
Vue.component('users', Users)
Vue.component('history', History)
Vue.component('settings', Settings)
Vue.use(Buefy, {
  defaultIconComponent: 'vue-fontawesome',
  defaultIconPack: 'fas',
})

new Vue({
  render: h => h(App)
}).$mount('#app')
