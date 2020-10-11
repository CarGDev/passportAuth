'use strict'

const boom = require('@hapi/boom')

const scopesValidationHandler = (allowedScopes) => {
  return (req, res, next) => {
    if(!req.user || (req.user && !req.user.scopes)) {
      next(boom.unauthorized('Missing scopes'))
    }

    const permissions = allowedScopes.map(allowedScope => req.user.scopes.includes(allowedScope))
    // .find(allowed => Boolean(allowed))
    const hasAccess = !permissions.includes(false)
    if (hasAccess) {
      next()
    } else {
      next(boom.unauthorized('Insufficient scopes'))
    }
  }
}

module.exports = scopesValidationHandler
