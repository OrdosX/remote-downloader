<template>
  <div class="o-logout-btn" role="button" @click="logout">
    <b-icon-box-arrow-right font-scale="1.5" />
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: "LogoutButton",
  methods: {
    logout: function() {
      axios.delete('/api/session').then(() => {
        this.$emit("logout");
      })
    }
  }
};
</script>

<style>
.o-logout-btn {
  align-items: center;
  justify-content: center;
  border-radius: 500px;
  right: 30px;
  bottom: 30px;
  position: fixed;
  cursor: pointer;
  display: flex;
  height: 3em;
  min-width: 2em;
  width: fit-content;
  padding-left: 1em;
  padding-right: 1em;
  background-color: rgb(255, 255, 255);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.23);
}

.o-logout-btn:hover {
  background-color: #e8f0fe;
}
</style>