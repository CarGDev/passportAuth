'use strict'

const express = require('express')
const passport = require('passport')
const MoviesService = require('../services/movies')
const response = require('../network/response')
const {
  movieIdSchema,
  createMovieSchema,
  updateMovieSchema
} = require('../utils/schemas/movies')

const validationHandler = require('../utils/middleware/validationHandler')
const scopesValidationHandler = require('../utils/middleware/scopesValidationHandler')

const cacheResponse = require('../utils/cacheResponse')
const {
  FIVE_MINUTES_IN_SECONDS,
  SIXTY_MINUTES_IN_SECONDS
} = require('../utils/time')

// jwt strategy
require('../utils/auth/strategies/jwt')

const moviesApi = (app) => {
  const router = express.Router()
  app.use('/api/movies', router)

  const moviesService = new MoviesService()


  const list = async (req, res, next) => {
    cacheResponse(res, FIVE_MINUTES_IN_SECONDS)
    const { tags } = req.query
    try {
      const movies = await moviesService.getMovies({ tags })
      return response.success(res, req, movies, 'movies listed', 200)
    } catch (err) {
      next(err)
    }
  }

  const movieId = async (req, res, next) => {
    cacheResponse(res, SIXTY_MINUTES_IN_SECONDS)
    const { movieId } = req.params
    try {
      const movies = await moviesService.getMovie({ movieId })
      return response.success(res, req, movies, 'movie retrieved', 200)
    } catch (err) {
      next(err)
    }
  }

  const postMovie = async (req, res, next) => {
    const { body: movie } = req
    try {
      const createdMovieId = await moviesService.createMovie({ movie })
      return response.success(res, req, createdMovieId, 'movie created', 201)
    } catch (err) {
      next(err)
    }
  }

  const modifyMovie = async (req, res, next) => {
    const { movieId } = req.params
    const { body: movie } = req
    try {
      const updatedMovieId = await moviesService.updateMovie({ movieId, movie })
      return response.success(res, req, updatedMovieId, 'movie updated', 200)
    } catch (err) {
      next(err)
    }
  }

  const deleteMovie = async (req, res, next) => {
    const { movieId } = req.params
    try {
      const deletedMovieId = await moviesService.deleteMovie({ movieId })
      return response.success(res, req, deletedMovieId, 'movie deleted', 200)
    } catch (err) {
      next(err)
    }
  }

  router.get('/', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['read:movies']), list)
  router.get('/:movieId', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['read:movies']), validationHandler({ movieId: movieIdSchema }, 'params'), movieId)
  router.post('/', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['create:movies']), validationHandler(createMovieSchema), postMovie)
  router.put('/:movieId', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['update:movies']), validationHandler({ movieId: movieIdSchema }, 'params'), validationHandler(updateMovieSchema), modifyMovie)
  router.delete('/:movieId', passport.authenticate('jwt', { session: false }), scopesValidationHandler(['deleted:movies']), validationHandler({ movieId: movieIdSchema }, 'params'), deleteMovie)
}

module.exports = moviesApi
