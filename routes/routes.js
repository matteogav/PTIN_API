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
    conn.query("SELECT * FROM usuarios", (err,res) => {
      if (err) {
        console.error(err);
        return response.status(500).send({
          message: "error intern en el sevidor"
        });
      }
      console.log(moment().format('YYYY-MM-DD HH:mm:ss'))
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
    admin = 0
    conn.query("INSERT INTO usuarios (nombre,apellidos,telefono,mail,fecha_registro,administrador,usuario,pass) VALUES (?,?,?,?,NOW(),?,?,?)",[name,lastname,phone,email,admin,username,password], (err,res) => {
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
        return response.status(200).send({
          status: 1,
          message: "credencials incorrectes"
        });
      }
      conn.end();
      return response.send({
        status: 0,
        message: "usuari eliminat"
      });
    });
  });


  //Reserva
  app.post('/api/reserva', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    matricula = request.body.matricula
    parking = request.body.parking
    hora = request.body.hora
    if (!matricula || !parking || !hora){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    //Comprobacion coche es de usuario
    conn.query("SELECT * FROM coches WHERE usuarioID=? AND matricula=?",[tokenDecoded.sub,matricula], (err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        });
      }
      if(Object.keys(res).length === 0){
          console.log(res)
          conn.end()
          return response.status(200).send({
            status: 1,
            message: "dades incorrectes"
          })
      }
    });
    //Reserva una plaza aleatoria
    conn.query("UPDATE plazas SET estado=1,matricula=? WHERE estado=0 AND parkingID=? ORDER BY RAND() LIMIT 1",[matricula,parking], (err,res) => {
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
        return response.status(200).send({
          status: 1,
          message: "no hi ha places disponibles"
        });
      }
      conn.end();
      return response.send({
        status: 0,
        message: "numero: ",
        res: res,
      });

    });
  });



  //-----INFRAESTRUCTURA REQUESTS----//

  app.post('/api/introduir-usuari-parking', (request, response) => {
    const matricula = request.body.matricula
    if (!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado = 1, matricula = ?, hora_inicio = NOW(), pagado = 0, estado_coche = (SELECT puede_calcular FROM coches WHERE matricula = ?) WHERE estado = 0 LIMIT 1", [matricula, matricula], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "S'ha introduit be"
      })
    })
  })

  app.post('/api/elimina-usuari-parking', (request, response) => {
    const matricula = request.body.matricula
    if (!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado = 0, matricula = NULL, hora_inicio = NULL, pagado = NULL, estado_coche = NULL WHERE matricula = ?", matricula, (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "S'ha eliminat be"
      })
    })
  })

  //Actualitzar estat UsuariParking. Actualitza l'estat depenent de si esta computant o lliure.
  app.post('/api/actualitzar-estat-usuari', (request, response) => {
    const estado_coche = request.body.estat
    const matricula = request.body.matricula
    if (!matricula || !estat){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado_coche = ? where matricula = ?", [estado_coche, matricula], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern al servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "L'estat s'ha actualitzat be"
      })
    })
  })

  app.get('/api/comprovar-pagament', (request, response) => {
    const matricula = request.body.matricula
    if (!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    conn.query("SELECT pagado FROM plazas WHERE matricula = ?", matricula, (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern al servidor"
        })
      }
      // No existeix cap usuari amb aquesta matricula
      if(Object.keys(res).length === 0){
        console.log(res)
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      return response.status(200).send({
        status: 0,
        message: "L'usuari ha efectuat el pagament"
      })
    })
  })

};

//Export the router
module.exports = router;
