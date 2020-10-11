'use strict'

const express = require('express')
const session = require('express-session')
const { setegid } = require('process')

const app = express()

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: "keyboard cat"
}))


const list = (req, res) => {
  req.session.count = req.session.count ? req.session.count + 1 : 1
  res.status(200).json({
    hello: 'world',
    count: req.session.count
  })
}

const listen = () => {
  console.log('Listen on port 3000')
}

app.get('/', list)
app.listen(3000, listen)