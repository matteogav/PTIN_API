//Load mariadb module
const mariadb = require('mariadb/callback');

//Set database connection credentials
const config = {
    host: 'localhost',
    user: 'apachito',
    password: 'vsp',
    database: 'vilanovasp',
};

function getConnection() {
  return mariadb.createConnection(config);
}


//Export the getConnection function
module.exports = getConnection;
