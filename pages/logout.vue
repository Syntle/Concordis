<template>
  <div></div>
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  middleware({ $auth, $axios, redirect }) {
    if (!$auth.loggedIn) return redirect('/')

    const sid = $auth.$state.sid
    if ($auth.$storage.getCookie('sid')) $auth.$storage.removeCookie('sid')
    if ($auth.$state.sid) $auth.$storage.removeState('sid')
    if ($auth.user) $auth.setUser(undefined)

    $axios({
      method: 'post',
      url: `${process.env.WEBSITE_URL}/graphql`,
      data: {
        query:
          'mutation Session($id: ID!) { \
                deleteSession(id: $id) \
              }',
        variables: {
          id: sid,
        },
      },
      headers: { 'Content-Type': 'application/json' },
    }).then(() => redirect('/'))
  },
})
</script>
