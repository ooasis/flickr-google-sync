<template>
  <v-card
    v-if="!flickrSignedIn()"
    class="mb-12"
    color="grey lighten-1"
    height="200px"
  >
    <v-card-text>
      <p class="display-1 text--primary">Sign In Flickr</p>
      <div class="text--primary">Sign in your Flickr account.<br /></div>
    </v-card-text>
    <v-card-actions>
      <v-btn text color="deep-purple accent-4" @click="flickrRequestAuth">
        Login Flickr
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
export default {
  props: {
    onSelectedAlbum: {
      type: Function,
      required: true,
    },
    albums: {
      type: Array,
      required: true,
    },
  },
}
</script>
