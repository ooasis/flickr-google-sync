<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <client-only placeholder="Loading...">
          <v-stepper v-model="curStep">
            <v-stepper-header>
              <v-stepper-step :complete="curStep > 1" step="1"
                >Sign In</v-stepper-step
              >

              <v-divider></v-divider>

              <v-stepper-step :complete="curStep > 2" step="2"
                >Choose Source Album</v-stepper-step
              >

              <v-divider></v-divider>

              <v-stepper-step :complete="curStep > 3" step="3"
                >Choose Destination Album</v-stepper-step
              >

              <v-divider></v-divider>

              <v-stepper-step :complete="curStep > 4" step="4"
                >Start Sync.</v-stepper-step
              >
            </v-stepper-header>

            <v-stepper-items>
              <v-stepper-content step="1">
                <account-sign-in-card
                  v-model="curStep"
                  title="Sign In"
                  height="600"
                />
              </v-stepper-content>

              <v-stepper-content step="2">
                <flickr-selection-card
                  v-model="curStep"
                  title="Choose Flickr Album"
                />
              </v-stepper-content>

              <v-stepper-content step="3">
                <google-photo-selection-card
                  v-model="curStep"
                  title="Choose Google Photo Album"
                />
              </v-stepper-content>

              <v-stepper-content step="4">
                <photo-sync-card v-model="curStep" title="Sync Photos" />
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </client-only>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AccountSignInCard from '../components/AccountSignInCard'
import FlickrSelectionCard from '../components/FlickrSelectionCard'
import GooglePhotoSelectionCard from '../components/GooglePhotoSelectionCard'
import PhotoSyncCard from '../components/PhotoSyncCard'

export default {
  components: {
    AccountSignInCard,
    FlickrSelectionCard,
    GooglePhotoSelectionCard,
    PhotoSyncCard,
  },
  data() {
    return {
      curStep: 1,
    }
  },
}
</script>
