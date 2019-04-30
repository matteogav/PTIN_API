//Load the MariaDB getConnection function
const getConnection = require('../dbconfig');

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

  //Display all information from user with the given id
  app.get('/api/users/:id', (request, response) => {
    const id = request.params.id;
    const conn = getConnection()
    conn.query("SELECT * FROM users WHERE id=?",id, (err,res) => {
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

  //Log in with a given user and password. Return a token.
  app.post('/api/login', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    const conn = getConnection();
    conn.query("SELECT username FROM users WHERE username=? AND password=?",[username,password],(err,res) => {
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
        return response.status(400).send({
          message: "credencials incorrectes"
        });
      }
      //valid authentication
      return response.send({
        token: "f709kmk3e289dl.723djd37ptinjdfkslnckjsh.dsuysk34747"
      });
    });
  });

  //Sign up a user with the given params in the body
  app.post('/api/signup', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    const dni = request.body.dni;
    const name = request.body.name;
    const lastname = request.body.lastname;
    const phone = request.body.phone;
    const email = request.body.email;
    if (!username || !password || !dni || !name || !lastname || !phone || !email){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    //Request a new connection
    const conn = getConnection()
    //Already existing username?
    conn.query("SELECT username FROM users WHERE username=?",username,(err,res) => {
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
        return response.status(400).send({
          message: "usuari ja existent"
        });
      }
    });
    //Add the new user
    conn.query("INSERT INTO users (username,password,dni,name,lastname,phone,email) VALUES (?,?,?,?,?,?,?)",[username,password,dni,name,lastname,phone,email], (err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      conn.end();
      return response.send({
        message: "usuari creat correctament"
      });
    });
  });

  //Delete an existing user
  app.delete('/api/remove_user', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    const conn = getConnection()
    conn.query("DELETE FROM users WHERE username=? AND password=?",[username,password], (err,res) => {
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
