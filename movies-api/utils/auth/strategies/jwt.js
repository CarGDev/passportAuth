const passport = require('passport')
const { ExtractJwt, Strategy } = require('passport-jwt')

const boom = require('@hapi/boom')

const UsersService = require('../../../services/users')
const { config } = require('../../../config')

passport.use(
  new Strategy({
    secretOrKey: config.authJwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    async (tokenPayload, cb) => {
      const UsersServices = new UsersService()
      try {
        const user = await UsersServices.getUser({ email: tokenPayload.email })
        if(!user) return cb(boom.unauthorized(), false)
        delete user.password

        cb(null, {...user, scopes: tokenPayload.scopes})
      } catch (error) {
        return cb(error)
      }
    }
  )
)