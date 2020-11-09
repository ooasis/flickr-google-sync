<template>
  <v-card
    class="d-flex flex-column mb-12"
    color="grey lighten-1"
    :min-height="height"
  >
    <v-card-title>{{ title }}</v-card-title>
    <v-container>
      <v-row class="mx-4">
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
          <v-btn @click="fetchAlbums"> Load Google Albums </v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-data-table
            v-model="selectedAlbum"
            :headers="headers"
            :items="$store.state.googlePhoto.albums"
            :items-per-page="10"
            :page.sync="curPage"
            :search="search"
            :single-select="singleSelect"
            item-key="id"
            show-select
            class="elevation-1 flex-grow-1"
            @item-selected="chooseAlbum"
          >
            <template v-slot:[`item.id`]="{ item }">
              <div class="d-flex flex-row">
                <v-img
                  v-for="thumbnail in item.thumbnails.filter((t) => !!t)"
                  :key="thumbnail.index"
                  max-height="80"
                  max-width="80"
                  class="ma-2"
                  :src="thumbnail.url"
                ></v-img>
              </div>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
    <v-spacer></v-spacer>
    <v-card-actions class="pa-4">
      <v-btn color="deep-purple accent-4" @click="moveStep(-1)">
        Previous
      </v-btn>
      <v-btn color="deep-purple accent-4" @click="moveStep(1)"> Next </v-btn>
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
  data() {
    return {
      curPage: 1,
      singleSelect: true,
      selectedAlbum: [],
      newAlbum: null,
      headers: [
        {
          text: 'Name',
          align: 'start',
          sortable: false,
          value: 'title',
        },
        { text: '', value: 'id' },
      ],
      search: null,
      loadThumbnails: false,
    }
  },
  mounted() {
    const selected = this.$store.state.googlePhoto.selected
    if (selected) {
      if (typeof selected === 'object') {
        this.selectedAlbum = [selected]
        this.search = selected.title
      } else if (typeof selected === 'string') {
        this.search = selected
      }
    }
  },
  methods: {
    moveStep(delta) {
      this.$store.commit(
        'setGoogleAlbum',
        this.albumSelected() ? this.selectedAlbum[0] : this.search
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
        for (const b of this.$store.state.googlePhoto.albums) {
          if (b.title.toLowerCase() === this.search.toLowerCase) {
            this.selectedAlbum = [b]
            return
          }
        }
      }
      this.selectedAlbum = []
    },
    async fetchAlbums() {
      const albumUrl = 'https://photoslibrary.googleapis.com/v1/albums'
      const googleAccessToken = this.$auth.getToken('google')
      let allAlbums = []
      let pageToken
      this.newAlbum = null

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
            const albumsThisBatch = albums
              .filter((r) => r.isWriteable)
              .map((r) => {
                return {
                  id: r.id,
                  title: r.title,
                  photos: r.mediaItemsCount,
                }
              })
            pageToken = nextPageToken
            allAlbums = [...allAlbums, ...albumsThisBatch]
          }
        }
      } while (pageToken)
      allAlbums.forEach((r) => {
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
      this.$store.commit('setGoogleAlbums', allAlbums)
      this.loadThumbnails = true
      // await this.populateThumbnails(allAlbums)
      this.loadThumbnails = false
    },
    async populateThumbnails(albums) {
      for (const album of albums) {
        if (!this.loadThumbnails) {
          break
        }
        const photos = await this.googleFetchThumbnails(album)
        const enrichedThumbnails = album.thumbnails.map((thumbnail, idx) => {
          console.log(
            `load thumbnail ${thumbnail.index} in album ${album.title}`
          )
          if (photos[idx]) {
            return {
              index: thumbnail.index,
              name: photos[idx].filename,
              url: photos[idx].baseUrl,
            }
          }
        })
        this.$store.commit('setGoogleThumbnails', {
          id: album.id,
          thumbnails: enrichedThumbnails,
        })
      }
    },
    async googleFetchThumbnails(album) {
      const photoSearchUrl =
        'https://photoslibrary.googleapis.com/v1/mediaItems:search'
      const googleAccessToken = this.$auth.getToken('google')
      const resp = await fetch(photoSearchUrl, {
        method: 'POST',
        headers: {
          Authorization: googleAccessToken,
        },
        body: JSON.stringify({
          albumId: `${album.id}`,
          pageSize: 5,
        }),
      })
      if (!resp.ok) {
        const err = await resp.text()
        console.error(`Failed to fetch google photo albums: %o`, err)
        this.$auth.logout()
      } else {
        const { mediaItems } = await resp.json()
        return mediaItems
      }
    },
  },
}
</script>
