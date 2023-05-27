<script setup lang="ts">
import Sidebar from '@renderer/components/Sidebar.vue'
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