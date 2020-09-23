import PhotoSyncWorker from '@/workers/photosync.worker.js'

export default (context, inject) => {
  inject('worker', {
    createWorker() {
      return new PhotoSyncWorker()
    },
  })
}
