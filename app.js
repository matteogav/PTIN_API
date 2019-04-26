//Require packages and set the port
//require('...') serveix tant per mòduls com per fitxers
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/routes.js');
const port = 3002;
const app = express();

//Use Node.js body parsing middleware
//Tot el que arriba (peticions HTTP) el fem passar per aquest middleware
//convertint-ho automàticament en un json molt més còmode.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

routes(app);


//Start the server
const server=app.listen(port,(error)=>{
  if(error) return console.log(`Error: ${error}`);
  console.log(`Server listening on port ${server.address().port}`);
});
