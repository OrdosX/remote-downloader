<template>
  <b-col md="8">
    <b-input-group class="mt-3 shadow">
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
    <b-input-group class="mt-3 shadow">
      <b-input-group-prepend>
        <b-input-group-text>
          <b-icon-file-earmark-text />
        </b-input-group-text>
      </b-input-group-prepend>
      <b-form-input v-model="name" :state="nameOK" @keyup="nameOK=null"></b-form-input>
      <b-input-group-append>
        <b-input-group-text v-if="!downloading" @click="newTask">
          <b-icon-play />
        </b-input-group-text>
        <b-input-group-text v-if="downloading" @click="stopTask">
          <b-icon-stop-fill />
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
</template>

<script>
import axios from 'axios'
import urlencode from 'urlencode'
import debounce from 'lodash/debounce'
export default {
  name: 'TaskControl',
  data: function () {
    return {
      // 下载表单部分
      url: '',
      name: '',
      nameOK: null,
      // 任务控制部分
      progress: 0,
      taskID: '',
      downloading: false,
      startTime: null,
      updateIntervals: { fast: 500, slow: 3000 },
      updateInterval: 500
    }
  },
  methods: {
    getNameFromHeader: debounce(function () {
      axios.get('/api/filename', { params: { url: urlencode(this.url) } }).then(res => {
        if (res.data.name !== '') {
          this.name = res.data.name
          this.nameOK = true
        } else {
          this.nameOK = false
        }
      }).catch(() => {
        this.nameOK = false
      })
    }, 1000),
    updateNameFromURL: function () {
      const splitedURL = this.url.split('/')
      let possibleName = splitedURL[splitedURL.length - 1]
      if (possibleName.indexOf('?') > -1) {
        const splitedName = possibleName.split('?')
        possibleName = splitedName[0]
      }
      const splitedName = possibleName.split('.')
      if (splitedName.length > 1) {
        this.name = possibleName
        this.nameOK = true
        return
      }
      this.getNameFromHeader()
    },
    getClip: function () {
      navigator.clipboard
        .readText()
        .then(text => {
          this.url = text
          this.updateNameFromURL()
        })
        .catch(error => {
          alert('无法读取剪贴板：', error)
          console.error(error)
        })
    },
    newTask: function () {
      if (this.name.length === 0 || this.url.length === 0 || this.nameOK === false) {
        return
      }
      this.downloading = true
      axios
        .post('/api/tasks', {
          name: this.name,
          URL: this.url
        })
        .then(response => {
          if (response.data.code != 0) {
            alert(response.data.errmsg)
            console.error(response.data.errmsg)
          } else {
            this.taskID = response.data.ID
            document
              .getElementById('progress-bar')
              .dispatchEvent(new Event('update-progress'))
          }
        })
    },
    stopTask: function () {
      this.downloading = false
      axios
        .delete('/api/tasks/' + this.taskID)
        .then(() => {
          this.resetControl()
        })
    },
    resetForm: function () {
      this.url = ''
      this.name = ''
      this.nameOK = null
    },
    resetControl: function () {
      this.resetForm()
      this.progress = 0
      this.taskID = ''
      this.downloading = false
      this.startTime = null
      this.updateInterval = this.updateIntervals.fast
    }
  },
  mounted: function () {
    const progressBar = document.getElementById('progress-bar')
    progressBar.addEventListener('update-progress', () => {
      if (!this.startTime) this.startTime = Date.now()
      setTimeout(() => {
        if (this.taskID !== '') {
          axios.get('/api/tasks/' + this.taskID).then(response => {
            if (response.data.code == 0) {
              // 此时下载完成
              this.resetControl()
              this.$emit('task-complete')
            } else if (response.data.code == 1) {
              // 此时正在下载
              this.downloading = true
              this.progress = response.data.progress
              if (Date.now() > this.startTime + 30000) {
                // 如果过了三十秒还没下载完则进入慢速模式，请求数据间隔由0.5s改为3s
                this.updateInterval = this.updateIntervals.slow
              }
              progressBar.dispatchEvent(new Event('update-progress'))
            } else if (response.data.code == 2) {
              // 此时取消下载
              this.resetControl()
            } else {
              // 此时发生错误
              this.resetControl()
              alert(response.data.errmsg)
              console.error(response.data.errmsg)
            }
          }).catch(err => {
            console.error(err)
          })
        }
      }, this.updateInterval)
    })
  }
}
</script>

<style>
</style>