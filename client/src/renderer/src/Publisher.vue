<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mainColor, subColor } from '@renderer/keys'
import { useAccountStore } from '@renderer/store/account'
import { SubscribingStatus } from '@renderer/store/account'
import { formatDate } from '@renderer/dateFormatter'
import { queryFetchPublisher } from '@renderer/query'
import Dialog from '@renderer/components/Dialog.vue'
import MayLoad from '@renderer/components/MayLoad.vue'
import ArticleList from '@renderer/components/ArticleList.vue'

const route = useRoute()
const router = useRouter()
const account = useAccountStore()
const name = ref('')
const price = ref(0)
const articles = ref<ArticleInfo[]>([])
const subscribingInfo = ref<SubscribingInfo>({ status: SubscribingStatus.NO })
const subscribingDialog = ref(false)
const address = computed(() => route.params.addr as string)
const isFollowing = computed(() => account.data.followings.findIndex(ele => ele.info.address == address.value) !== -1)
const subscribeColor = (month: number) => {
    if (account.data.balance >= month * price.value)
        return mainColor
    else
        return subColor
}

async function loadPublisherArticles() {
    await account.update()
    const n = await window.api.query.getPublisherName(address.value)
    if (!n)
        throw new Error('Inexist publisher!')
    name.value = n
    price.value = await (async () => {
      const result = await window.api.query.getSubscribingPrice(address.value)
      if (result)
          return result
      return 0
    })()
    subscribingInfo.value = await window.api.account.getSubscribingStatus(address.value)
    articles.value = await queryFetchPublisher(address.value)
}

async function follow() {
    await window.api.account.follow(address.value)
    await account.update()
}

async function unfollow() {
    await window.api.account.unfollow(address.value)
    await account.update()
}

async function subscribe(month: number) {
    await window.api.account.subscribe(address.value, month)
    await account.update()
    subscribingInfo.value = await window.api.account.getSubscribingStatus(address.value)
    subscribingDialog.value = false
}
</script>

<template>
  <MayLoad :load="loadPublisherArticles">
    <div id="publisher">
      <p class="back clickable" @click="router.go(-1)">...back</p>
      <div class="page-header">
        <div class="info-left">
          <h2 class="name">{{ name }}</h2>
          <p class="info">{{ address }}</p>
          <p v-if="subscribingInfo.status == SubscribingStatus.REQ" class="info">Requesting Subscribing</p>
          <p v-if="subscribingInfo.status == SubscribingStatus.YES" class="info">
            Subscribing to {{ formatDate(subscribingInfo.time!) }}
          </p>
        </div>
        <div class="info-right">
          <button v-if="!isFollowing" class="submit" @click="follow">FOLLOW</button>
          <button v-if="isFollowing" class="submit" @click="unfollow">UNFOLLOW</button>
          <button class="submit" @click="subscribingDialog = true" style="background-color: burlywood">
            SUBSCRIBE
          </button>
        </div>
      </div>
      <p v-if="articles.length === 0">This publisher havn't post any article yet!</p>
      <ArticleList v-else :list="articles" />
    </div>
    <Dialog v-if="subscribingDialog" id="subscribing-dialog" :width="600">
      <p class="discard clickable" @click="subscribingDialog = false">...discard</p>
      <h2 class="title">Price per month: {{ price.toFixed(6) }}</h2>
      <div class="row">
        <div class="item">
          <p class="info">Subscribe 1 month</p>
          <p class="price">{{ price.toFixed(6) }} ETH</p>
          <button class="subscribe" @click="subscribe(1)" :style="{ 'background-color': subscribeColor(1) }">
            SUBSCRIBE
          </button>
        </div>
        <div class="item">
          <p class="info">Subscribe 3 months</p>
          <p class="price">{{ (price * 3).toFixed(6) }} ETH</p>
          <button class="subscribe" @click="subscribe(3)" :style="{ 'background-color': subscribeColor(3) }">
            SUBSCRIBE
          </button>
        </div>
        <div class="item">
          <p class="info">Subscribe 6 months</p>
          <p class="price">{{ (price * 6).toFixed(6) }} ETH</p>
          <button class="subscribe" @click="subscribe(6)" :style="{ 'background-color': subscribeColor(6) }">
            SUBSCRIBE
          </button>
        </div>
      </div>
    </Dialog>
  </MayLoad>
</template>

<style>
#publisher div.page-header {
  width: calc(100% - 40px);
  margin-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid gray;
  display: flex;
  flex-direction: row;
  align-items: start;
  justify-content: space-between;
}

#publisher div.info-left {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: space-evenly;
}

#publisher div.info-right {
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: space-evenly;
}

#subscribing-dialog div.row {
  display: flex;
  flex-direction: row;
  align-items: end;
  justify-content: space-between;
}

#subscribing-dialog div.item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#publisher h2.name {
  color: v-bind(mainColor);
  margin: 0px;
  margin-bottom: 15px;
}

#subscribing-dialog h2.title {
  margin: 0px;
  margin-bottom: 35px;
}

#publisher p.info {
  margin: 0px;
  color: gray;
}

#publisher p.back {
  margin: 0px;
  margin-bottom: 25px;
  color: v-bind(mainColor);
  cursor: pointer;
}

#subscribing-dialog p.discard {
  margin: 0px;
  margin-bottom: 35px;
  color: v-bind(mainColor);
  cursor: pointer;
}

#subscribing-dialog p.info {
  margin: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: gray;
}

#subscribing-dialog p.price {
  margin: 0;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: bold;
  color: v-bind(mainColor);
}

#publisher button.submit {
  height: 32px;
  width: 100px;
  margin-bottom: 15px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: v-bind(mainColor);
  color: white;
  border: 0px;
  border-radius: 3px;
  box-shadow: 2px 2px 5px darkgray;
}

#subscribing-dialog button.subscribe {
  padding: 10px;
  border: 0px;
  border-radius: 3px;
  color: white;
}
</style>