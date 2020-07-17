<template>
  <b-col md="8">
    <b-input-group class="mt-3">
      <b-input-group-prepend>
        <b-input-group-text>
          <b-icon-shield-lock />
        </b-input-group-text>
      </b-input-group-prepend>
      <b-form-input v-model="buffer" :state="passwordOK" @input="input" @keyup.enter="login"></b-form-input>
      <b-input-group-append>
        <b-input-group-text @click="login">
          <b-icon-play />
        </b-input-group-text>
      </b-input-group-append>
    </b-input-group>
  </b-col>
</template>

<script>
import axios from "axios";
import {sha256} from "js-sha256"
export default {
  name: "LoginForm",
  data: function() {
    return {
      buffer: '',
      password: '',
      passwordOK: null
    }
  },
  methods: {
    login: function() {
      axios.get("/api/salt").then(resp1 => {
        axios.post("/api/session", {
          saltID: resp1.data.saltID,
          password: sha256(this.password + resp1.data.salt)
        }).then(resp2 => {
          if(resp2.data.code == 0) {
            this.$emit('login-succ')
          } else {
            this.buffer = "";
            this.password = "";
            this.passwordOK = false;
            console.error(resp2.data.errmsg);
          }
        })
      })
    },
    input: function() {
      this.password += this.buffer.charAt(this.buffer.length-1)
      this.password = this.password.slice(0, this.buffer.length)
      this.buffer = this.genMask(this.buffer.length)
    },
    genMask: function(length) {
      let mask = '';
      for(let i = 0; i < length; i++) {
        mask += '¿'
      }
      return mask
    }
  }
}
</script>

<style>
</style>