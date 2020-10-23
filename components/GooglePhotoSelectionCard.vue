<template>
  <v-card class="mb-12" color="grey lighten-1" :height="height">
    <v-card-actions>
      <v-btn text color="deep-purple accent-4" @click="$emit('input', 2)">
        Previous
      </v-btn>
      <v-btn
        text
        color="deep-purple accent-4"
        :disabled="!albumSelected()"
        @click="$emit('input', 4)"
      >
        Next
      </v-btn>
    </v-card-actions>
    <v-card-title>{{ title }}</v-card-title>

    <v-card>
      <v-card-title>
        <v-btn text color="deep-purple accent-4" @click="fetchAlbums">
          Load Google Albums
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
        :items="$store.state.googlePhoto.albums"
        :items-per-page="10"
        :search="search"
        item-key="id"
        show-select
        :single-select="singleSelect"
        class="elevation-1"
        @item-selected="chooseAlbum"
      >
      </v-data-table>
    </v-card>
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
      singleSelect: true,
      headers: [
        {
          text: 'Name',
          align: 'start',
          sortable: false,
          value: 'title',
        },
        { text: '', value: 'description' },
      ],
      search: null,
    }
  },
  methods: {
    albumSelected() {
      return !!this.$store.state.googlePhoto.selected
    },
    chooseAlbum(e) {
      this.$store.commit('setGoogleAlbum', e.value ? e.item : null)
    },
    async fetchAlbums() {
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
      this.$store.commit('setGoogleAlbums', allAlbums)
    },
  },
}
</script>
