<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-stepper v-model="curStep">
          <v-stepper-header>
            <v-stepper-step :complete="curStep > 1" step="1"
              >Choose Source</v-stepper-step
            >

            <v-divider></v-divider>

            <v-stepper-step :complete="curStep > 2" step="2"
              >Choose Destination</v-stepper-step
            >

            <v-divider></v-divider>

            <v-stepper-step :complete="curStep > 3" step="3"
              >Start Sync.</v-stepper-step
            >
          </v-stepper-header>

          <v-stepper-items>
            <v-stepper-content step="1">
              <v-card class="mb-12" color="grey lighten-1" height="200px">
                <v-card-text>
                  <p class="display-1 text--primary">Sign In Flickr</p>
                  <div class="text--primary">
                    Sign in your Flickr account.<br />
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    text
                    color="deep-purple accent-4"
                    @click="flickrRequestAuth"
                  >
                    Login Flickr
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <v-stepper-content step="2">
              <v-card class="mb-12" color="grey lighten-1" height="200px">
                <v-card-text>
                  <p class="display-1 text--primary">Sign In Google Photo</p>
                  <div class="text--primary">
                    Sign in your Google Photo account.
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    text
                    color="deep-purple accent-4"
                    @click="gapiRequestAuth"
                  >
                    Login Google Photo
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <v-stepper-content step="3">
              <v-card class="mb-12" color="grey lighten-1" height="200px">
                <v-card-text>
                  <p class="display-1 text--primary">Choose Album to Sync</p>
                  <div class="text--primary">
                    Select an album from your Flickr account.
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-btn text color="deep-purple accent-4" @click="syncPhoto">
                    Start Sync!
                  </v-btn>
                  <v-btn
                    text
                    color="deep-purple accent-4"
                    @click="googleLogout"
                  >
                    Logout Google
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      curStep: 1,
    }
  },
  mounted() {
    if (this.$store.state.flickr.accessToken) {
      this.curStep = 2
    }
    if (this.$auth.loggedIn) {
      this.curStep = 3
    }
  },
  methods: {
    async googleLogout() {
      await this.$auth.logout()
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
    async gapiRequestAuth() {
      await this.$auth.loginWith('google')
    },
    async flickrFetchPhotoSets() {
      const { accessToken, accessTokenSecret } = this.$store.state.flickr
      const {
        data: { photoSets },
      } = await this.$axios.get(`/api/flickr/photosets`, {
        params: { accessToken, accessTokenSecret },
      })
      console.debug(`Fetched photo sets: %o`, photoSets)
    },
    async flickrFetchPhotos() {
      const { accessToken, accessTokenSecret } = this.$store.state.flickr
      const photsets = ['72157632377473843', '72157632368106353'].join(':')
      const flickrUser = this.$store.state.flickr.userId
      const { data: photoSets } = await this.$axios.get(`/api/flickr/photos`, {
        params: { accessToken, accessTokenSecret, photsets, flickrUser },
      })
      console.debug(`Fetched photos: %o`, photoSets)
    },
    syncPhoto() {
      const photoId = '8323753743'
      const photoUrl =
        'https://live.staticflickr.com/8075/8323753743_e5a1079c4d_o.jpg'
      const googleAccessToken = this.$auth.getToken('google')

      const worker = this.$worker.createWorker()
      worker.onmessage = (event) => {
        console.debug(
          `Sync'ed photo: ${photoId} from ${photoUrl}. Result: ${event.data}`
        )
      }
      worker.postMessage({ photoId, photoUrl, googleAccessToken })
    },
    async syncPhoto2() {
      const googleUploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads'
      const photoId = '8323753743'
      const photoUrl =
        'https://live.staticflickr.com/8075/8323753743_e5a1079c4d_o.jpg'
      const googleAccessToken = this.$auth.getToken('google')

      console.debug(`Sync'ing photo: ${photoId} from ${photoUrl}`)
      const downloadResp = await fetch(photoUrl)
      if (!downloadResp.ok) {
        const downloadErr = await downloadResp.text()
        console.error(`Failed to download photo: %o`, downloadErr)
        return false
      }

      const image = await downloadResp.blob()
      console.debug(`Raw photo: ${image.size} ${image.type}`)

      // await this.$auth.refreshTokens()

      const uploadResp = await fetch(googleUploadUrl, {
        method: 'POST',
        body: image,
        headers: {
          Authorization: googleAccessToken,
          'Content-Type': 'application/octet-stream',
          'X-Goog-Upload-Content-Type': 'image/jpeg',
          'X-Goog-Upload-Protocol': 'raw',
        },
      })
      if (!uploadResp.ok) {
        const uploadErr = await uploadResp.text()
        console.error(`Failed to upload photo: %o`, uploadErr)
        return false
      }

      const uploadToken = await uploadResp.text()
      console.debug(`Uploaded photo aand get token back: ${uploadToken}`)
    },
  },
}
</script>
