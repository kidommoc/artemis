import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@renderer/routes'
import Wrapper from '@renderer/Warpper.vue'

const pinia = createPinia()
const app = createApp(Wrapper)

app.use(router)
app.use(pinia)
// app.use(urql, UrqlClientOptions)
app.mount('#app')