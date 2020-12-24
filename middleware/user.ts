import { Middleware } from '@nuxt/types'

const userMiddleware: Middleware = async (context) => {
  if (context.$auth.loggedIn) {
    const { data: getSession } = await context.$axios({
      method: 'post',
      url: `${process.env.WEBSITE_URL}/graphql`,
      data: {
        query:
          'query Session($id: ID!) { \
            getSession(id: $id) { \
              id \
              accessToken \
            } \
          }',
        variables: {
          id: context.$auth.$state.sid,
        },
      },
      headers: { 'Content-Type': 'application/json' },
    })

    if (!getSession.data.getSession) {
      if (context.$auth.$storage.getCookie('sid')) {
        context.$auth.$storage.removeCookie('sid')
      }

      return context.redirect(context.env.WEBSITE_URL)
    }

    const user = await context.$axios.$post(
      `${context.env.WEBSITE_URL}/api/discord/user`,
      {
        token: getSession.data.getSession.accessToken,
      }
    )

    context.$auth.setUser(user)

    const { data: settings } = await context.$axios({
      method: 'post',
      url: `${process.env.WEBSITE_URL}/graphql`,
      data: {
        query:
          'query Settings($userID: String!) { \
            getSettings(userID: $userID) { \
              theme \
            } \
          }',
        variables: { userID: context.$auth.user.id },
      },
      headers: { 'Content-Type': 'application/json' },
    })

    if (settings.data.getSettings) {
      context.store.commit('setTheme', settings.data.getSettings.theme)
      context.$vuetify.theme.dark =
        settings.data.getSettings.theme === 'Dark' ? true : false
    }
  }
}

export default userMiddleware
