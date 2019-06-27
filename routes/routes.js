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
    conn.query("SELECT usuarioID FROM usuarios WHERE usuario=? AND AES_DECRYPT(UNHEX(pass),'funcionaplis')=?",[username,password],(err,res) => {
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
      conn.end();
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
          message: "usuari, email o telefon ja existent"
        });
      }
    });
    //Add the new user
    admin = 0
    conn.query("INSERT INTO usuarios (nombre,apellidos,telefono,mail,fecha_registro,administrador,usuario,pass) VALUES (?,?,?,?,NOW(),?,?,HEX(AES_ENCRYPT(?,'funcionaplis')))",[name,lastname,phone,email,admin,username,password], (err,res) => {
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
    const matricula = request.body.matricula
    const parkingID = request.body.parkingID
    const hora_entrada = request.body.hora_entrada
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
    conn.query("SELECT matricula from reserva WHERE matricula = ? AND parkingID=? AND hora_entrada=?", [matricula, parkingID, hora_entrada], (err, res) => {
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
          message: "ja existeix reserva amb aquesta matricula, parking i dia i hora"
        })
      }
    })
    //Comprovacio places lliures en el parking
    conn.query("SELECT lliures>0 FROM (SELECT p.places-r.reserves lliures FROM (select parkingID,count(*) reserves from reserva where parkingID=?) as r, (select parkingID,count(*) places from plazas where parkingID=?) as p) AS tmp",[parkingID,parkingID], (err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        });
      }
      //Si no hi ha places lliures
      if (res[0]["lliures"] === 0){
        conn.end();
        return response.status(200).send({
          status: 1,
          message: "no hi ha places disponibles"
        });
      }
      //Reserva una placa
      conn.query("INSERT INTO reserva (parkingID, matricula, hora_entrada) VALUES (?,?,?)",[parkingID, matricula, hora_entrada], (err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        });
      }
      conn.end();
      return response.send({
        status: 0,
        message: "reserva realitzada correctament",
      });
    });
    });
  });

  //Obtenir totes les reserves de l'usuari
  app.get('/api/obtenir-reserves-usuari', (request, response) => {
    const tokenDecoded = service.decodeToken(request, response)
    const conn = getConnection()
    conn.query("SELECT * FROM reserva r, coches c WHERE r.matricula = c.matricula AND c.usuarioID = ?", tokenDecoded.sub, (err, res) => {
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
        message: "no tens cap reserva"
        })
      }
      conn.end();
      return response.status(200).send({
      	status: 0,
	res
      })
    })
  })

  //Eliminar reserva d'un usuari donada una matricula i el se usuariID 
  app.delete('/api/eliminar-reserva-usuari', (request, response) => {
    const tokenDecoded = service.decodeToken(request, response)
    const matricula = request.body.matricula
    const conn = getConnection()
    if(!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      })
    }
    conn.query("SELECT matricula FROM coches WHERE usuarioID = ? AND matricula = ?", [tokenDecoded.sub, matricula], (err, res) => {
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
        message: "no tens cap cotxe amb aquesta matricula enregistrat"
        })
      }
      //Si l'usuari te un cotxe amb aquesta matricula borrem la reserva
      conn.query("DELETE FROM reserva WHERE matricula = ?", matricula, (err, res) => {
       if(err){
         console.error(err);
         conn.end();
         return response.status(500).send({
           message: "error intern en el servidor"
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
         message: "reserva eliminada correctament"
       })
      })
    })
  })


  //Obtenir configuracio de l'usuari 
  app.get('/api/obtenir-configuracio-usuari', (request, response) => {
    const tokenDecoded = service.decodeToken(request, response)
    const conn = getConnection()
    conn.query("SELECT nombre, apellidos, usuario, telefono, mail FROM usuarios WHERE usuarioID = ?", tokenDecoded.sub, (err, res) => {
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
        message: "no existeix cap usuario amb aquest identificador"
        })
      }
      return response.status(200).send({
        status: 0,
        res
      })
    })
  })

  //Actualitzar parametres de configuracio
  app.post('/api/actualitzar-configuracio-usuari', (request, response) => {
    const tokenDecoded = service.decodeToken(request, response)
    console.log(tokenDecoded)
    const nombre = request.body.nombre
    const apellidos = request.body.apellidos
    const usuario = request.body.usuario
    const telefono = request.body.telefono
    const mail = request.body.mail
    const conn = getConnection()
    if(!nombre || !apellidos || !usuario || !telefono || !mail){
       return response.status(400).send({
         message: "existeixen camps obligatoris buits"
       })
     }
    conn.query("UPDATE usuarios SET nombre = ?, apellidos = ?, usuario = ?, telefono = ?, mail = ? WHERE usuarioID = ?", [nombre, apellidos, usuario, telefono, mail, tokenDecoded.sub], (err, res) => {
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
        message: "Les dades s'han actualitzat be"
      })
    })
  })


  //Actualitzar parametre puede_calcular de cotxes
  app.post('/api/actualitzar-cesio-computacio', (request, response) => {
    const tokenDecoded = service.decodeToken(request, response)
    const matricula = request.body.matricula
    const puede_calcular = request.body.puede_calcular
    //Comprova si la matricula es del usuari donat
    conn.query("SELECT matricula FROM coches WHERE matricula = ? AND usuarioID = ?", [matricula, tokenDecoded.sub], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      //L'usuari no te cap cotxe amb aquesta matricula registrat
      if(Object.keys(res).length === 0){
        conn.end()
        return response.status(200).send({
        status: 1,
        message: "no tens cap cotxe registrat amb aquesta matricula"
        })
      }
      //Fem l'actualitzacio de la cesio de computacio perque la matricula pertany a l'usuari
      conn.query("UPDATE coches SET puede_calcular = ? WHERE matricula = ?", [puede_calcular, matricula], (err, res) => {
        if(err){
          console.error(err)
          conn.end()
          return response.status(500).send({
            message: "error intern del servidor"
          })
        }
        if(res["affectedRows"] === 0){
          conn.end()
          return response.status(200).send({
            status: 1,
            message: "dades incorrectes"
          })
        }
        return response.status(200).send({
          status: 0,
          message: "Actualització realitzada correctament"
        })
      })
    })
  })


  //Obtenir informació sobre els cotxes d'un usuari donat (matricula, marca, modelo)
  app.get('/api/informacio-cotxes-usuari', (request, response) => {
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
        message: "no tens cap cotxe registrat"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        res
      })
    })
  })

  //Afegir un cotxe a un usuari

  app.post('/api/afegir-cotxe-usuari', (request, response) => {
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

    //Comprovacio de que el cotxe que vol afegir l'usuari no el te ja a la base de dades
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
	  message: "cotxe ja enregistrat"
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
      conn.end();
      return response.status(200).send({
        status: 0,
        message: "cotxe introduit correctament"
      })
    })
  })

  //Eliminar cotxe d'un usuari
  app.delete('/api/eliminar-cotxe-usuari', (request, response) => {
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
	message: "cotxe eliminat correctament"
      })
    })
  })

  //Obtenir totes les marcass de cotxe de la bd
  app.post('/api/obtenir-models', (request, response) => {
    const marca = request.body.marca
    const conn = getConnection()
    conn.query("SELECT modelo FROM models_coches WHERE marca=?", marca,(err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        res
      })
    })
  })

  //Obtenir tots els models de cotxe d'una marca donada de la bd
  app.get('/api/obtenir-marcas', (request, response) => {
    const conn = getConnection()
    conn.query("SELECT distinct marca FROM models_coches", (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        res,
      })
    })
  })

  //Obtenir informacio sobre les estancies dels cotxes d'un usuari donat (matricula, parking.nom)
  app.get('/api/estancies-cotxes-usuari', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    const conn = getConnection()
    conn.query("SELECT pk.direccion, pz.matricula FROM parkings pk, plazas pz WHERE pz.parkingID=pk.parkingID AND matricula IN (SELECT matricula FROM coches WHERE usuarioID=?)", tokenDecoded.sub, (err, res) => {
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
        message: "no tens cap cotxe als VSPs"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        res
      })
    })
  })


  // Pagament, cal generar un string encriptat amb la informacio necessaria per efectuar el pagament
  app.post('/api/obtenir-pagament', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    const matricula = request.body.matricula
    if(!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      })
    }

    const conn = getConnection()
    //Comprova que el cotxe es de l'usuari
    conn.query("SELECT matricula FROM coches WHERE matricula = ? AND usuarioID = ?", [matricula, tokenDecoded.sub], (err, res) => {
      if(err){
	console.error(err)
	conn.end()
	return response.status(500).send({
	  message: "error intern del servidor"
        })
      }
      if(Object.keys(res).length === 0){
        console.log(res)
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
    // Comprova que el cotxe esta en un parking
    conn.query("SELECT matricula FROM plazas WHERE matricula = ?", matricula, (err, res) => {
      if(err){
	console.error(err)
	conn.end()
	return response.status(500).send({
	  message: "error intern del servidor"
        })
      }
      if(Object.keys(res).length === 0){
        console.log(res)
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
    conn.end()
    // Si les dades son correctes, genera un string encriptat
    const qr = service.createQR(matricula)
    return response.status(200).send({
      status: 0,
      qr: qr,
    })
    })
    })
  })



  //-----INFRAESTRUCTURA REQUESTS----//

  //Comprovar l'estat del coche (0,1,2) donada una matricula 
  app.get('/api/comprovar-usuari-cotxe', (request, response) => {
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
      conn.end();
      return response.status(200).send({
        status: 0
      })
    })
  })

 //Comprovar si un coche te una reserva a un parking especific donada la matricula i el parkingID
 app.get('/api/comprovar-reserva-cotxe', (request, response) => {
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
      conn.end();
      return response.status(200).send({
        status: 0,
        message: "Hi ha un reserva per aquesta matricula"
      })
    //Descomentar si es vol aplicar un marge i comentar la query anterior
/*    conn.query("SELECT hora_entrada<(NOW()+INTERVAL 10 MINUTE) pot FROM reserva WHERE matricula=?",[matricula,parkingID], (err2,res2) => {
      if (err)
      if (object.keys)
      if (res["pot"] === 1)
      hi ha reserva
*/
    })
  })

  //Actualitzar els recursos del parking
  app.post('/api/actualitzar-recursos-parking', (request, response) => {
    const clockRate = request.body.clockRate
    const cpuCores = request.body.cpuCores
    const ramAvailable = request.body.ramAvailable
    const ramUsed = request.body.ramUsed
    const hddSpaceAvailable = request.body.hddSpaceAvailable
    const hddSpaceUsed = request.body.hddSpaceUsed
    const parkingID = request.body.parkingID

    const conn = getConnection()
    conn.query('UPDATE recursos SET clockRate = ?, cpuCores = ?, ramAvailable = ?, ramUsed = ?, hddSpaceAvailable = ?, hddSpaceUsed = ? WHERE parkingID = ?', [clockRate, cpuCores, ramAvailable, ramUsed, hddSpaceAvailable, hddSpaceUsed, parkingID], (err, res) => {
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
  //Precondicio: el parking ha cridat a comprovar-reserva i s'ha assegurat que te reserva
  app.post('/api/introduir-cotxe-parking', (request, response) => {
    const matricula = request.body.matricula
    const parkingID = request.body.parkingID
    if (!matricula){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
    //Intentem donar-li una placa al cotxe, indicant el tipus de tarifa segons si pot computar o no
    conn.query("UPDATE plazas SET estado = 1, matricula = ?, hora_inicio = NOW(), pagado = 0, tipo_tarifa = (SELECT IF(puede_calcular=1,'hora_comp_setm','hora_sense_comp_setm') FROM coches WHERE matricula = ?) WHERE estado = 0 AND parkingID = ? LIMIT 1", [matricula, matricula, parkingID] , (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      //se suposa que mai s'hauria d'entrar a aquest if
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "no hi ha places lliures"
        })
      }
      //Obtenim la plazaID donada
      conn.query("SELECT plazaID FROM plazas WHERE matricula = ?", matricula, (err, res) => {
        if(err){
	  console.error(err)
          conn.end()
	  return response.status(500).send({ message: "error intern del servidor"})
	}
        //Eliminem la seva reserva
        conn.query("DELETE FROM reserva WHERE matricula=?",matricula, (err, res2) => {
          if(err){
            console.error(err)
            conn.end()
            return response.status(500).send({ message: "error intern del servidor"})
	  }
          const plazaID = res[0]["plazaID"];
          conn.end();
          return response.status(200).send({status: 0, plazaID})
        })//fi query DELETE
      })//fi query select
    })// fi query update
  })

  //El cotxe surt del parking, se'ns dona la matricula llegida al lector i el QR llegit pel lector (string encriptat)
  app.post('/api/sortida-cotxe-parking', (request, response) => {
    const matricula = request.body.matricula
    const qr = request.body.qr
    if (!matricula || !qr){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    // Desencriptem el QR (mirem que no hagi expirat)
    const decodedQR = service.decodeQR(request, response)
    if (!(matricula === decodedQR.mat)){
      return response.status(200).send({
        status: 1,
        message: "QR i matricula no coincidents"
      });
    }
    // Si esta tot be, intentem calcular import de l'estancia en base a si computa o no
    const conn = getConnection()
    let _import = 0.0
    conn.query("SELECT FORMAT(res.precio*(TIME_TO_SEC(TIMEDIFF(NOW(),res.hora_inicio))/3600),2) AS import FROM (SELECT p.hora_inicio, t.precio FROM plazas p, tarifa t WHERE p.matricula= ? AND t.tipo=p.tipo_tarifa) AS res", matricula, (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(Object.keys(res).length === 0){
        console.log(res)
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      _import = res[0]["import"]
      //Intentem restar l'import del seu saldo
      conn.query("UPDATE usuarios u, coches c SET u.saldo=(u.saldo - ?) WHERE c.usuarioID = u.usuarioID AND c.matricula= ?", [_import,matricula], (err, res) => {
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
        //Intentem treure el cotxe del parking, deixant la plaza lliure
        conn.query("UPDATE plazas SET estado=0, matricula=NULL, hora_inicio=NULL,pagado=NULL,tipo_tarifa=NULL WHERE matricula= ?", [matricula], (err, res) => {
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
          conn.end();
          return response.status(200).send({
            status: 0,
            import: _import,
          })
        })
      })//fi query update usuarios
    })//fi query select import
  })

  //Comprovar l'estat del cotxe (0,1,2) donada una matricula
  app.get('/api/comprovar-estat-cotxe', (request, response) => {
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
      conn.end();
      return response.status(200).send({
	status: 0,
        estat_coche
      })
    })
  })

  //Actualitzar estat UsuariParking. Actualitza l'estat depenent de si esta computant o lliure.
  app.post('/api/actualitzar-estat-cotxe', (request, response) => {
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
        conn.end();
        return response.status(200).send({
          status: 0,
          message: "L'usuari ha efectuat el pagament"
      	})
      }
      else {
        conn.end();
	return response.status(200).send({ status: 1, message: "L'usuari no ha efectuat el pagament"})
      }
    })
  })

};

//Export the router
module.exports = router;
