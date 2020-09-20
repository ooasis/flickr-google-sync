import Flickr from 'flickr-sdk'

export default async function (req, res, next) {
  const oauth = new Flickr.OAuth(
    process.env.FLICKR_CONSUMER_KEY,
    process.env.FLICKR_CONSUMER_SECRET
  )

  const { body } = await oauth.request(
    `${process.env.API_URL}/auth/flickr/verify`
  )
  console.debug(`Flickr auth request returns: ${body}`)
  const {
    oauth_token: requestToken,
    oauth_token_secret: requestTokenSecret,
  } = body
  /*
  {                                                                                                                                                                                     15:41:19
    oauth_callback_confirmed: 'true',
    oauth_token: '72157716029266252-86bb966b67c576ca',
    oauth_token_secret: '6874276c8ad0ad37'
  }
  */
  const authRequestUrl = oauth.authorizeUrl(requestToken)

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ authRequestUrl, requestToken, requestTokenSecret }))
}
