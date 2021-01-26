<template>
  <nav>
    <v-app-bar v-if="$vuetify.breakpoint.mobile" app fixed>
      <v-app-bar-nav-icon @click="navDrawer = !navDrawer" />
      <v-spacer />
      <h1 class="orange--text text--darken-2">Concordis</h1>
    </v-app-bar>
    <v-navigation-drawer v-model="navDrawer" absolute temporary>
      <div v-if="$auth.loggedIn" class="d-flex justify-center my-3">
        <v-avatar tile size="100">
          <img :src="getAvatar()" />
        </v-avatar>
      </div>
      <div v-if="$auth.loggedIn" class="d-flex justify-center mb-3">
        <v-btn small color="red darken-2" nuxt to="/logout">
          <v-icon left v-text="icons.logout" />
          Logout
        </v-btn>
      </div>
      <div v-if="!$auth.loggedIn" class="d-flex justify-center my-3">
        <v-btn large color="#7289DA" nuxt to="/login">
          <v-icon left v-text="icons.discord" />
          Login
        </v-btn>
      </div>
      <v-divider />
      <v-list nav dense flat>
        <v-list-item color="orange darken-2" nuxt to="/">
          <v-list-item-icon>
            <v-icon v-text="icons.home" />
          </v-list-item-icon>
          <v-list-item-title> Home </v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item
          v-if="$auth.loggedIn"
          class="mt-1"
          color="orange darken-2"
          nuxt
          to="/meet"
        >
          <v-list-item-icon>
            <v-icon v-text="icons.handshake" />
          </v-list-item-icon>
          <v-list-item-title> Meet </v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item class="mt-1" color="orange darken-2" nuxt to="/demo">
          <v-list-item-icon>
            <v-icon v-text="icons.testTube" />
          </v-list-item-icon>
          <v-list-item-title> Demo </v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item
          v-if="$auth.loggedIn"
          class="mt-1"
          color="orange darken-2"
          nuxt
          to="/friends"
        >
          <v-list-item-icon>
            <v-icon v-text="icons.accountGroup" />
          </v-list-item-icon>
          <v-list-item-title> Friends </v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item class="mt-1" @click="toggleTheme()">
          <v-list-item-icon>
            <v-icon
              v-text="
                currentTheme === 'Dark' ? icons.lightMode : icons.darkMode
              "
            />
          </v-list-item-icon>
          <v-list-item-title
            v-text="currentTheme === 'Dark' ? 'Light Mode' : 'Dark Mode'"
          />
        </v-list-item>
        <v-divider />
      </v-list>
    </v-navigation-drawer>
    <v-app-bar v-if="!$vuetify.breakpoint.mobile" app fixed short>
      <h1 class="orange--text text--darken-2">Concordis</h1>
      <v-divider class="mx-3" inset vertical />
      <v-btn class="mr-2" depressed nuxt to="/">
        <v-icon left v-text="icons.home" />
        Home
      </v-btn>
      <v-btn v-if="$auth.loggedIn" class="mr-2" depressed nuxt to="/meet">
        <v-icon left v-text="icons.handshake" />
        Meet
      </v-btn>
      <v-btn depressed nuxt to="/demo">
        <v-icon left v-text="icons.testTube" />
        Demo
      </v-btn>
      <v-spacer />
      <v-divider class="mx-3" inset vertical />
      <div v-if="!$auth.loggedIn">
        <v-btn color="#7289DA" nuxt to="/login">
          <v-icon left v-text="icons.discord" />
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
              <v-icon
                left
                v-text="
                  currentTheme === 'Dark' ? icons.lightMode : icons.darkMode
                "
              />
              <v-list-item-title
                v-text="currentTheme === 'Dark' ? 'Light Mode' : 'Dark Mode'"
              />
            </v-list-item>
            <v-list-item
              v-for="item in account"
              :key="item.title"
              link
              nuxt
              :to="item.route"
            >
              <v-icon left v-text="item.icon" />
              <v-list-item-title v-text="item.title" />
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
      navDrawer: false,
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
  watch: {
    navDrawerList() {
      this.navDrawer = false
    },
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
