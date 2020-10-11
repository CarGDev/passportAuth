'use strict'

const express = require('express')
const passport = require('passport')
const boom = require('@hapi/boom')
const jwt = require('jsonwebtoken')
const ApiKeysService = require('../services/apiKeys')
const UserService = require('../services/users')
const response = require('../network/response')
const validationHandler = require('../utils/middleware/validationHandler')

const { createUserSchema, createProviderUserSchema } = require('../utils/schemas/users')

const { config } = require('../config')

require('../utils/auth/strategies/basic')

const authApi = (app) => {
  const router = express.Router()
  app.use('/api/auth', router)

  const ApiKeysServices = new ApiKeysService()
  const userService = new UserService()

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

  const routeSignUP = async (req, res, next) => {
    const { body: user } = req

    try {
      const createdUserID = await userService.createUser({ user })
      return response.success(req, res, createdUserID, 'user created', 201)
    } catch (error) {
      next(error)
    }
  }

  const routeSignProvider = async (req, res, next) => {
    const { body } = req

    const { apiKeyToken, ...user } = body
    if (!apiKeyToken) next(boom.unauthorized('apiKeyToken required'))

    try {
      const querieUser = await userService.getOrCreateUser({ user })
      const apiKey = await ApiKeysService.getApiKey({ token: apiKeyToken })

      if (!apiKey) next(boom.unauthorized())

      const { _id: id, name, email } = querieUser

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
    } catch (error) {
      next(error)
    }
  }

  router.post('/sign-in', routeAuth)
  router.post('/sign-up', validationHandler(createUserSchema), routeSignUP)
  router.post('/sign-provider', validationHandler(createProviderUserSchema), routeSignProvider)
}

module.exports = authApi
