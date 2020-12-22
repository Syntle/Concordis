<template>
  <div></div>
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  middleware(context) {
    if (!context.$auth.loggedIn) {
      context.redirect('/')
    } else {
      const sid = context.$auth.$state.sid
      if (context.$auth.$storage.getCookie('sid'))
        context.$auth.$storage.removeCookie('sid')
      if (context.$auth.$state.sid) context.$auth.$storage.removeState('sid')
      if (context.$auth.user) context.$auth.setUser(undefined)

      context
        .$axios({
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
        })
        .then(() => {
          context.redirect('/')
        })
    }
  },
})
</script>
