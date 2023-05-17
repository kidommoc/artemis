<script setup lang="ts">
import { computed, ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface Props {
    width: number,
    backgroundColor?: string,
}

const props = withDefaults(defineProps<Props>(), {
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
})
const defaultHeight: Ref<number> = ref(window.innerHeight - 200)
const card = ref<HTMLElement | null>(null)

const width = computed(() => props.width + 'px')
const height = computed(() => {
    const cardHeight = card.value?.clientHeight
    if (cardHeight && cardHeight > defaultHeight.value)
        return cardHeight + 'px'
    return defaultHeight.value + 'px'
})
const backgroundColor = computed(() => props.backgroundColor)

function resize() {
    defaultHeight.value = window.innerHeight - 200
}

onMounted(() => window.addEventListener('resize', resize))

onUnmounted(() => window.removeEventListener('resize', resize))
</script>

<template>
  <div class="dialog">
    <div class="card" ref="card">
      <slot></slot>
    </div>
  </div>
</template>

<style>
div.dialog {
  position: fixed;
  top: 0;
  left: 0;
  height: v-bind(height);
  width: 100%;
  padding-top: 100px;
  padding-bottom: 100px;
  background-color: v-bind(backgroundColor);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}

div.dialog div.card {
  width: v-bind(width);
  border-radius: 5px;
  box-shadow: 5px 5px 8px rgba(128, 128, 128, 0.5);
  padding-top: 40px;
  padding-bottom: 40px;
  padding-left: 50px;
  padding-right: 50px;
  background-color: white;
}
</style>