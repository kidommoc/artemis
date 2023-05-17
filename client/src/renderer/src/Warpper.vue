<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
    console.log('Wrapper mounted')
})
</script>

<template>
  <router-view />
</template>

<style>
h1, h2, h3, p, a, label, span, input, button {
  font-family: 'Century';
}

button:hover {
  cursor: pointer;
}

.clickable:hover {
  cursor: pointer;
}
</style>