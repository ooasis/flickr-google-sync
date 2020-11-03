<template>
  <v-card
    v-if="readyToSync()"
    class="d-flex flex-column mb-12"
    color="grey lighten-1"
    :min-height="height"
  >
    <v-card-title>{{ title }}</v-card-title>
    <v-card-actions class="d-flex justify-start px-6">
      {{ header() }}
      <v-btn class="mx-6" @click="syncPhoto"> Sync </v-btn>
    </v-card-actions>

    <v-container fluid>
      <v-row class="d-flex px-6">
        <v-col cols="12">
          <v-progress-linear
            v-model="syncProgress"
            :height="20"
            color="teal"
            striped
          >
            {{ syncProgress }}
          </v-progress-linear>
        </v-col>
      </v-row>
      <v-row class="d-flex">
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
    <v-spacer class="flex-grow-1"></v-spacer>
    <v-card-actions>
      <v-btn @click="$emit('input', 3)"> Previous </v-btn>
    </v-card-actions>
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
      syncQueue: [],
      syncCount: 0,
      syncProgress: 0,
      photos: [],
      worker: null,
    }
  },
  mounted() {
    this.worker = this.$worker.createWorker()
    this.worker.onmessage = async (event) => {
      try {
        const {
          data: { photoId, newPhotoUrl },
        } = event
        console.debug(`Sync'ed photo: ${photoId} to ${newPhotoUrl} `)
        await this.sleep(5000)
        this.syncCount += 1
        this.syncProgress = Math.floor(
          (this.syncCount * 100) / this.$store.state.flickrPhoto.selected.photos
        )
        this.photos
          .filter((p) => p.id === photoId)
          .forEach((p) => Vue.set(p, 'loaded', p.turl))
      } catch (err) {
        console.error(`Failed to sync one photo: ${err}`)
      } finally {
        this.processSyncQueue()
      }
    }
  },
  methods: {
    readyToSync() {
      return this.$store.state.flickrPhoto.selected
    },
    header() {
      const source = this.$store.state.flickrPhoto.selected
      const target = this.$store.state.googlePhoto.selected
      const targetAlbum = target
        ? typeof target === 'object'
          ? `${target.title}`
          : `${target}`
        : 'Google Photo'
      return `${source.title}(${source.photos}) -> ${targetAlbum}`
    },
    async syncPhoto() {
      this.inProgress = true
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
      this.syncQueue = this.photos.map((photo) => {
        return {
          albumId,
          photoId: photo.id,
          photoUrl: photo.url,
          photoDesc: photo.title,
          googleAccessToken,
        }
      })
      this.processSyncQueue()
    },
    processSyncQueue() {
      if (this.syncQueue.length > 0) {
        this.worker.postMessage(this.syncQueue.shift())
      } else {
        this.inProgress = false
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
