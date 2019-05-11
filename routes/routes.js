//Load the MariaDB getConnection function
const getConnection = require('../dbconfig');

// Load the auth file
const service = require('../services/auth')
const moment = require('moment')

//Tip JavaScript: we can define a function or a variable as
//'name' = 'input' => 'output/action'
//C++ Translation: name(input){ output/action }
const router = app => {

  //When starting the server, validate that the database is accessible
  console.log("Validating connection...");
  try {
    const conn = getConnection()
    conn.end();
  }
  catch (err){
    conn.end()
    console.error("Failed to connect due to error: " + err);
    return;
  }
  console.log("Validation succeed!");

//-----API REQUESTS-------

  // Petición para hacer pruebas con la app
  app.get('/api/prueba', (request, response) => {
    const username = request.body.username
    const password = request.body.password
    response.status(200).send({username, password})
    console.log(username, password)
  })

  app.get('/api/privado', (request, response) => {
    if(!request.headers.authorization){
      return response.status(401).send({
        message: 'No tienes autorizacion'
      })
    }
    header = request.headers.authorization.split(' ')[1]
    console.log(header)
    token = service.decodeToken(request, response)
    return response.status(200).send({
      status: 0,
      usuarioID: token.sub,
    });
  });

  //Display all information from all users (ésta habrá que quitarla, es para pruebas)
  app.get('/api/users', (request, response) => {
    const conn = getConnection()
    conn.query("SELECT * FROM users", (err,res) => {
      if (err) {
        console.error(err);
        return response.status(500).send({
          message: "error intern en el sevidor"
        });
      }
      response.send(res);
      conn.end();
    });
  });

  app.get('/api/', (request, response) => {
    const conn = getConnection()
    conn.end();
    return response.send({
          message: "Welcome to the VSP API!"
    });
  });

  //Log in with a given user and password. Return a token.
  app.post('/api/login', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    if (!username || !password){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection();
    conn.query("SELECT usuarioID FROM usuarios WHERE usuario=? AND pass=?",[username,password],(err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      //username doesn't exist
      if (Object.keys(res).length === 0) {
        console.log(res);
        conn.end();
        return response.status(200).send({
          status: 1,
          message: "credencials incorrectes"
        });
      }

      //valid authentication
      return response.status(200).send({
        status: 0,
        token: service.createToken(res[0]["usuarioID"])
      });
    });
  });

//Sign up a user with the given params in the body
  app.post('/api/signup', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    const name = request.body.name;
    const lastname = request.body.lastname;
    const phone = request.body.phone;
    const email = request.body.email;
    if (!username || !password || !name || !lastname || !phone || !email){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    //Request a new connection
    const conn = getConnection()
    //Already existing username, phone or mail?
    conn.query("SELECT usuario,mail,telefono FROM usuarios WHERE usuario=? OR telefono=? OR mail=?",[username,phone,email],(err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      //Already existing username
      if (!(Object.keys(res).length === 0)) {
        conn.end();
        return response.status(200).send({
          status: 1,
          message: "usuari ja existent"
        });
      }
    });
    //Add the new user
    date = moment().unix()
    admin = 0
    conn.query("INSERT INTO usuarios (nombre,apellidos,telefono,mail,fecha_registro,administrador,usuario,pass) VALUES (?,?,?,?,?,?,?,?)",[name,lastname,phone,email,date,admin,username,password], (err,res) => {
      if (err) {
        console.error(err);
        console.log(err);
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      conn.end();
      return response.send({
        status: 0,
        message: "usuari creat correctament"
      });
    });
  });

//Delete an existing user
  app.delete('/api/remove_user', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    const conn = getConnection()
    conn.query("DELETE FROM usuarios WHERE usuarioID=?",tokenDecoded.sub, (err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        });
      }
      //If no rows were affected, wrong username or password were given
      if (res["affectedRows"] === 0) {
        conn.end();
        return response.status(400).send({
          message: "credencials incorrectes"
        });
      }
      conn.end();
      return response.send({
        message: "usuari eliminat"
      });

    });//end query
    //conn.query("DELETE FROM users WHERE username=?",[username,password], (err,res) => {
  });

};

//Export the router
module.exports = router;
