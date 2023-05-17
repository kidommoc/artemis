<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { paths, mainColor, dangerColor } from '@renderer/keys'
import MayLoad from '@renderer/components/MayLoad.vue'

const updateTrick = ref(false)
const router = useRouter()
const favourites = ref<{
    ipfsAddress: string,
    title: string,
}[]>([])

async function loadFavourites() {
    favourites.value = await window.api.article.getFavouriteList()
}

async function unfavourite(ipfsAddress: string) {
    await window.api.article.unfavouriteArticle(ipfsAddress)
    favourites.value = await window.api.article.getFavouriteList()
    updateTrick.value = !updateTrick.value
}

function openArticle(ipfsAddress: string) {
    router.push(paths.article(ipfsAddress))
}
</script>

<template>
  <MayLoad :load="loadFavourites">
    <div id="favourites">
      <div class="page-header">
        <h1 style="margin: 0;">Favourites</h1>
      </div>
      <p v-if="favourites.length == 0">You havn't favourited any article yet!</p>
      <div v-for="article in favourites.slice().reverse()" class="card">
        <div class="left clickable" @click="openArticle(article.ipfsAddress)">
          <h2 class="title">{{ article.title }}</h2>
          <p class="info">{{ article.ipfsAddress }}</p>
        </div>
        <p class="remove clickable" @click="unfavourite(article.ipfsAddress)">REMOVE</p>
      </div>
    </div>
  </MayLoad>
</template>

<style>
#favourites div.page-header {
  margin-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid gray;
}

#favourites div.card {
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

#favourites div.card div.left {
  flex-grow: 1;
}

#favourites div.card h2.title {
  margin: 0;
  padding: 0;
  margin-bottom: 10px;
  color: v-bind(mainColor);
}

#favourites div.card p.remove {
  margin: 0;
  font-weight: bold;
  color: v-bind(dangerColor)
}
</style>