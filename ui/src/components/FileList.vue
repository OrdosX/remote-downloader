<template>
  <b-col md="8" class="mt-3 shadow">
    <b-table-simple>
      <b-thead>
        <b-th>文件名</b-th>
        <b-th class="text-right">操作</b-th>
      </b-thead>
      <b-tr v-for="f in files" :key="f.name">
        <b-td><span :id="f.name">{{ f.name }}</span></b-td>
        <b-tooltip :target="f.name">
          <span>{{ new Intl.DateTimeFormat('zh-CN', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12:false}).format(new Date(f.modified)) }}</span>
          <br />
          <span>{{ f.size }}</span>
        </b-tooltip>
        <b-td class="text-right">
          <b-button variant="light" :href="f.URL" class="shadow-sm">
            <b-icon-link45deg />
          </b-button>
          <b-button variant="light" :data-clipboard-text="f.URL" class="clipboard-item ml-3 mt-1 shadow-sm">
            <b-icon-clipboard />
          </b-button>
          <b-button variant="danger" @click="removeFile(f.name)" v-if="isLogin" class="ml-3 mt-1 shadow-sm">
            <b-icon-trash />
          </b-button>
        </b-td>
      </b-tr>
    </b-table-simple>
    <div class="o-hint-container mb-3" v-if="status!=='hide'">
      <b-icon-exclamation-circle font-scale="2" v-if="status==='error'" />
      <b-icon-circle-fill font-scale="2" animation="throb" v-if="status==='loading'" />
      <span class="o-hint-message">{{ message }}</span>
    </div>
  </b-col>
</template>

<script>
import axios from 'axios'
import Clipboard from 'clipboard'
export default {
  name: 'FileList',
  props: ['update', 'isLogin'],
  data: function () {
    return {
      files: [],
      status: 'loading',
      message: '',
      messages: {
        ERR_NETWORK: '无法连接到服务器',
        ERR_NO_CONTENT: '下载列表为空'
      }
    }
  },
  methods: {
    listFiles: function () {
      axios.get('/api/files').then(response => {
        this.files = []
        for (const f of response.data.files) {
          this.files.push(f)
        }
        if (this.files.length === 0) {
          this.message = this.messages.ERR_NO_CONTENT
          this.status = 'error'
        } else {
          this.status = 'hide'
        }
      }).catch((err) => {
        this.message = this.messages.ERR_NETWORK
        this.status = 'error'
        console.error(err)
      })
    },
    removeFile: function (name) {
      axios.delete('/api/files/' + name).then(() => {
        this.listFiles()
      })
    }
  },
  watch: {
    update: function () {
      this.listFiles()
    }
  },
  mounted: function () {
    new Clipboard('.clipboard-item')
  }
}
</script>

<style>
.o-hint-container {
  display: flex;
  justify-content: center;
  vertical-align: middle;
}
.o-hint-message {
  font-size: 1.5em;
}
</style>