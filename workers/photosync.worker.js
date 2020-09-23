// Respond to message from parent thread
self.addEventListener('message', async (event) => {
  console.log('worker', event.data)

  const { photoId, photoUrl } = event.data
  if (photoUrl) {
    await syncIt(photoId, photoUrl)

    self.postMessage({ status: 'Done Sync' })
  } else {
    self.postMessage({ status: 'hello from worker' })
  }
})

const syncIt = async (photoId, photoUrl) => {
  console.debug(`Sync'ing photo: ${photoId} from ${photoUrl}`)

  const resp = await fetch(photoUrl)
  if (resp.ok) {
    const image = await resp.blob()
    console.debug(`Blob: ${image.size} ${image.type}`)
  } else {
    console.error(`Failed to download photo: %o`, resp)
  }
  return true
}
