<template>
  <v-card class="mb-12" color="grey lighten-1" :height="height">
    <v-card-actions>
      <v-btn text color="deep-purple accent-4" @click="$emit('input', 1)">
        Previous
      </v-btn>
      <v-btn
        text
        color="deep-purple accent-4"
        :disabled="!albumSelected()"
        @click="$emit('input', 3)"
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
      return !!this.$store.state.flickrPhoto.selected
    },
    chooseAlbum(e) {
      this.$store.commit('setFlickrAlbum', e.value ? e.item : null)
    },
    async fetchAlbums() {
      const { accessToken, accessTokenSecret } = this.$store.state.flickr
      const {
        data: { photoSets },
      } = await this.$axios.get(`/api/flickr/photosets`, {
        params: { accessToken, accessTokenSecret },
      })
      console.debug(`Fetched flickr photo sets: %o`, photoSets)
      this.$store.commit('setFlickrAlbums', photoSets)
    },
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
  },
}
</script>
