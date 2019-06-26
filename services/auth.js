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
  var bearer = request.headers.authorization.split(' ')[0]
  var token = request.headers.authorization.split(' ')[1]
  if(token === "" || bearer !=="Bearer"){
    return response.status(403).send({message: 'No tienes autorizacion'})
  }
  // Comprovar en la base de datos si el usuario del token es valido 
  try {
    var tokenDecoded = jwt.decode(token, config.SECRET_TOKEN)
  }
  catch {
    //if(tokenDecoded.exp <= moment().unix()){
    return response.status(401).send({ message: 'token erroneo'})
  }

  return tokenDecoded

}

function createQR (matricula) {
  const payload = {
    mat: matricula,
    // El temps d'expiracio, des de que l'usuari solicita el QR fins que es valid (quan el posa al lector)
    exp: moment().add(10, 'minutes').unix()
  }
  return jwt.encode(payload, config.SECRET_TOKEN)
}

function decodeQR(request,response){
  try {
    var QRDecoded = jwt.decode(request.body.qr, config.SECRET_TOKEN)
    // Comprovar que no hagi expirat
    if(QRDecoded.exp <= moment().unix()){
      return response.status(200).send({
        status: 1,
        message: 'el QR ha expirat',
      })
    }
  }
  catch {
      return response.status(200).send({
        status: 1,
        message: 'QR erroni',
      })
  }
  return QRDecoded;
}

module.exports = {
  createToken,
  decodeToken,
  createQR,
  decodeQR,
}

