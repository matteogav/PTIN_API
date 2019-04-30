//Load mariadb module
const mariadb = require('mariadb/callback');

//Set database connection credentials
const config = {
    host: 'localhost',
    user: 'root',
    password: 'toor',
    database: 'prova_api',
};

function getConnection() {
  return mariadb.createConnection(config);
}


//Export the configuration
module.exports = getConnection;
//module.exports = mariadb;

//Create a MariaDB Pool
//const pool = mariadb.createPool(config);

//Export the pool
//module.exports = pool;
