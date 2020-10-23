export const state = () => ({
  flickr: {},
  flickrPhoto: {
    selected: null,
    albums: [],
  },
  googlePhoto: {
    selected: null,
    albums: [],
  },
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
  resetFlickrAuthData(state) {
    state.flickr = {}
    console.debug(`Reset flickr auth metadata`)
  },
  setFlickrAlbums(state, albums) {
    state.flickrPhoto.albums = albums
    console.debug(`Set flickr albums: ${albums.length}`)
  },
  setFlickrAlbum(state, album) {
    state.flickrPhoto.selected = album
    console.debug(`Set flickr album: ${album}`)
  },
  setGoogleAlbums(state, albums) {
    state.googlePhoto.albums = albums
    console.debug(`Set google albums: ${albums.length}`)
  },
  setGoogleAlbum(state, album) {
    state.googlePhoto.selected = album
    console.debug(`Set google album: ${album}`)
  },
}
