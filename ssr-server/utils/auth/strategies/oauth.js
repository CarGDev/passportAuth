const passport = require('passport')
const axios = require('axios')
const boom = require('@hapi/boom')
const { OAuth2Strategy } = require('passport-oauth')

const { config } = require('../../../config/index')

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://www.googleapis.com/oauth2/v4/token"
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

const strategyfunction = async (accessToken, refreshToken, profile, cb) => {
  const { data, status } = await axios({
    url: `${config.apiUrl}/api/auth/sign-provider`,
    method: 'post',
    data: {
      name: profile.name,
      email: profile.email,
      password: profile.id,
      apiKeyToken: config.apiKeyToken
    }
  })

  if (!data || status !== 200) return cb(boom.unauthorized(), false)

  return cb(null, data)
}

const oAuth2Stratefy = new OAuth2Strategy({
  authorizationURL: GOOGLE_AUTHORIZATION_URL,
  tokenURL: GOOGLE_TOKEN_URL,
  clientID: config.googleClientId,
  clientSecret: config.googleClientSecret,
  callback: '/auth/google-oauth/callback'
}, strategyfunction)

oAuth2Stratefy.userProfile = (accessToken, done) => {
  this._oauth2.get(GOOGLE_USERINFO_URL, accessToken, (err, body) => {
    if (err) return done(err)

    try {
      const { sub, name, email } = JSON.parse(body)
      const profile = {
        id: sub,
        name,
        email
      }
      done(null, profile)
    } catch (parseError) {
      return done(parseError)
    }
  })
}

passport.use('google-oauth', oAuth2Stratefy)