<template>
  <nav>
    <v-app-bar app fixed short>
      <h1 class="orange--text text--darken-2">Concordis</h1>
      <v-divider class="mx-3" inset vertical />
      <v-btn class="mr-2" depressed nuxt to="/">Home</v-btn>
      <v-btn class="mr-2" v-if="$auth.loggedIn" depressed nuxt to="/meet">
        Meet
      </v-btn>
      <v-btn depressed nuxt to="/demo">Demo</v-btn>
      <v-spacer />
      <v-divider class="mx-3" inset vertical />
      <div v-if="!$auth.loggedIn">
        <v-btn color="#7289DA" nuxt to="/login">
          <v-icon left>mdi-discord</v-icon>
          Login
        </v-btn>
      </div>
      <div v-else>
        <v-menu offset-y bottom>
          <template #activator="{ on }">
            <v-btn rounded icon v-on="on">
              <v-avatar size="35">
                <img :src="getAvatar()" />
              </v-avatar>
            </v-btn>
          </template>

          <v-list>
            <v-list-item @click="toggleTheme()">
              <v-icon left>{{
                currentTheme === 'Dark'
                  ? 'mdi-white-balance-sunny'
                  : 'mdi-moon-waning-crescent'
              }}</v-icon>
              <v-list-item-title>{{
                currentTheme === 'Dark' ? 'Light Mode' : 'Dark Mode'
              }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-for="item in account"
              :key="item.title"
              link
              nuxt
              :to="item.route"
            >
              <v-icon left>{{ item.icon }}</v-icon>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue'
import {
  mdiAccountGroup,
  mdiDiscord,
  mdiHandshake,
  mdiHome,
  mdiLogoutVariant,
  mdiMoonWaningCrescent,
  mdiTestTube,
  mdiWhiteBalanceSunny,
} from '@mdi/js'

export default Vue.extend({
  data() {
    return {
      DISCORD_CDN_BASE: process.env.DISCORD_CDN_BASE,
      account: [
        { title: 'Friends', icon: mdiAccountGroup, route: '/friends' },
        { title: 'Logout', icon: mdiLogoutVariant, route: '/logout' },
      ],
      currentTheme: 'Dark',
      icons: {
        home: mdiHome,
        logout: mdiLogoutVariant,
        discord: mdiDiscord,
        lightMode: mdiWhiteBalanceSunny,
        darkMode: mdiMoonWaningCrescent,
        testTube: mdiTestTube,
        handshake: mdiHandshake,
        accountGroup: mdiAccountGroup,
      },
    }
  },
  async mounted() {
    if (this.$auth.loggedIn) {
      const {
        data: {
          data: { getSettings },
        },
      } = await this.$axios({
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

      if (getSettings) {
        this.currentTheme = getSettings.theme
      } else {
        const {
          data: {
            data: { setSettings },
          },
        } = await this.$axios({
          method: 'post',
          url: `${process.env.WEBSITE_URL}/graphql`,
          data: {
            query:
              'mutation Settings($userID: String! $theme: String!) { \
              setSettings(userID: $userID theme: $theme) { \
                theme \
              } \
            }',
            variables: { userID: this.$auth.user.id, theme: this.currentTheme },
          },
          headers: { 'Content-Type': 'application/json' },
        })

        if (setSettings) {
          this.currentTheme = setSettings.theme
        }
      }

      this.$vuetify.theme.dark = this.currentTheme === 'Dark'
    }
  },
  methods: {
    getAvatar() {
      const user = this.$auth.user

      if (user.avatar) {
        return `${this.DISCORD_CDN_BASE}/avatars/${user.id}/${user.avatar}.${
          user.avatar.startsWith('a_') ? 'gif' : 'png'
        }`
      }

      return `/images/discord-avatar-${this.currentTheme.toLowerCase()}-placeholder.png`
    },
    async toggleTheme() {
      if (this.currentTheme === 'Dark') {
        this.currentTheme = 'Light'
      } else {
        this.currentTheme = 'Dark'
      }

      this.$vuetify.theme.dark = this.currentTheme === 'Dark'
      this.$store.commit('setTheme', this.currentTheme)

      const {
        data: {
          data: { setSettings },
        },
      } = await this.$axios({
        method: 'post',
        url: `${process.env.WEBSITE_URL}/graphql`,
        data: {
          query:
            'mutation Settings($userID: String! $theme: String!) { \
              setSettings(userID: $userID theme: $theme) { \
                theme \
              } \
            }',
          variables: { userID: this.$auth.user.id, theme: this.currentTheme },
        },
        headers: { 'Content-Type': 'application/json' },
      })

      return setSettings
    },
  },
})
</script>
