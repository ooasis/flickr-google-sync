<template>
  <v-card
    class="d-flex flex-column mb-12"
    color="grey lighten-1"
    :min-height="height"
  >
    <v-card-title>{{ title }}</v-card-title>
    <v-list-item class="flex-grow-0 py-4">
      <v-list-item-icon>
        <v-icon>mdi-image-album</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>{{ flickrUserName() }}</v-list-item-title>
        <v-list-item-subtitle>{{
          flickrSignedIn() ? 'is your flickr account name' : ''
        }}</v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <v-btn text color="deep-purple accent-4" @click="flickrAction">
          {{ flickrSignedIn() ? 'Log Out' : 'Sign In' }}
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-list-item class="flex-grow-0 py-4">
      <v-list-item-icon>
        <v-icon>mdi-google</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>{{ googleUserName() }}</v-list-item-title>
        <v-list-item-subtitle>{{
          googleSignedIn() ? 'is your google account name' : ''
        }}</v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <v-btn text color="deep-purple accent-4" @click="googleAction">
          {{ googleSignedIn() ? 'Log Out' : 'Sign In' }}
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-spacer class="flex-grow-1"></v-spacer>
    <v-card-actions class="pa-4">
      <v-btn
        color="accent-4"
        :disabled="!flickrSignedIn() || !googleSignedIn()"
        @click="$emit('input', 2)"
      >
        Next
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
export default {
  props: {
    value: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    height: {
      type: String,
      default: '480px',
    },
  },
  async beforeMount() {
    if (this.$auth.loggedIn) {
      try {
        await this.$auth.fetchUser()
        console.info('auth verified')
      } catch (err) {
        console.info('auth expired')
        await this.$auth.logout()
      }
    }
  },
  methods: {
    flickrSignedIn() {
      return !!this.$store.state.flickr.accessToken
    },
    flickrUserName() {
      if (this.flickrSignedIn()) {
        return this.$store.state.flickr.userName
      } else {
        return 'You are not signed in yet'
      }
    },
    async flickrAction() {
      if (this.flickrSignedIn()) {
        this.flickrLogout()
      } else {
        await this.flickrRequestAuth()
      }
    },
    flickrLogout() {
      this.$store.commit('resetFlickrData')
    },
    async flickrRequestAuth() {
      const {
        data: { authRequestUrl, requestToken, requestTokenSecret },
      } = await this.$axios.get(`/api/flickr/request`)
      this.$store.commit('updateFlickrRequestToken', {
        requestToken,
        requestTokenSecret,
      })
      window.location = authRequestUrl
    },
    // google
    googleSignedIn() {
      return this.$auth.loggedIn
    },
    googleUserName() {
      if (this.googleSignedIn()) {
        return this.$auth.user.name
      } else {
        return 'You are not signed in yet'
      }
    },
    async googleAction() {
      if (this.googleSignedIn()) {
        this.googleLogout()
      } else {
        await this.gapiRequestAuth()
      }
    },
    async googleLogout() {
      await this.$auth.logout()
      this.$store.commit('resetGoogleData')
    },
    async gapiRequestAuth() {
      await this.$auth.loginWith('google')
    },
  },
}
</script>
