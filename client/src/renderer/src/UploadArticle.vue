<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { paths, mainColor } from '@renderer/keys'
import Dialog from '@renderer/components/Dialog.vue'

const router = useRouter()
const filePath = ref('')
const title = ref('')
const reqSubscribing = ref(false)
const uploadStatus = ref(0)

async function selectFile() {
    const path = await window.api.openFile()
    if (path)
        filePath.value = path
}

async function upload() {
    if (filePath.value === '') {
        uploadStatus.value = 1
        return
    }
    if (title.value === '') {
        uploadStatus.value = 2
        return
    }
    await window.api.article.uploadArticle(filePath.value, title.value, reqSubscribing.value)
    router.push(paths.myArticles)
}
</script>

<template>
  <div id="upload">
    <div class="page-header">
      <h1 style="margin: 0;">Upload Articles</h1>
    </div>
    <div class="center">
      <div class="column">
        <div class="row">
          <input v-model="filePath" class="inputbox" placeholder="select an article to upload..." disabled/>
          <button class="button" @click="selectFile">SELECT</button>
        </div>
        <div class="row">
          <p class="title">Title:</p>
          <input v-model="title" class="inputbox" placeholder="enter article title..." />
        </div>
        <div class="row">
          <input type="checkbox" v-model="reqSubscribing" id="reqSubscribingCB" class="checkbox" />
          <label for="reqSubscribingCB" class="title" style="margin-left: 5px">Require Subscribing</label>
        </div>
        <div class="buttons">
          <button class="submit" @click="upload">UPLOAD</button>
        </div>
      </div>
    </div>
  </div>
  <Dialog v-if="uploadStatus !== 0" id="upload-dialog" :width="400">
    <p v-if="uploadStatus === 1">Must select a file!</p>
    <p v-if="uploadStatus === 2">Must have a title!</p>
    <div class="row-right">
      <button class="confirm" @click="uploadStatus = 0">CONFIRM</button>
    </div>
  </Dialog>
</template>

<style>
#upload div.page-header {
  margin-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
}

#upload div.center {
  position: absolute;
  width: calc(100% - 680px);
  height: calc(100%);
  top: 0;
  padding-left: 200px;
  padding-right: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}

#upload div.column {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}

#upload div.row {
  width: 100%;
  margin-bottom: 30px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

#upload-dialog div.row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

#upload .title {
  margin: 0;
  margin-right: 20px;
  color: #808080;
}

#upload input.inputbox {
  padding: 8px;
  flex-grow: 1;
  border: 1px solid gray;
  border-radius: 2px;
}

#upload input.checkbox:checked {
  color: v-bind(mainColor);
  background-color: v-bind(mainColor);
}

#upload button.button {
  height: 32px;
  margin-left: 15px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: v-bind(mainColor);
  color: white;
  border: 0px;
  border-radius: 3px;
}

#upload button.submit {
  padding: 12px;
  padding-left: 15px;
  padding-right: 15px;
  font-size: 16px;
  background-color: v-bind(mainColor);
  color: white;
  border: 0px;
  border-radius: 3px;
}

#upload-dialog button.confirm {
  height: 32px;
  padding-left: 14px;
  padding-right: 14px;
  background-color: v-bind(mainColor);
  border: 0px;
  border-radius: 3px;
  color: white;
}
</style>