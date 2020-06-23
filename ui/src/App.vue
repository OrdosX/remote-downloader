<template>
  <div id="app">
    <b-row align-h="center">
      <b-col md="8">
        <b-input-group class="mt-3" v-if="passphrase.length != 0">
          <b-input-group-prepend>
            <b-input-group-text>
              <b-icon-link45deg />
            </b-input-group-text>
          </b-input-group-prepend>
          <b-form-input v-model="url" @keyup="updateNameFromURL" @dblclick.native="getClip"></b-form-input>
          <b-input-group-append>
            <b-input-group-text @click="resetForm">
              <b-icon-x />
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
        <b-input-group class="mt-3" v-if="passphrase.length != 0">
          <b-input-group-prepend>
            <b-input-group-text>
              <b-icon-file-earmark-text />
            </b-input-group-text>
          </b-input-group-prepend>
          <b-form-input v-model="name" :state="nameOK"></b-form-input>
          <b-input-group-append>
            <b-input-group-text @click="buttonClick">
              <b-icon-play v-if="!downloading" />
              <b-icon-stop-fill v-if="downloading" />
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
        <b-input-group class="mt-3" v-if="passphrase.length == 0">
          <b-input-group-prepend>
            <b-input-group-text>
              <b-icon-shield-lock />
            </b-input-group-text>
          </b-input-group-prepend>
          <b-form-input v-model="password"></b-form-input>
          <b-input-group-append>
            <b-input-group-text @click="login">
              <b-icon-play />
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
        <b-progress
          id="progress-bar"
          :value="progress"
          max="100"
          v-show="downloading"
          animated
          show-progress
        />
      </b-col>
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
              <b-button variant="danger" @click="removeFile(f.name)" v-if="passphrase.length != 0">
                <b-icon-trash />
              </b-button>
            </b-td>
          </b-tr>
        </b-table-simple>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import axios from "axios";
import {sha256} from "js-sha256"
import Clipboard from "clipboard";
export default {
  name: "App",
  data: function() {
    return {
      url: "",
      name: "",
      nameOK: null,
      progress: 0,
      taskID: "",
      downloading: false,
      buttonClick: this.newTask,
      files: [],
      password: "",
      passphrase: ""
    };
  },
  methods: {
    updateNameFromURL: function() {
      let splitedURL = this.url.split("/");
      let possibleName = splitedURL[splitedURL.length - 1];
      if (possibleName.indexOf("?") > -1) {
        let splitedName = possibleName.split("?");
        possibleName = splitedName[0];
      }
      let splitedName = possibleName.split(".");
      if (splitedName.length > 1) {
        this.name = possibleName;
        this.nameOK = true;
        return;
      }
      this.nameOK = false;
    },
    getClip: function() {
      navigator.clipboard
        .readText()
        .then(text => {
          this.url = text;
          this.updateNameFromURL();
        })
        .catch(error => {
          alert("无法读取剪贴板：", error);
          console.log(error);
        });
    },
    newTask: function() {
      if (this.name.length == 0 || this.url.length == 0 || !this.nameOK) {
        return;
      }
      this.downloading = true;
      axios
        .post("/api/tasks", {
          name: this.name,
          URL: this.url
        })
        .then(response => {
          if (response.data.code != 0) {
            alert(response.data.errmsg);
          } else {
            this.taskID = response.data.ID;
            document
              .getElementById("progress-bar")
              .dispatchEvent(new Event("update-progress"));
          }
        });
    },
    resetForm: function() {
      this.url = "";
      this.name = "";
      this.nameOK = null;
    },
    resetControl: function() {
      this.url = "";
      this.name = "";
      this.nameOK = null;
      this.progress = 0;
      this.taskID = "";
      this.downloading = false;
      this.buttonClick = this.newTask;
    },
    listFiles: function() {
      axios.get("/api/files").then(response => {
        this.files = [];
        for (let f of response.data) {
          this.files.push(f);
        }
      });
    },
    removeFile: function(name) {
      axios.delete("/api/files/" + name).then(() => {
        this.listFiles();
      });
    },
    login: function() {
      axios.post("/sessions")
      sha256(this.password)
    }
  },
  mounted: function() {
    let progressBar = document.getElementById("progress-bar");
    progressBar.addEventListener("update-progress", () => {
      setTimeout(() => {
        axios.get("/api/tasks/" + this.taskID).then(response => {
          if (response.data.code == 0) {
            //此时下载完成
            this.resetControl();
            this.listFiles();
          } else if (response.data.code == 1) {
            //此时正在下载
            this.downloading = true;
            this.progress = response.data.progress;
            this.buttonClick = function() {
              this.resetControl();
              axios.delete("/api/tasks/" + this.taskID);
            };
            progressBar.dispatchEvent(new Event("update-progress"));
          } else {
            //此时发生错误
            this.resetControl();
            alert(response.data.errmsg);
          }
        });
      }, 0);
    });

    this.listFiles();
    new Clipboard(".clipboard-item");
  }
};
</script>

<style>
.row {
  margin-right: 0 !important;
  margin-left: 0 !important;
}
</style>
