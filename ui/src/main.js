import Vue from 'vue'
import App from './App.vue'

import { BootstrapVue, BIcon, BIconLink45deg, BIconX, BIconFileEarmarkText, BIconPlay, BIconStopFill, BIconShieldLock, BIconClipboard, BIconTrash, BIconBoxArrowRight, BIconExclamationCircle, BIconCircleFill } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)
Vue.component('BIcon', BIcon)
Vue.component('BIconX', BIconX)
Vue.component('BIconPlay', BIconPlay)
Vue.component('BIconTrash', BIconTrash)
Vue.component('BIconStopFill', BIconStopFill)
Vue.component('BIconLink45deg', BIconLink45deg)
Vue.component('BIconClipboard', BIconClipboard)
Vue.component('BIconShieldLock', BIconShieldLock)
Vue.component('BIconFileEarmarkText', BIconFileEarmarkText)
Vue.component('BIconBoxArrowRight', BIconBoxArrowRight)
Vue.component('BIconExclamationCircle', BIconExclamationCircle)
Vue.component('BIconCircleFill', BIconCircleFill)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
