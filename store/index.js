export const state = () => ({
  flickr: {},
  googlePhoto: {},
})

export const mutations = {
  updateFlickrRequestToken(state, { requestToken, requestTokenSecret }) {
    state.flickr = {
      requestToken,
      requestTokenSecret,
    }
    console.debug(`Updated flickr request token: ${state.flickr}`)
  },
  updateFlickrAuthData(
    state,
    { accessToken, accessTokenSecret, userId, userName }
  ) {
    state.flickr = {
      accessToken,
      accessTokenSecret,
      userId,
      userName,
    }
    console.debug(`Updated flickr auth metadata: ${state.flickr}`)
  },
}
