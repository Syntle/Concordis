<template>
  <div></div>
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  middleware({ redirect, $auth }) {
    if ($auth.loggedIn) redirect('/')
  },
  created() {
    if (process.client) this.$auth.loginWith('discord')
  },
})
</script>
