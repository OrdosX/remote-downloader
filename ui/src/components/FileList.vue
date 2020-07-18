<template>
  <b-col md="8">
    <b-table-simple>
      <b-thead>
        <b-th>文件名</b-th>
        <b-th>操作</b-th>
      </b-thead>
      <b-tr v-for="f in files" :key="f.name">
        <b-td>{{ f.name }}</b-td>
        <b-td>
          <b-button variant="primary" :href="f.URL" class="mr-3">
            <b-icon-link45deg />
          </b-button>
          <b-button variant="success" :data-clipboard-text="f.URL" class="clipboard-item mr-3">
            <b-icon-clipboard />
          </b-button>
          <b-button variant="danger" @click="removeFile(f.name)" v-if="isLogin">
            <b-icon-trash />
          </b-button>
        </b-td>
      </b-tr>
    </b-table-simple>
    <div class="o-hint-container" v-if="status!=='hide'">
      <b-icon-exclamation-circle font-scale="2" v-if="status==='error'" />
      <b-icon-circle-fill font-scale="2" animation="throb" v-if="status==='loading'" />
      <span class="o-hint-message">{{ message }}</span>
    </div>
  </b-col>
</template>

<script>
import axios from "axios";
export default {
  name: "FileList",
  props: ["update", "isLogin"],
  data: function() {
    return {
      files: [],
      status: 'loading',
      message: '',
      messages: {
        ERR_NETWORK: '无法连接到服务器',
        ERR_NO_CONTENT: '下载列表为空'
      }
    };
  },
  methods: {
    listFiles: function() {
      axios.get("/api/files").then(response => {
        this.files = [];
        for (let f of response.data.files) {
          this.files.push(f);
        }
        if(this.files.length == 0) {
          this.message = this.messages.ERR_NO_CONTENT
          this.status = 'error'
        } else {
          this.status = 'hide'
        }
      }).catch((err) => {
        this.message = this.messages.ERR_NETWORK
        this.status = 'error'
        console.error(err);
      });
    },
    removeFile: function(name) {
      axios.delete("/api/files/" + name).then(() => {
        this.listFiles();
      });
    }
  },
  watch: {
    update: function() {
      this.listFiles();
    }
  }
};
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