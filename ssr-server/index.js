'use strict'

const express = require("express");
const helmet = require('helmet')
const passport = require('passport')
const boom = require('@hapi/boom')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const axios = require('axios')

const { config } = require("./config");

const app = express();

// Agregamos las variables de timpo en segundos
const THIRTY_DAYS_IN_SEC = 2592000;
const TWO_HOURS_IN_SEC = 7200;

// body parser
app.use(express.json());
app.use(cookieParser())
app.use(session({ session: config.sessionSecret }))
app.use(passport.initialize())
app.use(passport.session())
app.use(helmet())
// Basic Strategy
require('./utils/auth/strategies/basic')
//OAuth Strategy
require('./utils/auth/strategies/oauth')
//Google Strategy
require('./utils/auth/strategies/google')
//Twitter Strategy
require('./utils/auth/strategies/twitter')
//facebook Strategy
require('./utils/auth/strategies/facebook')
//LinkedIn Strategy
require('./utils/auth/strategies/linkedIn')


const postSignIn = async (req, res, next) => {
  const { rememberMe } = req.body
  passport.authenticate('basic', (error, data) => {
    try {
      if (error || !data) next(boom.unauthorized())

      req.login(data, { session: false }, async (error) => {
        if (error) next(error)

        const { token, ...user } = data

        // Si el atributo rememberMe es verdadero la expiración será en 30 dias
        // de lo contrario la expiración será en 2 horas
        res.cookie('token', token, {
          httpOnly: !config.dev,
          secure: !config.dev,
          maxAge: rememberMe ? THIRTY_DAYS_IN_SEC : TWO_HOURS_IN_SEC
        })

        res.status(200).json(user)
      })
    } catch (error) {
      next(error)
    }
  })(req, res, next)
}

const postSignUp = async (req, res, next) => {
  const { body: user } = req

  try {
    await axios({
      url: `${config.apiUrl}/api/auth/sign-up`,
      method: 'post',
      data: user
    })
    res.status(201).json({ message: 'User created' })
  } catch (error) {
    next(error)
  }
}

const getMoviesList = async (req, res, next) => {
  try {
    const { body: userMovie } = req
    const { token } = req.cookies

    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies`,
      headers: { Authorization: `Bearer ${token}`},
      method: 'post',
      data: userMovie
    })

    if (status !== 201) return next(boom.badImplementation())

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
}

const postMovies = async (req, res, next) => {

}

const deleteMovie = async (req, res, next) => {
  try {
    const { userMovieId } = req.params
    const { token } = req.cookies

    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies/${userMovieId}`,
      headers: { Authorization: `Bearer ${token}`},
      method: 'delete',
    })

    if (status !== 200) return next(boom.badImplementation())

    res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}

const googleCb = (req, res, next) => {
  if (!req.user) next(boom.unauthorized())

  const { token, ...user } = req.user
  res.cookie('token', token, {
    httpOnly: !config.dev,
    secure: !config.dev
  })

  res.status(200).json(user)
}

const googleAuth = (req, res, next) => {
  if (!req.user) next(boom.unauthorized())
  const { token, ...user } = req.user;
  res.cookie("token", token, {
    httpOnly: !config.dev,
    secure: !config.dev
  });

  res.status(200).json(user);
}

const linkedinAuth = (req, res, next) => {
  if (!req.user) {
    next(boom.unauthorized())
  }
  const { token, ...user } = req.user;
  res.cookie('token', token, {
    httpOnly: !config.dev,
    secure: !config.dev
  });
  res.status(200).json(user)
}

const twitterAuth = (req, res, next) => {
  if(!req.user) next(boom.unauthorized())

  const { token, ...user } = req.user

  res.cookie('token', token, {
    httpOnly: !config.dev,
    secure: !config.dev
  })

  res.status(200).json(user)
}

const facebookAuth = (req, res, next) => {
  if (!req.user) {
    next(boom.unauthorized());
  }

  const { token, ...user } = req.user;

  res.cookie("token", token, {
    httpOnly: !config.dev,
    secure: !config.dev
  });

  res.status(200).json(user);
}

app.get("/movies", getMoviesList);
app.get("/auth/google-oauth/callback", passport.authenticate('google-oauth', { session: false }), googleCb);
app.get("/auth/google-oauth", passport.authenticate('google-oauth', {
  scope: [ 'email', 'profile' , 'openid']
}));
app.post("/auth/sign-in", postSignIn)
app.post("/auth/sign-up", postSignUp);
app.post("/user-movies", postMovies);
app.delete("/user-movies/:userMovieId", deleteMovie);

app.post('/auth/google', passport.authenticate("google", { scope: ["email", "profile", "openid"] }))
app.post('/auth/google/callback', passport.authenticate("google", { session: false }), googleAuth)
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }))
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { session: false}), linkedinAuth)

app.get('/auth/twitter', passport.authenticate('twitter'))
app.get('/auth/twitter/callback', passport.authenticate('twitter', { session: false }), twitterAuth)

app.get("/auth/facebook", passport.authenticate("facebook"), { scope: ["email", "profile", "openid"] })

app.get("/auth/facebook/callback", passport.authenticate("facebook", { session: false }), facebookAuth)

app.listen(config.port, function() {
  console.log(`Listening http://localhost:${config.port}`);
});