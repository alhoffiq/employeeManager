const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'painkiller7',
    database: 'employees_db'
});

connection.connect(function(err) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }
    console.log("connected as id " + connection.threadId);
  });

connection.query('SELECT 1 + 1 AS solution', function (err, res) {
    if (err) throw err;
});

connection.end();