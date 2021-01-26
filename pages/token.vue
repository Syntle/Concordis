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
  async asyncData({ query, redirect, env, $config, $axios, $auth }) {
    if (!query.code) return redirect('/')

    const tokenRequest = {
      client_id: env.CLIENT_ID,
      client_secret: $config.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: query.code,
      redirect_uri: `${env.WEBSITE_URL}/token`,
      scope: 'identify',
    }

    const { data: codeExchange } = await $axios({
      method: 'post',
      url: 'https://discord.com/api/oauth2/token',
      data: formUrlEncode(tokenRequest),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const {
      data: {
        data: { sessionExists },
      },
    } = await $axios({
      method: 'post',
      url: `${env.WEBSITE_URL}/graphql`,
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

    if (!sessionExists) {
      const {
        data: {
          data: { setSession: sessionCreate },
        },
      } = await $axios({
        method: 'post',
        url: `${env.WEBSITE_URL}/graphql`,
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

      $auth.$storage.setCookie('sid', sessionCreate.id)
      redirect('/')
    } else {
      $auth.$storage.setCookie('sid', sessionExists.id)
      redirect('/')
    }
  },
})
</script>
