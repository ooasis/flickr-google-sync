import Flickr from 'flickr-sdk'
import url from 'url'

export default async function (req, res, next) {
  const { accessToken, accessTokenSecret } = url.parse(req.url, true).query

  var flickr = new Flickr(
    Flickr.OAuth.createPlugin(
      process.env.FLICKR_CONSUMER_KEY,
      process.env.FLICKR_CONSUMER_SECRET,
      accessToken,
      accessTokenSecret
    )
  )

  const {
    body: { photosets: resp },
  } = await flickr.photosets.getList()
  console.debug(`Returned ${resp.total} photo sets (max: ${resp.perpage})`)
  const photoSets = resp.photoset.map((photoset) => {
    const {
      id,
      description: { _content: description },
      title: { _content: title },
      photos,
    } = photoset

    return { id, photos, title, description }
  })

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ photoSets }))
}
