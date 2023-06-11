<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { mainColor, paths } from '@renderer/keys'
import { useAccountStore } from '@renderer/store/account'

const route = useRoute()
const account = useAccountStore()
const pos = (to: string): string => to == route.path ? '> ' : ''
const name = computed(() => {
    if (account.data.name)
        return account.data.name
    else
        return account.data.address.slice(0, 8)
})
const isPublisher = computed(() => account.data.isPublisher)
</script>

<template>
  <div id="sidebar" :style="{ 'background-color': mainColor }">
    <div class="flex">
      <div>
        <p style="font-size: 24px; font-weight: bold; margin-bottom: 20pxl;">ARTEMIS</p>
        <p><router-link :to="paths.home">{{ pos(paths.home) }}Home</router-link></p>
        <p><router-link :to="paths.search">{{ pos(paths.search) }}Search</router-link></p>
        <p><router-link :to="paths.followings">{{ pos(paths.followings) }}Followings</router-link></p>
        <p><router-link :to="paths.favourites">{{ pos(paths.favourites) }}Favourites</router-link></p>
      </div>
      <div class="bottom">
        <p v-if="isPublisher"><router-link :to="paths.upload">{{ pos(paths.upload) }}Post Article</router-link></p>
        <p v-if="isPublisher"><router-link :to="paths.myArticles">{{ pos(paths.myArticles) }}My Articles</router-link></p>
        <p><router-link :to="paths.settings">{{ name }}</router-link></p>
      </div>
    </div>
  </div>
</template>

<style>
div#sidebar {
  height: calc(100% - 30px);
  width: 150px;
  position: fixed;
  left: 0;
  top: 0;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0px 5px 8px darkgray;
}

#sidebar div.flex {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: space-between;
  color: white;
}

#sidebar a {
  color: white;
  text-decoration: none;
}
</style>