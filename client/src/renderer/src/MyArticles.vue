<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { paths, mainColor, dangerColor } from '@renderer/keys'
import { useAccountStore } from '@renderer/store/account'
import MayLoad from '@renderer/components/MayLoad.vue'

const router = useRouter()
const account = useAccountStore()
const mayLoad = ref<typeof MayLoad | null>(null)
const myArticles: Ref<{
    ipfsAddress: string,
    title: string,
}[]> = ref([])

async function loadMyArticles() {
    myArticles.value = await window.api.article.myArticles()
}

async function removeArticle(title: string) {
    await window.api.article.removeArticle(title)
    myArticles.value = await window.api.article.myArticles()
    await mayLoad.value?.update()
}

function openArticle(ipfsAddress: string) {
    router.push(paths.article(ipfsAddress))
}

function openPublisher(address: string) {
    router.push(paths.publisher(address))
}
</script>

<template>
  <MayLoad ref="mayLoad" :load="loadMyArticles">
    <div id="my-articles">
      <div class="page-header">
        <h1 class="name clickable" @click="openPublisher(account.data.address)">{{ account.data.name! }}</h1>
      </div>
      <p v-if="myArticles.length == 0">You havn't posted any article yet!</p>
      <div v-for="article in myArticles" class="card">
        <div class="left clickable" @click="openArticle(article.ipfsAddress)">
          <h2 class="title">{{ article.title }}</h2>
          <p class="info">{{ article.ipfsAddress }}</p>
        </div>
        <p class="remove clickable" @click="removeArticle(article.title)">REMOVE</p>
      </div>
    </div>
  </MayLoad>
</template>

<style>
#my-articles div.page-header {
  margin-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid gray;
}

#my-articles div.card {
  border-radius: 5px;
  box-shadow: 5px 5px 8px darkgray;
  margin-top: 25px;
  padding: 30px;
  padding-left: 50px;
  padding-right: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

#my-articles div.card div.left {
  flex-grow: 1;
}

#my-articles h1.name {
  margin: 0px;
}

#my-articles div.card h2.title {
  margin: 0;
  padding: 0;
  margin-bottom: 10px;
  color: v-bind(mainColor);
}

#my-articles div.card p.info {
  margin: 0;
  color: gray;
}

#my-articles div.card p.remove {
  margin: 0;
  font-weight: bold;
  color: v-bind(dangerColor)
}
</style>