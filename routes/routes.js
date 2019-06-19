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

  // Peticion de prueba
  app.post('/api/prueba2', (request, response) =>{
     const username = request.body.username
     response.status(200).send({message: "Hola"})
  })


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
//    const marca = request.body.marca
//    const modelo = request.body.modelo
//    const matricula = request.body.matricula
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
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      conn.end();
      return response.status(201).send({
        status: 0,
        message: "usuari creat correctament"
      });
    });
/* Aqui empieza lo nuevo
    console.log(marca)
console.log(modelo)
console.log(matricula)
    if(marca.length !== 0 && modelo.length !== 0 && matricula !== 0){
       conn.query("SELECT usuarioID from usuarios where usuario = ?", username, (err, res) =>{
	if (err) {
       	   console.error(err);
           conn.end();
           return response.status(500).send({
             message: "error intern en el servidor"
           });
         }
	usuarioID = res[0]["usuarioID"]
        console.log(usuarioID)
	// Comprovamos que esa matricula no esta en la bd
	conn.query("SELECT matricula FROM coches WHERE matricula = ?", matricula, (err, res) => {
      	  if(err){
            console.error(err)
            conn.end()
            return response.status(500).send({
              message: "error intern del servidor"
            })
          }  
          if(!(Object.keys(res).length === 0)){
            conn.end()
            return response.status(200).send({
            status: 1,
            message: "coche ja enregistrat"
            })
          }
        })
       // Introducimos el coche si no esta ya
       conn.query("INSERT INTO coches (matricula, usuarioID, puede_calcular, marca, modelo) VALUES (?,?,0,?,?)", [matricula, usuarioID, marca, modelo], (err, res) => {
         if(err){
           console.error(err)
           conn.end()
           return response.status(500).send({
             message: "error intern del servidor"
           })
         }
         console.log(res)
         return response.status(200).send({
           status: 0,
           message: "Coche introduit correctament"
         })
       })

     })
     }*/
		console.log("hola")
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
    parkingID = request.body.parkingID
    if (!matricula || !parkingID){
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
          conn.end()
          return response.status(200).send({
            status: 1,
            message: "dades incorrectes"
          })
      }
    });
    // Comprovació existeix reserva
      conn.query("SELECT * from reserva WHERE matricula = ? AND parkingID = ?", [matricula, parkingID], (err, res) => {
        if(err){
          console.error(err);
          conn.end();
          return response.status(500).send({
            message: "error intern en el servidor"
          });
        }
        if(!(Object.keys(res).length === 0)){
          conn.end()
          return response.status(200).send({
            status: 1,
            message: "existeix reserva amb aquesta matricula i en aquest parking"
          })
        }
      })
    //Reserva una plaza
    conn.query("INSERT INTO reserva (parkingID, matricula, hora_entrada) values (?,?, NOW())",[parkingID, matricula], (err,res) => {
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
        message: "reserva realitzada correctament",
      });

    });
  });
  
  //Obtenir informació sobre els coches d'un usuari donat (matricula, marca, modelo)
  app.get('/api/informacio-coches-usuari', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    const conn = getConnection()
    conn.query("SELECT matricula, marca, modelo FROM coches WHERE usuarioID = ?", tokenDecoded.sub, (err, res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        })
      }
      if(Object.keys(res).length === 0){
        conn.end()
        return response.status(200).send({
        status: 1,
        message: "no tens cap coche registrat"
        })
      }
      return response.status(200).send({
        status: 0,
        res
      })
    })
  })

  //Afegir un coche a un usuari

  app.post('/api/afegir-coche-usuari', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    matricula = request.body.matricula
    puede_calcular = request.body.puede_calcular
    marca = request.body.marca
    modelo = request.body.modelo

    if(!matricula || !puede_calcular || !marca || !modelo){
       return response.status(400).send({
         message: "existeixen camps obligatoris buits"
       })
     }
    //Establim connexió
    const conn = getConnection()

    //Comprovació de que el coche que vol introduir l'usuari no el te ja a la base de dades
    conn.query("SELECT matricula FROM coches WHERE matricula = ?", matricula, (err, res) => {
      if(err){
	console.error(err)
	conn.end()
	return response.status(500).send({
	  message: "error intern del servidor"
	})
      }
      if(!(Object.keys(res).length === 0)){
	conn.end()
	return response.status(200).send({
	  status: 1,
	  message: "coche ja enregistrat"
	})
      }
    })

    conn.query("INSERT INTO coches (matricula, usuarioID, puede_calcular, marca, modelo) VALUES (?,?,?,?,?)", [matricula, tokenDecoded.sub, puede_calcular, marca, modelo], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }/*
      if(res["affectedRows"] === 0){
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }*/
      return response.status(200).send({
        status: 0,
        message: "Coche introduit correctament"
      })
    })
  })

  //Eliminar coche d'un usuari
  app.delete('/api/eliminar-coche-usuari', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    const matricula = request.body.matricula
    if(!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      })
    }

    const conn = getConnection()
    conn.query("DELETE FROM coches WHERE matricula = ? AND usuarioID = ?", [matricula, tokenDecoded.sub], (err, res) => {
      if(err){
	console.error(err)
	conn.end()
	return response.status(500).send({
	  message: "error intern del servidor"
        })
      }
      // Matricula introduida es erronea
      if(res["affectedRows"] === 0){
        conn.end()
	return response.status(200).send({
	  status: 1,
	  message: "matricula introduida no valida"
	})
      }
      conn.end()
      return response.status(200).send({
	status: 0,
	message: "coche eliminat correctament"
      })
    })
  })



  //-----INFRAESTRUCTURA REQUESTS----//

  //Comprovar l'estat del coche (0,1,2) donada una matricula 
  app.get('/api/comprovar-usuari-coche', (request, response) => {
    const matricula = request.body.matricula
    const usuarioID = request.body.usuarioID
    const conn = getConnection()
    conn.query('SELECT * FROM coches WHERE matricula = ? AND usuarioID = ?', [matricula, usuarioID], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
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
        status: 0
      })
    })
  })

 //Comprovar si un coche te una reserva a un parking especific donada la matricula i el parkingID
 app.get('/api/comprovar-reserva-coche', (request, response) => {
    const matricula = request.body.matricula
    const parkingID = request.body.parkingID
    const conn = getConnection()
    conn.query('SELECT * FROM reserva WHERE matricula = ? AND parkingID = ?', [matricula, parkingID], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
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
        message: "Hi ha un reserva per aquesta matricula"
      }) 
    })
  })

  //Actualitzar els recursos del parking 
  app.post('/api/actualitzar-recursos-parking', (request, response) => {
    const clockRate = request.body.clockRate
    const cpuCores = request.body.cpuCores
    const ram = request.body.ram
    const hddSpace = request.body.hddSpace
    const parkingID = request.body.parkingID
    
    const conn = getConnection()
    conn.query('UPDATE recursos SET clockRate = ?, cpuCores = ?, ram = ?, hddSpace = ? WHERE parkingID = ?', [clockRate, cpuCores, ram, hddSpace, parkingID], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(400).send({
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "S'ha actualitzat be"
      })
    })
  })

 //Introduir coche a un parking donat un parkingID
  app.post('/api/introduir-coche-parking', (request, response) => {
    const matricula = request.body.matricula
    const parkingID = request.body.parkingID
    if (!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado = 1, parkingID = ?, matricula = ?, hora_inicio = NOW(), pagado = 0 WHERE estado = 0 LIMIT 1", [parkingID, matricula] , (err, res) => {
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
      conn.query("SELECT plazaID FROM plazas WHERE matricula = ?", matricula, (err, res) => {
        if(err){
	  console.error(err)
          conn.end()
	  return response.status(500).send({ message: "error intern del servidor"})
	}
        plazaID = res[0]["plazaID"]
	return response.status(200).send({status: 0, plazaID})
      })

     /* conn.end()
      return response.status(200).send({
        status: 0,
        message: "S'ha introduit be"
      })*/
    })
  })

  //Aclarar esta peticion con el grupo de infra
  app.post('/api/eliminar-coche-parking', (request, response) => {
    const matricula = request.body.matricula
    if (!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado = 0, matricula = 0, hora_inicio = NOW(), pagado = 0 WHERE matricula = ?", matricula, (err, res) => {
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

  //Comprovar l'estat del coche (0,1,2) donada una matricula 
  app.get('/api/comprovar-estat-coche', (request, response) => {
    const matricula = request.body.matricula
    const conn = getConnection()
    conn.query('SELECT estado_coche FROM coches WHERE matricula = ?', matricula, (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
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
      estat_coche = res[0]["estado_coche"]
      return response.status(200).send({
	status: 0,
        estat_coche
      })
    })
  })

  //Actualitzar estat UsuariParking. Actualitza l'estat depenent de si esta computant o lliure.
  app.post('/api/actualitzar-estat-coche', (request, response) => {
    const estado_coche = request.body.estado_coche
    const matricula = request.body.matricula
    if (!matricula || !estado_coche){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    conn.query("UPDATE coches SET estado_coche = ? where matricula = ?", [estado_coche, matricula], (err, res) => {
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
  
  //Comprovar que un usuari donada una matricula ha pagat la plaça de parking
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
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      if(res[0]["pagado"] === 1){
     	 return response.status(200).send({
           status: 0,
           message: "L'usuari ha efectuat el pagament"
      	 })
      }
      else {
	return response.status(200).send({ status: 1, message: "L'usuari no ha efectuat el pagament"})
      }
    })
  })

  //Genera la factura per a la sortida del cotxe, donat una matricula
  app.post('/api/generar-factura', (request, response) => {
    const matricula = request.body.matricula
    const conn = getConnection()
    conn.query("SELECT matricula, marca, modelo FROM coches WHERE usuarioID = ?", tokenDecoded.sub, (err, res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        })
      }
      if(Object.keys(res).length === 0){
        conn.end()
        return response.status(200).send({
        status: 1,
        message: "no tens cap coche registrat"
        })
      }
      return response.status(200).send({
        status: 0,
        res
      })
    })
  })


};

//Export the router
module.exports = router;
