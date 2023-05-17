<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { paths, mainColor } from '@renderer/keys'
import { useAccountStore } from '@renderer/store/account'
import { useUpdatesStore } from '@renderer/store/updates'
import { useLogin } from '@renderer/components/login'
import Dialog from '@renderer/components/Dialog.vue'

const router = useRouter()
const account = useAccountStore()
const updates = useUpdatesStore()
const login = useLogin(router, account, updates)
const privateKey = ref('')

async function addAccount(priKey: string) {
    const addr = await window.api.account.addAccount(priKey)
    updates.addAccount(addr)
    login(addr)
}
</script>

<template>
  <Dialog id="add-account" :width="400" :backgroundColor="mainColor">
    <h2 style="margin-bottom: 30px;">Add Account</h2>
    <div>
      <p style="margin-bottom: 15px;">
        <router-link :to="paths.login">...back</router-link>
      </p>
      <input v-model="privateKey" class="prikey" placeholder="account private key" autofocus />
      <div class="row-right">
        <button class="account-confirm" @click="addAccount(privateKey)">CONFIRM</button>
      </div>
    </div>
  </Dialog>
</template>

<style>
#add-account div.row-right {
  height: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

#add-account div.card a {
  color: v-bind(mainColor);
  text-decoration: none;
}

#add-account input.prikey {
  width: calc(100% - 20px);
  padding: 10px;
  margin-bottom: 15px;
}

#add-account button.account-confirm {
  height: 32px;
  padding-left: 14px;
  padding-right: 14px;
  background-color: v-bind(mainColor);
  border: 0px;
  border-radius: 3px;
  color: white;
}
</style>