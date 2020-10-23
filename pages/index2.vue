<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <client-only placeholder="Loading...">
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
                <v-card
                  v-if="!flickrSignedIn()"
                  class="mb-12"
                  color="grey lighten-1"
                  height="200px"
                >
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
                <v-card
                  v-if="flickrSignedIn()"
                  class="mb-12"
                  color="grey lighten-1"
                >
                  <v-card-text>
                    <p class="display-1 text--primary">Choose a Flickr Album</p>
                    <div class="text--primary">
                      <AlbumList
                        :onSelectedAlbum="chooseFlickrAlbum"
                        :albums="flickrAlbums"
                      />
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      text
                      color="deep-purple accent-4"
                      :disabled="!flickrAlbumSelected()"
                      @click="nextStep"
                    >
                      Next
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-stepper-content>

              <v-stepper-content step="2">
                <v-card
                  v-if="!googleSignedIn()"
                  class="mb-12"
                  color="grey lighten-1"
                  height="200px"
                >
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
                <v-card
                  v-if="googleSignedIn()"
                  class="mb-12"
                  color="grey lighten-1"
                >
                  <v-card-text>
                    <p class="display-1 text--primary">Choose a Google Album</p>
                    <div class="text--primary">
                      <AlbumList
                        :onSelectedAlbum="chooseGoogleAlbum"
                        :albums="googleAlbums"
                      />
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      text
                      color="deep-purple accent-4"
                      @click="previousStep"
                    >
                      Previous
                    </v-btn>
                    <v-btn
                      text
                      color="deep-purple accent-4"
                      :disabled="!googleAlbumSelected()"
                      @click="nextStep"
                    >
                      Next
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-stepper-content>

              <v-stepper-content step="3">
                <v-card class="mb-12" color="grey lighten-1" height="200px">
                  <v-card-text>
                    <p class="display-1 text--primary">Start Sync.</p>
                    <div class="text--primary">
                      Sync from {{ flickrAlbum ? flickrAlbum.title : '' }} to
                      {{ googleAlbum ? googleAlbum.title : '' }}
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      text
                      color="deep-purple accent-4"
                      @click="previousStep"
                    >
                      Previous
                    </v-btn>
                    <v-btn text color="deep-purple accent-4" @click="syncPhoto">
                      Start Sync!
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </client-only>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AlbumList from '../components/FlickrSelectionCard'

export default {
  components: {
    AlbumList,
  },
  data() {
    return {
      curStep: 1,
      flickrAlbum: null,
      flickrAlbums: [],
      googleAlbum: null,
      googleAlbums: [],
    }
  },
  async beforeMount() {
    await this.configStep()
  },
  methods: {
    // util
    async previousStep() {
      if (this.curStep > 1) {
        this.curStep -= 1
      }
      await this.configStep()
    },
    async nextStep() {
      if (this.curStep < 3) {
        this.curStep += 1
      }
      await this.configStep()
    },
    async configStep() {
      if (this.curStep === 1) {
        if (this.flickrSignedIn() && this.flickrAlbums.length === 0) {
          this.flickrAlbums = await this.flickrFetchPhotoSets()
        }
      } else if (this.curStep === 2) {
        if (this.googleSignedIn() && this.googleAlbums.length === 0) {
          this.googleAlbums = await this.googleFetchAlbums()
        }
      }
    },

    // step 1 related
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
    flickrSignedIn() {
      return !!this.$store.state.flickr.accessToken
    },
    flickrAlbumSelected() {
      // return !!this.$store.state.flickr.album
      return !!this.flickrAlbum
    },
    chooseFlickrAlbum(e) {
      if (e.value) {
        this.flickrAlbum = e.item
      } else {
        this.flickrAlbum = null
      }
    },
    async flickrFetchPhotoSets() {
      const { accessToken, accessTokenSecret } = this.$store.state.flickr
      const {
        data: { photoSets },
      } = await this.$axios.get(`/api/flickr/photosets`, {
        params: { accessToken, accessTokenSecret },
      })
      console.debug(`Fetched photo sets: %o`, photoSets)
      return photoSets
    },

    // step 2 related
    async googleLogout() {
      await this.$auth.logout()
    },
    async gapiRequestAuth() {
      await this.$auth.loginWith('google')
    },
    googleSignedIn() {
      return !!this.$auth.user
    },
    googleAlbumSelected() {
      return !!this.googleAlbum
    },
    chooseGoogleAlbum(e) {
      if (e.value) {
        this.googleAlbum = e.item
      } else {
        this.googleAlbum = null
      }
    },
    async googleFetchAlbums() {
      const albumUrl = 'https://photoslibrary.googleapis.com/v1/albums'
      const googleAccessToken = this.$auth.getToken('google')
      let allAlbums = []
      let pageToken

      do {
        let url = albumUrl
        if (pageToken) {
          url = `${url}?pageToken=${pageToken}`
        }
        const resp = await fetch(url, {
          headers: {
            Authorization: googleAccessToken,
          },
        })

        if (!resp.ok) {
          const err = await resp.text()
          console.error(`Failed to fetch google photo albums: %o`, err)
          this.$auth.logout()
        } else {
          const { albums, nextPageToken } = await resp.json()
          if (albums) {
            const albumsThisBatch = albums.map((r) => {
              return {
                id: r.id,
                title: r.title,
                description: '',
                photos: r.mediaItemsCount,
              }
            })
            pageToken = nextPageToken
            allAlbums = [...allAlbums, ...albumsThisBatch]
          }
        }
      } while (pageToken)
      return allAlbums
    },

    // step 3 related
    async flickrFetchPhotos() {
      const { accessToken, accessTokenSecret } = this.$store.state.flickr
      const photsets = [this.flickrAlbum.id].join(':')
      const flickrUser = this.$store.state.flickr.userId
      const { data: photos } = await this.$axios.get(`/api/flickr/photos`, {
        params: { accessToken, accessTokenSecret, photsets, flickrUser },
      })
      console.debug(`Fetched photos: %o`, photos)
      return photos
    },
    async syncPhoto() {
      const photosets = await this.flickrFetchPhotos()
      for (const photoset of photosets) {
        for (const photo of photoset.photos) {
          const photoId = photo.id
          const photoUrl = photo.url
          // 'https://live.staticflickr.com/8075/8323753743_e5a1079c4d_o.jpg'
          const googleAccessToken = this.$auth.getToken('google')

          const worker = this.$worker.createWorker()
          worker.onmessage = (event) => {
            console.debug(
              `Sync'ed photo: ${photoId} from ${photoUrl}. Result: ${event.data}`
            )
          }
          worker.postMessage({ photoId, photoUrl, googleAccessToken })
        }
      }
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
