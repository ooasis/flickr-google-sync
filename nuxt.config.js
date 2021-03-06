import path from 'path'
import fs from 'fs'
import colors from 'vuetify/es5/util/colors'

export default {
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: 'server',
  /*
   ** Headers of the page
   ** See https://nuxtjs.org/api/configuration-head
   */
  head: {
    titleTemplate: '%s - ' + process.env.ENV,
    title: 'Flickr Sync.',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || '',
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },
  /*
   ** Global CSS
   */
  css: ['@/assets/css/app.css'],
  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: [
    { src: '~/plugins/inject-ww', ssr: false },
    { src: '@/plugins/vuex-persist', ssr: false },
  ],
  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: true,
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    // Doc: https://github.com/nuxt-community/stylelint-module
    '@nuxtjs/stylelint-module',
    '@nuxtjs/vuetify',
  ],
  serverMiddleware: [
    // Will register file from project api directory to handle /api/* requires
    { path: '/api/flickr/request', handler: '~/api/flickr/request.js' },
    { path: '/api/flickr/verify', handler: '~/api/flickr/verify.js' },
    { path: '/api/flickr/photosets', handler: '~/api/flickr/photosets.js' },
    { path: '/api/flickr/photos', handler: '~/api/flickr/photos.js' },
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
    '@nuxtjs/auth',
  ],
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    baseURL: process.env.API_URL,
  },
  auth: {
    resetOnError: true,
    redirect: {
      callback: `/auth/google/verify`,
    },
    strategies: {
      google: {
        scope: ['https://www.googleapis.com/auth/photoslibrary', 'profile'],
        client_id:
          '609737535508-8i8ucl7kd5qn0jmtv524t7mvbe13trrl.apps.googleusercontent.com',
      },
    },
  },
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
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
    },
  },
  server: {
    port: 3011, // default: 3000
    host: 'localhost', // default: localhost
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'config', 'https.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'config', 'https.crt')),
    },
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {
    extend(config, ctx) {
      if (ctx.isDev) {
        config.devtool = ctx.isClient ? 'source-map' : 'inline-source-map'
      }

      if (ctx.isClient) {
        // web workers are only available client-side
        config.module.rules.push({
          test: /\.worker\.js$/, // this will pick up all .js files that ends with ".worker.js"
          loader: 'worker-loader',
          exclude: /(node_modules)/,
        })
      }

      // @see https://github.com/nuxt/nuxt.js/pull/3480#issuecomment-404150387
      config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`
    },
  },
}
