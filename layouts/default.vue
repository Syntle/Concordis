<template>
  <v-app dark>
    <v-main>
      <v-container>
        <Navbar />
        <nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import Navbar from '@/components/Navbar.vue'

export default Vue.extend({
  components: {
    Navbar,
  },
})
</script>

<style>
::-webkit-scrollbar {
  width: 15px;
}

::-webkit-scrollbar-track {
  background: #202020;
  border-left: 1px solid #2c2c2c;
}

::-webkit-scrollbar-thumb {
  background: #3e3e3e;
  border: solid 3px #202020;
  border-radius: 7px;
}

::-webkit-scrollbar-thumb:hover {
  background: #525252;
}
</style>
