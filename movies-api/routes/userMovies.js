'use strict'

const express = require('express')
const passport = require('passport')
const validationHandler = require('../utils/middleware/validationHandler')

const { movieIdSchema } = require('../utils/schemas/movies')
const { userIdSchema } = require('../utils/schemas/users')
const { createUserMovieSchema } = require('../utils/schemas/userMovies')
const UserMoviesService = require('../services/userMovies')
const response = require('../network/response')
const scopesValidationHandler = require('../utils/middleware/scopesValidationHandler')
// jwt strategy
require('../utils/auth/strategies/jwt')

const userMoviesApi = (app) => {
  const router = express.Router()
  app.use('/api/user-movies', router)

  const userMoviesService = new UserMoviesService()

  const getMoviesUser = async (req, res, next) => {
    const { userId } = req.query
    try {
      const userMovies = await userMoviesService.getUserMovies({ userId })
      response.success(req, res, userMovies, 'user movies listed', 200)
    } catch (error) {
      next(error)
    }
  }

  const postMoviesUser = async (req, res, next) => {
    const { body: userMovie } = req
    try {
      const createUserMovieId = await userMoviesService.createUserMovie({ userMovie })
      response.success(req, res, createUserMovieId, 'user movie created', 201)
    } catch (error) {
      next(error)
    }
  }

  const deleteMoviesUser = async (req, res, next) => {
    const { userMovieId } = req.params
    try {
      const deleteUserMovieId = await userMoviesService.deleteUserMovie({ userMovieId })
      response.success(req, res, deleteUserMovieId, 'user movie deleted', 200)
    } catch (error) {
      next(error)
    }
  }

  router.get('/', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['read:user-movies']), validationHandler({ userId: userIdSchema }, 'query'), getMoviesUser)
  router.post('/', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['create:user-movies']), validationHandler(createUserMovieSchema), postMoviesUser)
  router.delete('/:userMovieId', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['delete:user-movies']), validationHandler({ userMovieId: movieIdSchema}, 'params'), deleteMoviesUser)
}

module.exports = userMoviesApi