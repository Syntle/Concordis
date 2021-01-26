import colors from 'vuetify/es5/util/colors'

const title = 'Concordis'
const description =
  'Concordis is a service that allows you to meet & chat with other gamers!'

export default {
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    titleTemplate: 'Concordis',
    title: title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: description,
      },
      { hid: 'og:type', property: 'og:type', content: 'website' },
      {
        hid: 'og:url',
        property: 'og:url',
        content: process.env.WEBSITE_URL,
      },
      {
        hid: 'og:title',
        name: 'og:title',
        content: title,
      },
      {
        hid: 'og:description',
        name: 'og:description',
        content: description,
      },
      {
        hid: 'twitter:title',
        name: 'twitter:title',
        content: title,
      },
      {
        hid: 'twitter:description',
        name: 'twitter:description',
        content: description,
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: ['~/assets/transitions.css'],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
  ],
  env: {
    CLIENT_ID: process.env.CLIENT_ID,
    DISCORD_API_BASE: process.env.DISCORD_API_BASE,
    DISCORD_CDN_BASE: process.env.DISCORD_CDN_BASE,
    WEBSITE_URL: process.env.WEBSITE_URL,
  },

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    'nuxt-socket-io',
  ],
  io: {
    sockets: [
      {
        name: 'main',
        url: process.env.WEBSITE_URL,
      },
    ],
  },
  auth: {
    strategies: {
      discord: {
        _scheme: 'oauth2',
        authorization_endpoint: 'https://discord.com/api/oauth2/authorize',
        userinfo_endpoint: false,
        scope: ['identify'],
        response_type: 'code',
        redirect_uri: `${process.env.WEBSITE_URL}/token`,
        client_id: process.env.CLIENT_ID,
      },
    },
  },

  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {},

  // Vuetify module configuration (https://go.nuxtjs.dev/config-vuetify)
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
      },
      icons: {
        iconfont: 'mdiSvg',
      },
    },
    treeShake: {
      components: [
        'VCard',
        'VIcon',
        'VBtn',
        'VMenu',
        'VAvatar',
        'VList',
        'VDialog',
        'VSpacer',
        'VDivider',
        'VTooltip',
        'VTextField',
        'VCombobox',
        'VApp',
        'VAppBar',
        'VMain',
        'VSwitch',
        'VForm',
        'VDataTable',
        'VNavigationDrawer',
      ],
    },
  },

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {},
  server: {
    port: process.env.WEBSITE_PORT,
    host: '0.0.0.0',
  },

  router: {
    middleware: ['user'],
  },
  serverMiddleware: ['~/api/discord', '~/api/io', '~/graphql/main'],
  privateRuntimeConfig: {
    CLIENT_SECRET: process.env.CLIENT_SECRET,
  },
}
