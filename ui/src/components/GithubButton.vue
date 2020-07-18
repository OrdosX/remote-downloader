<template>
  <div class="o-github-btn shadow" role="button" @click="go">
    <img class="o-github-text" src="https://cdn.jsdelivr.net/npm/simple-icons@v3/icons/github.svg" />
  </div>
</template>

<script>
export default {
  name: "GithubButton",
  methods: {
    go: function() {
      window.open('https://github.com/OrdosX/remote-downloader')
    }
  }
};
</script>

<style>
@media only screen and (max-width: 768px) {
  .o-github-btn {
    left: 0.5em;
  }
}

@media only screen and (min-width: 768px) {
  .o-github-btn {
    right: 2em;
  }
}

.o-github-btn {
  align-items: center;
  justify-content: center;
  border-radius: 500px;
  bottom: 2em;
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

.o-github-btn:hover {
  background-color: #e8f0fe;
}

.o-github-text {
    height: 1.5em;
    width: 1.5em;
}
</style>