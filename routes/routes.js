//Load the MariaDB pool connection
const pool = require('../dbconfig');

//Tip JavaScript: we can define a function or a variable as
//'name' = 'input' => 'output/action'
//C++ Translation: name(input){ output/action }
const router = app => {

  //When starting the server, validate that the database is accessible
  console.log("Validating connection...");
  pool.getConnection()
  .then(conn => {
    console.log("Validation succeed!");
    conn.end();
  })
  .catch(err => {
    console.log("Failed to connect due to error: " + err);
  });

  //For now, unspecified
  app.get('/',(request,response) => {
    console.log('Han sol·licitat /');
    response.send({
      message: 'Node.js JAN and Express REST API'
    });
  });

  //Display static users (see variable 'users' below)
  app.get('/users-static', (request, response) => {
    response.send(usersstatic);
  });

  //Display all information from all users (ésta habrá que quitarla, es para pruebas)
  app.get('/users', (request, response) => {
    pool.getConnection()
      .then( conn => {
        conn.query("SELECT * FROM users")
          .then( users => {
            response.send(users);
            conn.end();
          });
      })
      .catch( err => {
        console.log(err);
        conn.end();
      })
  });

  //Display all information from user with the given id
  app.get('/users/:id', (request, response) => {
    const id = request.params.id;
    pool.getConnection()
      .then( conn => {
        conn.query("SELECT * FROM users WHERE id=?",id)
          .then( users => {
            response.send(users);
            conn.end();
          });
      })
      .catch( err => {
        console.log(err);
        conn.end();
      })
  });

};

//Export the router
module.exports = router;

const usersstatic = [{
    id: 1,
    nom: "Aris Guillén",
    email: "arisguillen@example.com",
  },
  {
    id: 2,
    nom: "Míriam Martínez",
    email: "miriammartinez@upc.edu",
  },
  {
    id: 3,
    nom: "Matteo Gavirati",
    email: "matteogavirati@estudiant.upc.edu"
  },
  {
    id: 4,
    nom: "Jan Rodríguez",
    email: "janrodriguez@example.com",
  },
  {
    id: 5,
    nom: "Jesús Romero",
    email: "jesusromero@epsevg.upc.edu"
  },
];
