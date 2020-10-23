<template>
  <v-card class="mb-12" color="grey lighten-1" :height="height">
    <v-card-actions>
      <v-btn text color="deep-purple accent-4" @click="$emit('input', 3)">
        Previous
      </v-btn>
    </v-card-actions>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <div class="text--primary">Sync from ... to ...</div>
    </v-card-text>
    <v-card-actions>
      <v-btn text color="deep-purple accent-4" @click="syncPhoto">
        Start Sync!
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
      default: '800px',
    },
  },
  methods: {
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
  },
}
</script>
