import Flickr from 'flickr-sdk'
import url from 'url'

export default async function (req, res, next) {
  const { accessToken, accessTokenSecret, photsets, flickrUser } = url.parse(
    req.url,
    true
  ).query

  var flickr = new Flickr(
    Flickr.OAuth.createPlugin(
      process.env.FLICKR_CONSUMER_KEY,
      process.env.FLICKR_CONSUMER_SECRET,
      accessToken,
      accessTokenSecret
    )
  )

  const photoSets = await Promise.all(
    photsets.split(':').map(async (photosetId) => {
      const {
        body: { photoset: resp },
      } = await flickr.photosets.getPhotos({
        photoset_id: photosetId,
        user_id: flickrUser,
        media: 'photo',
        extras: 'url_o',
      })

      console.debug(
        `Returned ${resp.total} photos for photo set ${resp.title} (max: ${resp.perpage})`
      )
      const photos = resp.photo.map((photo) => {
        const { id, title, url_o } = photo

        return { id, title, url_o }
      })

      return { photosetId, photos }
    })
  )

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(photoSets))
}
