import { Middleware } from '@nuxt/types'

const userMiddleware: Middleware = async ({
  $auth,
  $axios,
  $vuetify,
  env,
  redirect,
  store,
}) => {
  if ($auth.loggedIn) {
    const {
      data: {
        data: { getSession },
      },
    } = await $axios({
      method: 'post',
      url: `${env.WEBSITE_URL}/graphql`,
      data: {
        query:
          'query Session($id: ID!) { \
            getSession(id: $id) { \
              id \
              accessToken \
            } \
          }',
        variables: {
          id: $auth.$state.sid,
        },
      },
      headers: { 'Content-Type': 'application/json' },
    })

    if (!getSession) {
      if ($auth.$storage.getCookie('sid')) {
        $auth.$storage.removeCookie('sid')
      }

      return redirect(env.WEBSITE_URL)
    }

    const user = await $axios.$post(`${env.WEBSITE_URL}/api/discord/user`, {
      token: getSession.accessToken,
    })

    $auth.setUser(user)

    const {
      data: {
        data: { getSettings },
      },
    } = await $axios({
      method: 'post',
      url: `${env.WEBSITE_URL}/graphql`,
      data: {
        query:
          'query Settings($userID: String!) { \
            getSettings(userID: $userID) { \
              theme \
            } \
          }',
        variables: { userID: $auth.user.id },
      },
      headers: { 'Content-Type': 'application/json' },
    })

    if (getSettings) {
      store.commit('setTheme', getSettings.theme)
      $vuetify.theme.dark = getSettings.theme === 'Dark' ? true : false
    }
  }
}

export default userMiddleware
