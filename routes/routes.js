//Load the MariaDB pool connection
const pool = require('../dbconfig');

//Tip JavaScript: we can define a function or a variable as
//'name' = 'input' => 'output/action'
//C++ Translation: name(input){ output/action }
const router = app => {

  console.log("Validating connection...");
  pool.getConnection()
  .then(conn => {
    console.log("Connection succeed!");
    conn.end();
  })
  .catch(err => {
    console.log("Failed to connect due to error: " + err);
  });

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

  //Display all users
  app.get('/users', (request, response) => {
    console.log('aaaaaaaaaaaaaaaaaa');
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
