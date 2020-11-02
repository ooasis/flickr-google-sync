<template>
  <v-card
    class="d-flex flex-column mb-12"
    color="grey lighten-1"
    :min-height="height"
  >
    <v-card-title>{{ title }}</v-card-title>
    <v-row class="mx-4 flex-grow-0">
      <v-col cols="6">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          dense
          clearable
          @input="typeAlbumName"
        ></v-text-field>
      </v-col>
      <v-col cols="4">
        <v-btn @click="fetchAlbums"> Load Flickr Albums </v-btn>
      </v-col>
    </v-row>
    <v-data-table
      v-model="selectedAlbum"
      :headers="headers"
      :items="$store.state.flickrPhoto.albums"
      :items-per-page="10"
      :search="search"
      item-key="id"
      :page.sync="curPage"
      :single-select="singleSelect"
      class="elevation-1"
      show-select
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
    <v-spacer class="flex-grow-1"></v-spacer>
    <v-card-actions class="pa-4">
      <v-btn color="deep-purple accent-4" @click="moveStep(-1)">
        Previous
      </v-btn>
      <v-btn
        color="deep-purple accent-4"
        :disabled="!albumSelected()"
        @click="moveStep(1)"
      >
        Next
      </v-btn>
    </v-card-actions>
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
      curPage: 1,
      singleSelect: true,
      selectedAlbum: [],
      headers: [
        {
          text: 'Album',
          align: 'start',
          sortable: true,
          value: 'title',
        },
        { text: '#', align: 'start', sortable: true, value: 'photos' },
        { text: '', align: 'start', sortable: false, value: 'id' },
      ],
      search: null,
      loadThumbnails: false,
    }
  },
  mounted() {
    const selected = this.$store.state.flickrPhoto.selected
    this.selectedAlbum = selected ? [selected] : []
    this.search = selected ? selected.title : null
  },
  methods: {
    moveStep(delta) {
      this.$store.commit(
        'setFlickrAlbum',
        this.albumSelected() ? this.selectedAlbum[0] : null
      )
      this.$emit('input', this.value + delta)
    },
    albumSelected() {
      return this.selectedAlbum.length > 0
    },
    selectedAlbumName() {
      return this.albumSelected() ? this.selectedAlbum[0].title : null
    },
    chooseAlbum(e) {
      if (e && e.value) {
        this.selectedAlbum = [e.item]
        this.curPage = 1
      } else {
        this.selectedAlbum = []
      }
      this.search = this.selectedAlbumName()
    },
    typeAlbumName() {
      if (this.search) {
        for (const b of this.$store.state.flickrPhoto.albums) {
          if (b.title.toLowerCase() === this.search.toLowerCase) {
            this.selectedAlbum = [b]
            return
          }
        }
      }
      this.selectedAlbum = []
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
          return {
            index: thumbnail.index,
            name: photos[idx].title,
            url: photos[idx].turl,
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
