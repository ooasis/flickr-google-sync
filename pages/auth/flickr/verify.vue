<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3>Waiting to verify Flickr authorization...</h3>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'

export default {
  // /auth/verify_token?oauth_token=72157716024999131-a924823025f5be96&oauth_verifier=644eb9005a420301
  async mounted() {
    const { oauth_token: token, oauth_verifier: verifier } = this.$route.query
    const secret = this.$store.state.flickr.requestTokenSecret
    const verifyUrl = `/api/flickr/verify?token=${token}&secret=${secret}&verifier=${verifier}`
    console.debug(`Verify with ${verifyUrl}`)
    const {
      data: { accessToken, accessTokenSecret, userId, userName },
    } = await axios.get(verifyUrl)

    if (accessToken) {
      this.$store.commit('updateFlickrAuthData', {
        accessToken,
        accessTokenSecret,
        userId,
        userName,
      })
      console.info(`Authorized to access flickr user: ${userName}(${userId})`)
      this.$router.replace('/')
    }
  },
}
</script>
