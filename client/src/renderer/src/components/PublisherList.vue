<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { paths, mainColor, dangerColor } from '@renderer/keys'
import { SubscribingStatus } from '@renderer/store/account'
import { formatDate } from '@renderer/dateFormatter'

const props = defineProps<{
    list: { info: PublisherInfo, subscribing: SubscribingInfo }[],
    unfollow?: boolean,
    subscribing?: boolean,
}>()
const router = useRouter()
const list = ref(props.list)

async function unfollow(address: string) {
    await window.api.account.unfollow(address)
    const index = props.list.findIndex(ele => ele.info.address == address)
    if (index != -1)
        list.value = list.value.splice(index)
}

function openPublisher(address: string) {
    router.push(paths.publisher(address))
}
</script>

<template>
  <div id="publisher-list">
    <div v-for="item in props.list" class="card">
      <div class="left clickable" @click="openPublisher(item.info.address)">
        <h2 class="title">{{ item.info.name }}</h2>
        <p class="info">{{ item.info.address }}</p>
        <div v-if="props.subscribing">
          <p v-if="item.subscribing.status == SubscribingStatus.REQ" class="info">Requesting Subscribing</p>
          <p v-if="item.subscribing.status == SubscribingStatus.YES" class="info">
            Subscribing to {{ formatDate(item.subscribing.time!) }}
          </p>
        </div>
      </div>
      <p v-if="props.unfollow" class="remove clickable" @click="unfollow(item.info.address)">REMOVE</p>
    </div>
  </div>
</template>

<style>
#publisher-list div.card {
  border-radius: 5px;
  box-shadow: 5px 5px 8px darkgray;
  margin-top: 20px;
  padding-top: 30px;
  padding-bottom: 30px;
  padding-left: 50px;
  padding-right: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

#publisher-list div.card div.left {
  flex-grow: 1;
}

#publisher-list div.card h2.title {
  margin: 0;
  padding: 0;
  margin-bottom: 10px;
  color: v-bind(mainColor);
}

#publisher-list div.card p.info {
  margin: 0;
  color: gray;
}

#publisher-list div.card p.remove {
  margin: 0;
  font-weight: bold;
  color: v-bind(dangerColor)
}
</style>