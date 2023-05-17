<script setup lang="ts">
import { useRouter } from 'vue-router'
import { paths, mainColor } from '@renderer/keys'
import { formatDate } from '@renderer/components/dateFormatter'

const props = defineProps<{
    list: ArticleInfo[]
}>()
const router = useRouter()

function openArticle(ipfsAddress: string) {
    router.push(paths.article(ipfsAddress))
}
</script>

<template>
  <div id="article-list">
    <div v-for="item in props.list" class="card clickable" @click="openArticle(item.ipfsAddress)">
      <h2 class="title">{{ item.title }}</h2>
      <p class="info"><router-link :to="`/app/publisher/${item.publisher.address}`">{{ item.publisher.name }}</router-link></p>
      <p class="info">
        <span>{{ formatDate(item.date) }}</span>
        <span v-if="item.reqSubscribing" :style="{ 'margin-left': '15px', 'color': mainColor }"> Require Subscribing</span>
      </p>
    </div>
  </div>
</template>

<style>
#article-list div.card {
  border-radius: 5px;
  box-shadow: 5px 5px 8px darkgray;
  margin-bottom: 20px;
  padding-top: 30px;
  padding-bottom: 30px;
  padding-left: 50px;
  padding-right: 50px;
}

#article-list div.card h2.title {
  margin: 0;
  padding: 0;
  color: v-bind(mainColor);
}

#article-list div.card p.info {
  margin: 0;
  margin-top: 10px;
  padding: 0;
  color: gray;
}

#article-list div.card p.info a {
  margin: 0;
  margin-top: 10px;
  padding: 0;
  text-decoration: none;
  color: gray;
}
</style>