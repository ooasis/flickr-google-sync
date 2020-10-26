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
  resetFlickrData(state) {
    state.flickr = {}
    state.flickrPhoto = {
      selected: null,
      albums: [],
    }
    console.debug(`Reset flickr metadata`)
  },
  setFlickrAlbums(state, albums) {
    state.flickrPhoto.albums = albums
    console.debug(`Set flickr albums: ${albums.length}`)
  },
  setFlickrAlbum(state, album) {
    state.flickrPhoto.selected = album
    console.debug(`Set flickr album: ${album}`)
  },

  resetGoogleData(state) {
    state.googlePhoto = {
      selected: null,
      albums: [],
    }
    console.debug(`Reset google metadata`)
  },
  setGoogleAlbums(state, albums) {
    state.googlePhoto.albums = albums
    console.debug(`Set google albums: ${albums.length}`)
  },
  setGoogleAlbum(state, album) {
    state.googlePhoto.selected = album
    console.debug(`Set google album: ${album}`)
  },
  setFlickrThumbnails(state, enrichedAlbum) {
    console.debug(`Set flickr thumbnails: ${enrichedAlbum}`)
    state.flickrPhoto.albums.forEach((album) => {
      if (album.id === enrichedAlbum.id) {
        album.thumbnails = enrichedAlbum.thumbnails
      }
    })
  },
  setGoogleThumbnails(state, enrichedAlbum) {
    console.debug(`Set google thumbnails: ${enrichedAlbum}`)
    state.googlePhoto.albums.forEach((album) => {
      if (album.id === enrichedAlbum.id) {
        album.thumbnails = enrichedAlbum.thumbnails
      }
    })
  },
}
