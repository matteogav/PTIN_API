'use strict'

const jwt = require('jwt-simple')
const moment = require('moment')
const config = require('../config')

function createToken (usuarioID) {
  const payload = {
    sub: usuarioID,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  }

  return jwt.encode(payload, config.SECRET_TOKEN)
}

function decodeToken(request, response){
  if(!request.headers.authorization){
    return response.status(403).send({message: 'No tienes autorizacion'})
  }
  var token = request.headers.authorization.split(' ')[1]
  var tokenDecoded = jwt.decode(token, config.SECRET_TOKEN)

  if(tokenDecoded.exp <= moment().unix()){
    return response.status(401).send({ message: 'El token ha expirado'})
  }

  return tokenDecoded
}


module.exports = {
  createToken,
  decodeToken,
}

