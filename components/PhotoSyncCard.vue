<template>
  <v-card
    v-if="readyToSync()"
    class="mb-12"
    color="grey lighten-1"
    :min-height="height"
  >
    <v-card-actions>
      <v-btn text color="deep-purple accent-4" @click="$emit('input', 3)">
        Previous
      </v-btn>
    </v-card-actions>
    <v-card-title>{{ title }}</v-card-title>

    <v-container fluid>
      <v-row class="d-flex justify-center">
        <v-col cols="4">
          <v-card class="mx-auto" outlined>
            <v-card-title>{{
              $store.state.flickrPhoto.selected.title
            }}</v-card-title>
            <v-img
              :src="$store.state.flickrPhoto.selected.thumbnails[0].url"
              height="200px"
            ></v-img>
          </v-card>
        </v-col>
        <v-col cols="4" class="d-flex flex-column align-center py-5">
          <v-btn color="deep-purple accent-4" @click="syncPhoto">
            Start Sync!
          </v-btn>
          <v-progress-circular
            v-if="inProgress"
            :rotate="360"
            :value="35"
            :size="100"
            :width="15"
            color="teal"
            class="flex-grow-1"
          >
            {{ $store.state.flickrPhoto.selected.photos }}
          </v-progress-circular>
        </v-col>
        <v-col cols="4">
          <v-card v-if="isGoogleAlbumSelected()" class="mx-auto" outlined>
            <v-card-title>{{
              $store.state.googlePhoto.selected.title
            }}</v-card-title>
            <v-img
              :src="$store.state.googlePhoto.selected.thumbnails[0].url"
              height="200px"
            ></v-img>
          </v-card>
          <v-card
            v-else-if="isGoogleNewAlbumSelected()"
            class="mx-auto"
            outlined
          >
            <v-card-title
              >New album: {{ $store.state.googlePhoto.selected }}</v-card-title
            >
          </v-card>
          <v-card v-else class="mx-auto" outlined>
            <v-card-title>Sync to Google Photo Library</v-card-title>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="inProgress" class="d-flex">
        <v-col
          v-for="p in photos"
          :key="p.id"
          class="d-flex child-flex px-1"
          cols="1"
        >
          <v-img :src="p.loaded" aspect-ratio="1" class="grey lighten-2">
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular
                  indeterminate
                  color="grey lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
          </v-img>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<script>
import Vue from 'vue'

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
      default: '800px',
    },
  },
  data() {
    return {
      inProgress: false,
      photos: [],
    }
  },
  methods: {
    readyToSync() {
      return this.$store.state.flickrPhoto.selected
    },
    isGoogleAlbumSelected() {
      const selectAlbum = this.$store.state.googlePhoto.selected
      return selectAlbum && typeof selectAlbum === 'object'
    },
    isGoogleNewAlbumSelected() {
      const selectAlbum = this.$store.state.googlePhoto.selected
      return selectAlbum && typeof selectAlbum === 'string'
    },
    async syncPhoto() {
      this.inProgress = true
      const worker = this.$worker.createWorker()
      worker.onmessage = async (event) => {
        const {
          data: { photoId, newPhotoUrl },
        } = event
        console.debug(`Sync'ed photo: ${photoId} to ${newPhotoUrl} `)
        await this.sleep(1000)
        this.photos
          .filter((p) => {
            if (p.id === photoId) {
              console.log(`Uploaded photo ${photoId}`)
              return true
            } else {
              return false
            }
          })
          .forEach((p) => Vue.set(p, 'loaded', p.turl))
      }

      const googleAccessToken = this.$auth.getToken('google')
      let albumId
      const selectAlbum = this.$store.state.googlePhoto.selected
      if (selectAlbum) {
        if (typeof selectAlbum === 'string') {
          albumId = await this.createAlbum(selectAlbum)
        } else if (typeof selectAlbum === 'object') {
          albumId = selectAlbum.id
        }
      }
      const album = this.$store.state.flickrPhoto.selected
      this.photos = await this.flickrFetchPhotos(album)
      for (const photo of this.photos) {
        worker.postMessage({
          albumId,
          photoId: photo.id,
          photoUrl: photo.url,
          photoDesc: photo.title,
          googleAccessToken,
        })
      }
    },
    async flickrFetchPhotos(album) {
      const { accessToken, accessTokenSecret } = this.$store.state.flickr
      const photsets = album.id
      const flickrUser = this.$store.state.flickr.userId
      const { data: photosets } = await this.$axios.get(`/api/flickr/photos`, {
        params: { accessToken, accessTokenSecret, photsets, flickrUser },
      })
      console.debug(`Fetched photo sets: %o`, photosets)
      return photosets[0].photos
    },
    async createAlbum(albumName) {
      const googleUrl = 'https://photoslibrary.googleapis.com/v1/albums'
      const googleAccessToken = this.$auth.getToken('google')
      const req = {
        album: {
          title: albumName,
        },
      }
      const resp = await fetch(googleUrl, {
        method: 'POST',
        body: JSON.stringify(req),
        headers: {
          Authorization: googleAccessToken,
          'Content-Type': 'application/json',
        },
      })
      if (!resp.ok) {
        const err = await resp.text()
        throw new Error(`Failed to create album: ${err}`)
      }

      const result = await resp.json()
      const { id: albumId, isWriteable: isWrittable } = result
      return isWrittable ? albumId : null
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
  },
}
</script>
