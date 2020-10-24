<template>
  <v-card class="mb-12" color="grey lighten-1" :min-height="height">
    <v-card-actions>
      <v-btn text color="deep-purple accent-4" @click="moveStep(-1)">
        Previous
      </v-btn>
      <v-btn
        text
        color="deep-purple accent-4"
        :disabled="!albumSelected()"
        @click="moveStep(1)"
      >
        Next
      </v-btn>
    </v-card-actions>
    <v-card-title>{{ title }}</v-card-title>

    <v-card>
      <v-card-title>
        <v-btn text color="deep-purple accent-4" @click="fetchAlbums">
          Load Flickr Albums
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="$store.state.flickrPhoto.albums"
        :items-per-page="10"
        :search="search"
        item-key="id"
        show-select
        :single-select="singleSelect"
        class="elevation-1"
        @item-selected="chooseAlbum"
      >
        <template v-slot:[`item.id`]="{ item }">
          <div class="d-flex flex-row">
            <v-img
              v-for="thumbnail in item.thumbnails"
              :key="thumbnail.index"
              max-height="80"
              max-width="80"
              class="ma-2"
              :src="thumbnail.url"
            ></v-img>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-card>
</template>

<script>
// const sleep = (ms) => {
//   return new Promise((resolve) => setTimeout(resolve, ms))
// }
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
      singleSelect: true,
      headers: [
        {
          text: 'Album',
          align: 'start',
          sortable: true,
          value: 'title',
        },
        { text: '', align: 'start', sortable: false, value: 'id' },
      ],
      search: null,
      loadThumbnails: false,
    }
  },
  methods: {
    moveStep(delta) {
      this.loadThumbnails = false
      this.$emit('input', this.value + delta)
    },
    albumSelected() {
      return !!this.$store.state.flickrPhoto.selected
    },
    chooseAlbum(e) {
      this.$store.commit('setFlickrAlbum', e.value ? e.item : null)
    },
    async fetchAlbums() {
      this.loadThumbnails = false
      const { accessToken, accessTokenSecret } = this.$store.state.flickr
      const {
        data: { photoSets },
      } = await this.$axios.get(`/api/flickr/photosets`, {
        params: { accessToken, accessTokenSecret },
      })
      console.debug(`Fetched flickr photo sets: %o`, photoSets)
      const albums = photoSets.filter((r) => r.photos > 0)
      albums.forEach((r) => {
        r.thumbnails = Array.from({ length: Math.min(r.photos, 5) }).map(
          (r, index) => {
            return {
              index,
              name: '',
              url: null,
            }
          }
        )
      })
      this.$store.commit('setFlickrAlbums', albums)

      this.loadThumbnails = true
      await this.populateThumbnails(albums)
      this.loadThumbnails = false
    },
    async populateThumbnails(albums) {
      for (const album of albums) {
        if (!this.loadThumbnails) {
          break
        }
        const photos = await this.flickrFetchPhotos(album)
        const enrichedThumbnails = album.thumbnails.map((thumbnail, idx) => {
          console.log(
            `load thumbnail ${thumbnail.index} in album ${album.title}`
          )
          return {
            index: thumbnail.index,
            name: photos[idx].title,
            url: photos[idx].url,
          }
        })
        this.$store.commit('setFlickrThumbnails', {
          id: album.id,
          thumbnails: enrichedThumbnails,
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
  },
}
</script>
