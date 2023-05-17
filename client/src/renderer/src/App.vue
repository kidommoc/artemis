<script setup lang="ts">
import { onMounted } from 'vue';
import Sidebar from '@renderer/components/Sidebar.vue'

onMounted(() => {
    console.log('App mounted')
})
</script>

<template>
  <Sidebar />
  <div class="main">
    <router-view></router-view>
  </div>
</template>

<style>
div.main {
  margin-left: 180px;
  padding: 50px;
}
</style>