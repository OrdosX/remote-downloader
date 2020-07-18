<template>
  <div id="app">
    <b-row align-h="center">
      <LoginForm v-if="!isLogin" @login-succ="updateStatus" />
      <TaskControl v-if="isLogin" @task-complete="updateStatus" />
      <FileList :update="fileListLastUpdate" :isLogin="isLogin" />
    </b-row>
    <LogoutButton v-if="isLogin" @logout="updateStatus" />
  </div>
</template>

<script>
import axios from 'axios';
import LoginForm from './components/LoginForm';
import TaskControl from './components/TaskControl';
import FileList from './components/FileList';
import LogoutButton from './components/LogoutButton'
export default {
  name: "App",
  components: {
    LoginForm,
    TaskControl,
    FileList,
    LogoutButton
  },
  data: function() {
    return {
      fileListLastUpdate: 0,
      isLogin: false
    };
  },
  methods: {
    updateStatus: function() {
      this.fileListLastUpdate = Date.now();
      axios.get('/api/session').then(response => {
        this.isLogin = (response.data.code == 0)
      }).catch(err => {
        console.error(err);
      })
    }
  },
  mounted: function() {
    this.updateStatus();
  }
};
</script>

<style>
.row {
  margin-right: 0 !important;
  margin-left: 0 !important;
}
</style>
