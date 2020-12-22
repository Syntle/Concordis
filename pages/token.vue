<template>
  <div></div>
</template>
<script lang="ts">
import Vue from 'vue'

const formUrlEncode = (data: any) => {
  return Object.entries(data)
    .map(([k, v]) => k + '=' + v)
    .join('&')
}

export default Vue.extend({
  async asyncData(context) {
    if (!context.query.code) return context.redirect('/')

    const tokenRequest = {
      client_id: context.env.CLIENT_ID,
      client_secret: context.$config.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: context.query.code,
      redirect_uri: `${context.env.WEBSITE_URL}/token`,
      scope: 'identify',
    }

    const { data: codeExchange } = await context.$axios({
      method: 'post',
      url: 'https://discord.com/api/oauth2/token',
      data: formUrlEncode(tokenRequest),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const { data: sessionCheck } = await context.$axios({
      method: 'post',
      url: `${context.env.WEBSITE_URL}/graphql`,
      data: {
        query:
          'query Session($accessToken: String!) { \
            sessionExists(accessToken: $accessToken) { \
              id \
            } \
          }',
        variables: { accessToken: codeExchange.access_token },
      },
      headers: { 'Content-Type': 'application/json' },
    })

    if (!sessionCheck.data.sessionExists) {
      const { data: sessionCreate } = await context.$axios({
        method: 'post',
        url: `${context.env.WEBSITE_URL}/graphql`,
        data: {
          query:
            'mutation Session($accessToken: String! $refreshToken: String! $expiresIn: Int! $scope: String!) { \
              setSession(accessToken: $accessToken \
              refreshToken: $refreshToken \
              expiresIn: $expiresIn \
              scope: $scope) { \
                id \
              } \
            }',
          variables: {
            accessToken: codeExchange.access_token,
            refreshToken: codeExchange.refresh_token,
            expiresIn: codeExchange.expires_in,
            scope: codeExchange.scope,
          },
        },
        headers: { 'Content-Type': 'application/json' },
      })

      context.$auth.$storage.setCookie('sid', sessionCreate.data.setSession.id)
      context.redirect('/')
    } else {
      context.$auth.$storage.setCookie(
        'sid',
        sessionCheck.data.sessionExists.id
      )
      context.redirect('/')
    }
  },
})
</script>
