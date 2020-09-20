import Flickr from 'flickr-sdk'
import url from 'url'

export default async function (req, res, next) {
  // /api/flickr/verify?token=${token}&secret=${secret}&verifier=${verifier}
  const oauth = new Flickr.OAuth(
    process.env.FLICKR_CONSUMER_KEY,
    process.env.FLICKR_CONSUMER_SECRET
  )
  const { token, secret, verifier } = url.parse(req.url, true).query
  const { body } = await oauth.verify(token, verifier, secret)
  console.debug(`Flickr auth verify returns: ${body}`)
  const {
    oauth_token: accessToken,
    oauth_token_secret: accessTokenSecret,
    user_nsid: userId,
    username: userName,
  } = body

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ accessToken, accessTokenSecret, userId, userName }))
}
