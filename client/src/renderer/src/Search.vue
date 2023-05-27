<script setup lang="ts">
import { computed, ref } from 'vue'
import { mainColor } from '@renderer/keys'
import { SubscribingStatus } from '@renderer/store/account'
import { querySearchTitle, querySearchPublisher } from '@renderer/query'
import MayLoad from '@renderer/components/MayLoad.vue'
import ArticleList from '@renderer/components/ArticleList.vue'
import PublisherList from '@renderer/components/PublisherList.vue'

// const updateTrick = ref(false)
const mayLoad = ref<typeof MayLoad | null>(null)
const articleSearched = ref(false)
const articleKeywords = ref('')
const articleResult = ref<ArticleInfo[]>([])
const publisherSearched = ref(false)
const publisherKeywords = ref('')
const publisherResult = ref<{ info: PublisherInfo, subscribing: SubscribingInfo }[]>([])
const keywords = ref('')
const searchType = ref('article')
const searchArticle = computed(() => searchType.value == 'article')
const searchPublisher = computed(() => searchType.value == 'publisher')
const empty = computed(() => {
    if (searchType.value == 'article' && articleResult.value.length === 0)
        return true
    if (searchType.value == 'publisher' && publisherResult.value.length === 0)
        return true
    return false
})

async function search() {
    if (searchArticle.value === true) {
        articleResult.value = await querySearchTitle(keywords.value)
        articleSearched.value = true
        articleKeywords.value = keywords.value
    }

    if (searchPublisher.value === true) {
        const result = await querySearchPublisher(keywords.value)
        publisherResult.value = []
        for (const ele of result)
            publisherResult.value.push({
                info: ele,
                subscribing: { status: SubscribingStatus.NO },
            })
        publisherSearched.value = true
        publisherKeywords.value = keywords.value
    }
}
</script>

<template>
  <div id="search">
    <div class="header">
      <div class="row">
        <input v-model="keywords" class="inputbox" placeholder="enter keywords to search" @keyup.enter="mayLoad?.update"/>
        <button class="submit" @click="mayLoad?.update">SEARCH</button>
      </div>
      <div class="row">
        <div @click="searchType = 'article'">
          <input type="radio" v-model="searchType" name="searchType" value="article" id="searchArticle" />
          <label for="searchArticle" class="info">Article</label>
        </div>
        <div @click="searchType = 'publisher'">
          <input type="radio" v-model="searchType" name="searchType" value="publisher" id="searchPublisher" style="margin-left: 20px"/>
          <label for="searchPublisher" class="info">Publisher</label>
        </div>
      </div>
    </div>
    <MayLoad ref="mayLoad" :load="search" :init="false">
      <div v-if="searchType == 'article' && articleSearched">
        <p v-if="empty">No results!</p>
        <div v-else>
          <div class="result-header">
            <h2 style="margin: 0;">
              Search results for "{{ articleKeywords }}":
            </h2>
          </div>
          <ArticleList v-if="searchArticle" :list="articleResult" />
        </div>
      </div>
      <div v-if="searchType == 'publisher' && publisherSearched">
        <p v-if="empty">No results!</p>
        <div v-else>
          <div class="result-header">
            <h2 style="margin: 0;">
              Search results for "{{ publisherKeywords }}":
            </h2>
          </div>
          <PublisherList v-if="searchPublisher" :list="publisherResult" />
        </div>
      </div>
    </MayLoad>
  </div>
</template>

<style>
#search div.header {
  width: 100%;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

#search div.row {
  width: 70%;
  margin-bottom: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

#search div.result-header {
  margin-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid gray;
}

#search label.info {
  margin: 0;
  margin-left: 5px;
  color: #808080;
}

#search input.inputbox {
  padding: 8px;
  flex-grow: 1;
  border: 1px solid gray;
  border-radius: 2px;
}

#search button.submit {
  height: 32px;
  margin-left: 15px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: v-bind(mainColor);
  color: white;
  border: 0px;
  border-radius: 3px;
}
</style>