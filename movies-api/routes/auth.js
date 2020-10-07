const express = require('express')
const passport = require('passport')
const boom = require('@hapi/boom')
const jwt = require('jsonwebtoken')
const ApiKeysService = require('../services/apiKeys')
const response = require('../network/response')

const { config } = require('../config')

require('../utils/auth/strategies/basic')

const authApi = (app) => {
  const router = express.Router()
  app.use('/api/auth', router)

  const ApiKeysServices = new ApiKeysService()
  const routeAuth = async (req, res, next) => {
    const { apiKeyToken } = req.body
    if (!apiKeyToken) next(boom.unauthorized('apiKeyToken is required'))

    passport.authenticate('basic', (error, user) => {
      try {
        if (error || !user) {
          next(boom.unauthorized())
        }
        req.login(user, { session: false }, async (error) => {
          if (error) {
            next(error)
          }
          const apiKey = await ApiKeysServices.getApiKey({ token: apiKeyToken })
          if (!apiKey) {
            next(boom.unauthorized())
          }
          const { _id: id, name, email } = user
          const payload = {
            sub: id,
            name,
            email,
            scopes: apiKey.scopes
          }

          const token = jwt.sign(payload, config.authJwtSecret, {
            expiresIn: '15m'
          })
          return response.success(req, res, token, { id, name, email }, 200)
        })
      } catch (error) {
        next(error)
      }
    })(req, res, next)
  }

  router.post('/sign-in', routeAuth)
}

module.exports = authApi
