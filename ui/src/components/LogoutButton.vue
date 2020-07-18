<template>
  <div class="o-logout-btn shadow" role="button" @click="logout">
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
@media only screen and (max-width: 768px) {
  .o-logout-btn {
    left: 0.5em;
  }
}

@media only screen and (min-width: 768px) {
  .o-logout-btn {
    right: 2em;
  }
}

.o-logout-btn {
  align-items: center;
  justify-content: center;
  border-radius: 500px;
  bottom: 6em;
  position: fixed;
  cursor: pointer;
  display: flex;
  height: 3em;
  min-width: 2em;
  width: fit-content;
  padding-left: 1em;
  padding-right: 1em;
  background-color: rgb(255, 255, 255);
}

.o-logout-btn:hover {
  background-color: #e8f0fe;
}
</style>