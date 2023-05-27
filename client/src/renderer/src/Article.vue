<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paths, mainColor, subColor } from '@renderer/keys'
import { formatDateTime } from '@renderer/dateFormatter'
import MayLoad from '@renderer/components/MayLoad.vue';

const updateTrick = ref(false)
const route = useRoute()
const router = useRouter()
const inexist = ref(false)
const access = ref(true)
const info = ref<ArticleInfo | undefined>(undefined)
const article = ref<Article | undefined>(undefined)
const isFavourite = ref(false)
const imgs = ref<Blob[]>([])
const address = computed(() => route.params.addr as string)

async function loadArticle() {
    info.value = await window.api.article.getArticleInfo(address.value)
    if (!info.value) {
        inexist.value = true
        return
    }
    const result = await window.api.article.fetchArticle(address.value)
    if (result === null) {
        inexist.value = true
        return
    }
    if (result === undefined) {
        access.value = false
        return
    }
    article.value = result as Article
    isFavourite.value = await window.api.article.isFavouriting(address.value)

    // create urls for images
    for (const img of article.value.images) {
        imgs.value.push(new Blob([img.bytes], { type: img.type }))
        const blobUrl = window.URL.createObjectURL(imgs.value[imgs.value.length - 1])
        article.value.content = article.value.content.replaceAll(img.hash, blobUrl)
    }
    const el = document.createElement('div')
    el.innerHTML = article.value.content
    const imgEles = el.getElementsByTagName('img')
    for (const ele of imgEles) {
        if (ele.alt != '') {
            const info = document.createElement('p')
            if (ele.parentElement)
               ele.parentElement.style.marginBottom = '0px'
            ele.style.marginBottom = '0px'
            info.innerText = ele.alt
            info.className = "img-info"
            ele.insertAdjacentElement('afterend', info)
        }
    }
    article.value.content = el.innerHTML
}

async function favourite(ipfsAddress: string) {
    await window.api.article.favouriteArticle(ipfsAddress)
    isFavourite.value = await window.api.article.isFavouriting(address.value)
    updateTrick.value = !updateTrick.value
}

async function unfavourite(ipfsAddress: string) {
    await window.api.article.unfavouriteArticle(ipfsAddress)
    isFavourite.value = await window.api.article.isFavouriting(address.value)
    updateTrick.value = !updateTrick.value
}
</script>

<template>
  <MayLoad :load="loadArticle">
    <div id="article">
      <p class="back clickable" @click="router.go(-1)">...back</p>
      <div v-if="inexist">
          <h2>Inexist article!</h2>
      </div>
      <div v-else>
        <div class="page-header">
          <div class="row">
            <h1 class="title">{{ info!.title }}</h1>
            <button v-if="isFavourite" class="fav" @click="unfavourite(info!.ipfsAddress)">Unfavourite</button>
            <button v-else class="fav" @click="favourite(info!.ipfsAddress)">Favourite</button>
          </div>
          <div class="row">
            <p><router-link :to="paths.publisher(info!.publisher.address)">
              {{ info!.publisher.name }}
            </router-link></p>
            <p class="info">{{ formatDateTime(info!.date) }}</p>
          </div>
        </div>
        <div v-if="access" v-html="article!.content" id="content"></div>
        <h2 v-else>You have no access permission of this article! Please subscriber its publisher first!</h2>
      </div>
    </div>
  </MayLoad>
</template>

<style>
#article div.page-header {
  margin: 0;
  margin-top: 30px;
  margin-bottom: 30px;
  padding-left: 20px;
  padding-right: 30px;
  border-bottom: 2px solid lightgray;
}

#article div.page-header div.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

#article div.page-header h1.title {
  margin: 0;
}

#article p.back {
  margin: 0;
  color: v-bind(mainColor);
}

#article div.page-header p.info {
  margin: 0;
  color: gray;
}

#article div.page-header a {
  color: v-bind(mainColor);
  text-decoration: none;
}

#article div.page-header button.fav {
  height: 32px;
  width: 100px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: burlywood;
  color: white;
  border: 0px;
  border-radius: 3px;
  box-shadow: 2px 2px 5px darkgray;
}

#content blockquote.markdown {
  margin-left: 0px;
  margin-right: 30px;
  padding-left: 30px;
  border-left: 4px solid v-bind(mainColor);
}

#content codeblock.markdown {
  padding: 15px;
  background-color: #f2f2f2;
  border: 1px solid lightgray;
  border-radius: 3px;
}

#content ul.markdown {
  list-style-type: square;
}

#content p.img-info {
  margin: 0;
  margin-bottom: 40px;
  text-align: center;
  color: gray;
}

#content a.markdown {
  text-decoration: none;
  color: v-bind(mainColor);
}

#content a.markdown:visited {
  color: v-bind(subColor);
}

#content img.markdown {
  width: calc(100% - 200px);
  margin-top: 30px;
  margin-bottom: 30px;
  margin-left: 100px;
  margin-right: 100px;
}
</style>