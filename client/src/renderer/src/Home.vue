<script setup lang="ts">
import { computed, ref } from 'vue'
import { mainColor } from '@renderer/keys'
import { useAccountStore } from '@renderer/store/account'
import { useUpdatesStore } from '@renderer/store/updates'
import { formatDateTime } from '@renderer/dateFormatter'
import { queryFetchUpdates } from '@renderer/query'
import MayLoad from '@renderer/components/MayLoad.vue'
import ArticleList from '@renderer/components/ArticleList.vue'

const mayLoad = ref<typeof MayLoad | null>(null)
const account = useAccountStore()
const updates = useUpdatesStore()
const address = computed(() => account.data.address )
const noFollowings = computed(() => account.data.followings.length === 0)
const updatesData = computed(() => updates.data.get(account.data.address))

async function loadUpdates() {
    await account.update()
    if (noFollowings.value)
        return
    // get result from query
    const list: PublisherInfo[] = []
    for (const ele of account.data.followings)
        list.push(ele.info)
    const result = await queryFetchUpdates(list)
    updates.update(address.value, result.from, result.to, result.infos)
}
</script>

<template>
  <div id="home">
    <MayLoad ref="mayLoad" :load="loadUpdates" :init="updatesData?.content.length === 0">
      <template #before>
        <div class="buttons">
          <button class="fetch" @click="mayLoad?.update">FETCH UPDATES</button>
        </div>
      </template>
      <template #default>
        <p v-if="noFollowings">You have followed no publishers! Go and follow some for their updates!</p>
      </template>
      <template #after>
        <div v-if="!noFollowings" v-for="item in updatesData?.content.slice().reverse()" style="margin-bottom: 40px;">
          <div class="page-header">
            <h2 style="margin: 0;">
              From {{ formatDateTime(item.from) }} to {{ formatDateTime(item.to) }}
            </h2>
          </div>
          <p v-if="item.infos.length == 0">No updates yet!</p>
          <ArticleList :list="item.infos" />
        </div>
      </template>
    </MayLoad>
  </div>
</template>

<style>
#home div.page-header {
  margin-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid gray;
}

#home div.buttons {
  margin-bottom: 25px;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

#home button.fetch {
  padding: 12px;
  padding-left: 15px;
  padding-right: 15px;
  font-size: 16px;
  background-color: v-bind(mainColor);
  color: white;
  border: 0px;
  border-radius: 3px;
}
</style>