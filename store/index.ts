import { GetterTree, ActionTree, MutationTree } from 'vuex'

export const state = () => ({
  interests: [],
  autoJoin: false,
})

export type RootState = ReturnType<typeof state>

export const getters: GetterTree<RootState, RootState> = {}

export const mutations: MutationTree<RootState> = {
  setSID(state, sid) {
    state.auth.sid = sid
  },
  setLoggedIn(state, loggedIn) {
    state.auth.loggedIn = loggedIn
  },
  setTheme(state, theme) {
    state.auth.theme = theme
  },
  setInterests(state, interests) {
    state.interests = interests
  },
  setAutoJoin(state, autoJoin) {
    state.autoJoin = autoJoin
  },
}

export const actions: ActionTree<RootState, RootState> = {
  async nuxtServerInit({ commit }, { req, redirect }) {
    const cookies = this.$auth.$storage.getCookies()

    if (cookies['auth.sid']) {
      commit('setSID', cookies['auth.sid'])
      commit('setLoggedIn', true)
    }

    if (this.$auth.loggedIn) {
      const { data: getSession } = await this.$axios({
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
            id: this.$auth.$state.sid,
          },
        },
        headers: { 'Content-Type': 'application/json' },
      })

      if (!getSession.data.getSession) {
        if (this.$auth.$storage.getCookie('sid')) {
          this.$auth.$storage.removeCookie('sid')
        }

        return redirect(process.env.WEBSITE_URL)
      }

      try {
        const user = await this.$axios({
          method: 'get',
          url: `${process.env.DISCORD_API_BASE}/users/@me`,
          headers: {
            Authorization: `Bearer ${getSession.data.getSession.accessToken}`,
          },
        })

        this.$auth.setUser(user.data)
      } catch (e) {
        if (this.$auth.$storage.getCookie('sid')) {
          this.$auth.$storage.removeCookie('sid')
        }

        return redirect(`${process.env.WEBSITE_URL}/login`)
      }

      const { data: settings } = await this.$axios({
        method: 'post',
        url: `${process.env.WEBSITE_URL}/graphql`,
        data: {
          query:
            'query Settings($userID: String!) { \
              getSettings(userID: $userID) { \
                theme \
              } \
            }',
          variables: { userID: this.$auth.user.id },
        },
        headers: { 'Content-Type': 'application/json' },
      })

      if (settings.data.getSettings) {
        commit('setTheme', settings.data.getSettings.theme)
      }
    }
  },
}
