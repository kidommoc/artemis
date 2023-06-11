<script setup lang="ts">
import { onMounted, ref } from 'vue'

export interface Props {
    trick?: boolean,
    load: () => Promise<void>
    init?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    trick: false,
    init: undefined,
})

const loading = ref(true)
async function load() {
    if (loading.value === true) {
        await props.load()
        loading.value = false
    }
}

async function update() {
    loading.value = true
    await load()
}

defineExpose({
    update: update,
})

onMounted(async () => {
    loading.value = props.init === undefined ? true : props.init
    await load()
})
</script>

<template>
  <slot name="before"></slot>
  <div v-if="loading" class="loading">
    <h2>Loading...</h2>
  </div>
  <slot v-else></slot>
  <slot name="after"></slot>
</template>

<style>
div.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>