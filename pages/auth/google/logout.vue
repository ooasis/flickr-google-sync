<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3>Logout Google...</h3>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  middleware: 'auth',

  // /auth/google/verify#state=SSclwwhBWbG-PNUWlPdFI&access_token=ya29.a0AfH6...Wravts&token_type=Bearer&expires_in=3599&scope=email%20https://www.googleapis.com/auth/userinfo.email%20openid&authuser=0&prompt=consent
  mounted() {
    this.$router.replace('/')
  },
}
</script>
