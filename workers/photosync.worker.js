self.addEventListener('message', async (event) => {
  console.log('worker', event.data)

  const result = await syncIt(event.data)
  self.postMessage(result)
})

const syncIt = async ({
  albumId,
  photoId,
  photoUrl,
  photoDesc,
  googleAccessToken,
}) => {
  console.debug(`Sync'ing photo: ${photoId} from ${photoUrl}`)

  const image = await downloadImage(photoUrl)
  const uploadToken = await uploadImage(image, googleAccessToken)

  const newPhotoUrl = await addMediaItem(
    albumId,
    uploadToken,
    photoId,
    photoDesc,
    googleAccessToken
  )
  return { photoId, newPhotoUrl }
}

const downloadImage = async (photoUrl) => {
  const resp = await fetch(photoUrl)
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Failed to download photo: ${err}`)
  }

  const image = await resp.blob()
  // console.debug(`Downloaded raw photo: ${image.size} ${image.type}`)
  return image
}

const uploadImage = async (image, googleAccessToken) => {
  const googleUploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads'

  const resp = await fetch(googleUploadUrl, {
    method: 'POST',
    body: image,
    headers: {
      Authorization: googleAccessToken,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-Content-Type': 'image/jpeg',
      'X-Goog-Upload-Protocol': 'raw',
    },
    mode: 'cors',
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Failed to upload photo: ${err}`)
  }

  const uploadToken = await resp.text()
  // console.debug(`Uploaded photo and get token back: ${uploadToken}`)
  return uploadToken
}

const addMediaItem = async (
  albumId,
  uploadToken,
  photoId,
  photoDesc,
  googleAccessToken
) => {
  const googleUrl =
    'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate'
  const req = {
    newMediaItems: [
      {
        description: photoDesc,
        simpleMediaItem: {
          fileName: photoId,
          uploadToken,
        },
      },
    ],
  }
  if (albumId) {
    req.albumId = albumId
  }

  const resp = await fetch(googleUrl, {
    method: 'POST',
    body: JSON.stringify(req),
    headers: {
      Authorization: googleAccessToken,
      'Content-Type': 'application/json',
    },
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Failed to create media item: ${err}`)
  }

  const result = await resp.json()
  const {
    newMediaItemResults: [
      {
        mediaItem: { id: mediaItemId, productUrl: photoUrl },
      },
    ],
  } = result
  console.debug(`Uploaded photo ${mediaItemId} to album: ${albumId}`)
  return photoUrl
}
