<script setup lang="ts">
import { useAccountStore } from '@renderer/store/account'
import MayLoad from '@renderer/components/MayLoad.vue'
import PublisherList from '@renderer/components/PublisherList.vue'

const account = useAccountStore()

async function loadFollowings() {
    await account.update()
}
</script>

<template>
  <MayLoad :load="loadFollowings">
    <div id="followings">
      <div class="page-header">
        <h1 style="margin: 0;">Followings</h1>
      </div>
      <p v-if="account.data.followings.length === 0">You havn't followed any publisher yet!</p>
      <PublisherList :list="account.data.followings" :unfollow="true" />
    </div>
  </MayLoad>
</template>

<style>
#followings div.page-header {
  margin-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid gray;
}
</style>