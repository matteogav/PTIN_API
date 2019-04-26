//Load mariadb module
const mariadb = require('mariadb');

//Set database connection credentials
const config = {
    host: 'localhost',
    user: 'root',
    password: 'toor',
    database: 'prova_api',
};

//Create a MariaDB Pool
const pool = mariadb.createPool(config);

//Export the pool
module.exports = pool;
