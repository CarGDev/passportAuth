'use strict'

const success = (req, res, data, message, status) => {
  const stat = status || 200
  res.status(stat).json({
    data: data,
    message: message
  })
}

module.exports = {
  success
}