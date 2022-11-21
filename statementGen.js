var initSqlJs = require("./sql-wasm.js");
/*Thinking we have the user download the two DB files and then supply them 
*/
initSqlJs().then(function (SQL) {
  console.log("sql.js initialized ");
  const db = new SQL.Database()
  db.run("CREATE TABLE topTrackWeek (id, songName, artistName, genre, streams);");
  db.run(
    `INSERT INTO topTrackWeek (id, songName, artistName, genre, streams)
        VALUES (1, 'sad song', 'sad guy', 'Acoustic', 200)`);
  db.run("CREATE TABLE otherUserTopTrackWeek (id, songName, artistName, genre, streams);");
  db.run(
    `INSERT INTO otherUserTopTrackWeek (id, songName, artistName, genre, streams)
        VALUES (2, 'happy song', 'happy guy', 'Acoustic', 200)`)				
  const db2 = new SQL.Database()
  db2.run("CREATE TABLE topTrackWeek (id, songName, artistName, genre, streams);");
  db2.run(
    `INSERT INTO topTrackWeek (id, songName, artistName, genre, streams)
        VALUES (1, 'happy song', 'happy guy', 'Acoustic', 200)`)		
  var stmt = db.prepare("SELECT * FROM topTrackWeek NATURAL JOIN otherUserTopTrackWeek WHERE id BETWEEN $start AND $end");
  stmt.bind({ $start: 1, $end: 2 });
  while (stmt.step()) {
    var row = stmt.getAsObject();
    console.log("Here is a sample row from DB1: " + JSON.stringify(row));
  }
  var stmt2 = db2.prepare("SELECT * FROM topTrackWeek WHERE id BETWEEN $start AND $end");
  stmt2.bind({ $start: 1, $end: 2 });
  while (stmt2.step()) {
    var row = stmt2.getAsObject();
    console.log("Here is a sample row from DB2: " + JSON.stringify(row));
  }
  
  
  
});