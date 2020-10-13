const passport = require('passport')
const axios = require('axios')

// const { get } = require('lodash')
const LinkedInStrategy = require('@sokratis/passport-linkedin-oauth2').Strategy;

const { config } = require('../../../config/index');

passport.use(
  new LinkedInStrategy(
    {
      clientID: config.linkedinClientId,
      clientSecret: config.linkedinClientSecret,
      callbackURL: '/auth/linkedin/callback',
      scope: ['r_emailaddress', 'r_liteprofile']
    },
    async (accessToken, refreshToken, profile, cb) => {
      const { data, status } = await axios({
        url: `${config.apiUrl}/api/auth/sign-provider`,
        method: 'post',
        data: {
          name: profile.displayName,
          email: profile.emails[0].value,
          password: profile.id,
          apiKeyToken: config.apiKeyToken
        }
      });

      if (!data || status !== 200) {
        return cb(boom.unauthorized(), false);
      }

      return cb(null, data);
    }
  )
);