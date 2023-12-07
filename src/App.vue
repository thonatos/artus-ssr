<script setup lang="ts">
import { ref, useSSRContext } from 'vue';

const ctx = import.meta.env.SSR ? useSSRContext() : {}
const count = ref(0);
const msg = ref(ctx?.data?.msg);
</script>

<template>
  <img class="logo" src="/vite.svg" alt="" />
  <img class="logo vue" src="./assets/vue.svg" alt="" />

  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>App.vue</code> to test HMR
    </p>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
