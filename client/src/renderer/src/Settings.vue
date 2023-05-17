<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import {
    paths,
    mainColor, subColor, dangerColor
} from '@renderer/keys'
import { useAccountStore } from '@renderer/store/account'
import Dialog from '@renderer/components/Dialog.vue'

const router = useRouter()
const account = useAccountStore()
const name = ref('')
const subscribingPrice = ref(0)
const registerDialog = ref(false)
const tempName = ref('')
const tempPrice: Ref<number | undefined> = ref(undefined)
const registerStatus = ref(true)
const submitColor = computed(() => name.value ? mainColor : subColor)
const balance = computed(() => (Math.round(account.data.balance * 1e5) / 1e5).toFixed(5) )

async function rename() {
    await window.api.account.rename(name.value)
    await account.update()
}

async function setSubsribingPrice() {
    if (subscribingPrice.value === 0)
        return
    await window.api.account.setSubsribingPrice(subscribingPrice.value)
}

async function register() {
    if (tempName.value === '') {
        registerStatus.value = false
        return
    }
    if (!tempPrice.value)
        tempPrice.value = 0
    await window.api.account.registerAsPublisher(tempName.value, tempPrice.value)
    await account.update()
    if (account.data.isPublisher) {
        name.value = tempName.value
        subscribingPrice.value = tempPrice.value
    }
    registerDialog.value = false
}

async function logout() {
    await window.api.account.logout()
    router.push(paths.login)
}

function startRegistering() {
    tempName.value = name.value
    tempPrice.value = undefined
    registerDialog.value = true
}

onMounted(() => {
    if (account.data.name)
        name.value = account.data.name
    if (account.data.isPublisher)
        subscribingPrice.value = account.data.price!
})
</script>

<template>
  <div id="settings">
    <div class="page-header">
      <h1 style="margin: 0;">Settings</h1>
    </div>
    <div class="card">
      <p class="title">Your Address:</p>
      <p class="info">{{ account.data.address }}</p>
    </div>
    <div class="card">
      <p class="title">Your Name:</p>
      <input v-model="name" class="inputbox" placeholder="enter your name" />
      <button class="submit" @click="rename">SUBMIT</button>
    </div>
    <div class="card">
      <p class="title">Balance:</p>
      <p class="info">{{ balance }} ETH</p>
    </div>
    <div v-if="account.data.isPublisher" class="card">
      <p class="title">Subscribing Price:</p>
      <input v-model="subscribingPrice" class="inputbox" />
      <button class="submit" @click="setSubsribingPrice" :style="{ 'background-color': mainColor }">SUBMIT</button>
    </div>
    <div class="buttons">
      <button v-if="!account.data.isPublisher" class="confirm" @click="startRegistering()" :style="{ 'background-color': mainColor }">
        REGISTER AS PUBLISHER
      </button>
      <button class="confirm" @click="logout" :style="{ 'background-color': dangerColor }">LOGOUT</button>
    </div>
  </div>
  <Dialog v-if="registerDialog" id="register-dialog" :width="400">
    <div v-if="registerStatus === true">
      <p class="discard clickable" @click="registerDialog = false">...discard</p>
      <input v-model="tempName" class="inputbox" placeholder="a publisher must have a name" />
      <input v-model="tempPrice" class="inputbox" placeholder="your subscribing price" />
      <div class="row-right">
        <button class="confirm" @click="register()">CONFIRM</button>
      </div>
    </div>
    <div v-else>
      <p>Must have a name!</p>
      <div class="row-right">
        <button class="confirm" @click="registerDialog = false; registerStatus = true">CONFIRM</button>
      </div>
    </div>
  </Dialog>
</template>

<style>
#settings div.page-header {
  margin-bottom: 15px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
}

#settings div.card {
  width: calc(100% - 100px);
  border-radius: 5px;
  box-shadow: 3px 3px 6px darkgray;
  margin-bottom: 15px;
  padding: 20px;
  padding-left: 50px;
  padding-right: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

#settings div.buttons {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

#register-dialog div.row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

#settings div.card p.title {
  margin: 0;
  margin-right: 20px;
  color: #808080;
}

#settings div.card p.info {
  margin: 0;
  padding: 0;
  color: v-bind(mainColor);
  font-weight: bold;
}

#register-dialog p.discard {
  margin: 0px;
  margin-bottom: 15px;
  color: v-bind(mainColor);
}

#settings input.inputbox {
  padding: 8px;
  flex-grow: 1;
  border: 1px solid lightgray;
  border-radius: 2px;
}

#register-dialog input.inputbox {
  width: calc(100% - 20px);
  padding: 10px;
  margin-bottom: 15px;
}

#settings button.submit {
  height: 32px;
  margin-left: 15px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: v-bind(submitColor);
  color: white;
  border: 0px;
  border-radius: 3px;
}

#settings button.confirm {
  padding: 12px;
  padding-left: 15px;
  padding-right: 15px;
  font-size: 16px;
  background-color: v-bind(mainColor);
  color: white;
  border: 0px;
  border-radius: 3px;
  box-shadow: 2px 2px 5px darkgray;
}

#register-dialog button.confirm {
  height: 32px;
  padding-left: 14px;
  padding-right: 14px;
  background-color: v-bind(mainColor);
  border: 0px;
  border-radius: 3px;
  color: white;
}
</style>