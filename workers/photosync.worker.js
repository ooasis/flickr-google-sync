const googleUploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads'
const googleUploadTagUrl =
  'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate'

self.addEventListener('message', async (event) => {
  console.log('worker', event.data)

  const result = await syncIt(event.data)
  self.postMessage({ status: result })
})

const syncIt = async ({ photoId, photoUrl, photoDesc, googleAccessToken }) => {
  console.debug(`Sync'ing photo: ${photoId} from ${photoUrl}`)

  const downloadResp = await fetch(photoUrl)
  if (!downloadResp.ok) {
    const downloadErr = await downloadResp.text()
    console.error(`Failed to download photo: %o`, downloadErr)
    return false
  }

  const image = await downloadResp.blob()
  console.debug(`Raw photo: ${image.size} ${image.type}`)

  const uploadResp = await fetch(googleUploadUrl, {
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
  if (!uploadResp.ok) {
    const uploadErr = await uploadResp.text()
    console.error(`Failed to upload photo: %o`, uploadErr)
    return false
  }

  const uploadToken = await uploadResp.text()
  console.debug(`Uploaded photo and get token back: ${uploadToken}`)

  const tag = {
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
  const tagResp = await fetch(googleUploadTagUrl, {
    method: 'POST',
    body: JSON.stringify(tag),
    headers: {
      Authorization: googleAccessToken,
      'Content-Type': 'application/json',
    },
  })
  if (!tagResp.ok) {
    const tagErr = await tagResp.text()
    console.error(`Failed to tag photo: %o`, tagErr)
    return false
  }

  const tagResult = await tagResp.text()
  console.debug(`Tag photo and get token back: ${tagResult}`)
  return tagResult
}
