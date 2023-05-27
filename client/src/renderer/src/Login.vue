<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { mainColor, paths } from '@renderer/keys'
import { useAccountStore } from '@renderer/store/account'
import { useLogin } from '@renderer/login'
import { useUpdatesStore } from '@renderer/store/updates'
import Dialog from '@renderer/components/Dialog.vue'

const router = useRouter()
const account = useAccountStore()
const updates = useUpdatesStore()
const login = useLogin(router, account, updates)
const list = ref<{
    accountAddress: string,
    name?: string,
}[]>([])

onMounted(async () => {
    list.value = await window.api.account.getAccountList()
    if (list.value.length == 0)
        router.push(paths.addAccount)
})
</script>

<template>
  <Dialog id="login" :width="400" :backgroundColor="mainColor">
    <h2 style="margin-bottom: 30px;">Login</h2>
    <div>
      <div v-for="account in list" class="item clickable" @click="login(account.accountAddress)">
        <p v-if="account.name" style="font-weight: bold;">{{ account.name }}</p>
        <p class="info">{{ account.accountAddress }}</p>
      </div>
    </div>
    <p>
      <router-link to="/add-account">...add account</router-link>
    </p>
  </Dialog>
</template>

<style>
#login div.item {
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 20px;
  padding-right: 20px;
  border-top: 1px solid lightgray;
}

#login div.item:last-child {
  border-bottom: 1px solid lightgray;
}

#login div.item > p {
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 18px;
}

#login div.item > p.info {
  color: gray;
  font-size: 14px;
}

#login a {
  color: v-bind(mainColor);
  text-decoration: none;
}
</style>