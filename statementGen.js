var initSqlJs = require("./sql-wasm.js");

initSqlJs().then(function (SQL) {
  console.log("sql.js initialized ");
  const db = new SQL.Database()
  db.run("CREATE TABLE users (id, name, phone, address);");
  db.run(
    `INSERT INTO users (id, name, phone, address)
        VALUES (1, 'John Doe', '+234-907788', '12 Igodan Street, Okitipupa')`)
  var stmt = db.prepare("SELECT * FROM users WHERE id BETWEEN $start AND $end");
  stmt.bind({ $start: 1, $end: 2 });
  while (stmt.step()) {
    var row = stmt.getAsObject();
    console.log("Here is a user row: " + JSON.stringify(row));
  }
  
});