/**
 * ALL REQUIRE STATEMENTS
 */
const express = require('express');
const app = express();
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var cors = require('cors');
const bodyParser = require('body-parser');
// sqlite api
var sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("455app.db");
const axios = require("axios");

var stateKey = 'spotify_auth_state';

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
 var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * SPOTIFY AUTH VARIABLES
 */
var redirectUri = 'http://localhost:8888/callback',
clientId = 'a2bd214fd5d44b278a1625e0f5376057',
clientSecret = '546e170d6d1042eeab670d4f84d233f8';

// LOGIN
app.get('/login', function(req, res) {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email user-top-read';

  const queryParams = querystring.stringify({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state,
    scope: scope,
    show_dialog: true,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

/**
 * CREATE TABLES
 */
db.serialize(() => {
  db.run("DROP TABLE Music");
  db.run("DROP TABLE Users");
  db.run("CREATE TABLE Users (userID, Name)");
  db.run("CREATE TABLE Music (songID,songName,Acousticness,Danceability,Energy,Liveness,Valence,Speechiness,Tempo)");
});

// GET AUTHORIZATION AND USER INFORMATION
app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  const code = req.query.code || null;
  axios({
    method: 'POST',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'accept-encoding': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
  })
    .then(response => {
      if (response.status === 200) {
        const access_token = response.data.access_token;
        const token_type = response.data.token_type;
        const refresh_token = response.data.refresh_token;
      // MAKING REQUEST FOR USER INFORMATION
      axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'accept-encoding': 'application/x-www-form-urlencoded',
          Authorization: `${token_type} ${access_token}`
        }
      })
        .then(response => {
          // INSERT INTO USERS SQL SB
          let userInserts = giveUserInserts(response.data);
          console.log(userInserts);
          db.serialize(() => {
            for (let i = 0; i < userInserts.length; i++) {
              db.run(userInserts[i]);
            }
            db.each("SELECT * FROM Users", (err, row) => {
              console.log(row);
            });
          });
          res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
          // MAKING REQUEST FOR TOP TRACKS
          axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10&offset=0`, {
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              'accept-encoding': 'application/x-www-form-urlencoded',
              Authorization: `${token_type} ${access_token}`
            }
          })
            .then(response => {
              let trackList = response.data.items;
              var trackIds = [];
              for(var i = 0; i < response.data.limit; i++){
                var arr = trackList[i].uri.split(":");
                trackIds.push(arr[arr.length-1]);
              }
              // GETS STRING COMBINING ALL TRACKS
              var ids = "";
              for(var i = 0; i < trackIds.length-2; i++){
                ids += trackIds[i] + "%";
              }
              ids+=trackIds[trackIds.length-1];
              // MAKING REQUEST FOR TRACK AUDIO FEATURES
              axios.get(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
                headers: {
                  'content-type': 'application/x-www-form-urlencoded',
                  'accept-encoding': 'application/x-www-form-urlencoded',
                  Authorization: `${token_type} ${access_token}`
                }
              })
              .then(response => {
                // INSERT INTO MUSIC SQL DB
                let musicInserts = giveMusicInserts(trackList, response.data.audio_features);
                db.serialize(() => {
                  for(var i=0; i<musicInserts.length; i++){
                    db.run(musicInserts[i]);
                  }
                  db.each("SELECT * FROM Music", (err, row) => {
                    console.log(row);
                  });
                  db.close();
                });
              })
            });
        })
        .catch(error => {
          res.send(error);
        });
      } else {
        res.send(response);
      }
    })
    .catch(error => {
      res.send(error);
    });
});

// MAKES MUSIC INSERTS FOR SQL DB
function giveMusicInserts(trackList, features){
  var statements = [];
  let i = 0;
  features.forEach(index => {
    let songName = trackList[i].name;
    let songID = trackList[i].id;
    let Acousticness = features[i].acousticness;
    let Danceability = features[i].danceability;
    let Energy = features[i].energy;
    let Liveness = features[i].liveness;
    let Valence = features[i].valence;
    let Speechiness = features[i].speechiness;
    let Tempo = features[i].tempo;
    statements.push(`INSERT INTO Music (songID,songName,Acousticness,Danceability,Energy,Liveness,Valence,Speechiness,Tempo) VALUES ('${songID}', '${songName}', '${Acousticness}', '${Danceability}',  '${Energy}', '${Liveness}', '${Valence}', '${Speechiness}', '${Tempo}')`);
    i++;
  })
  return statements;
}
// MAKES USER INSERTS FOR SQL DB
function giveUserInserts(userInfo){
  var statements = []
  let userID = userInfo.id;
  let userName = userInfo.display_name;
  statements.push(`INSERT INTO Users (userID,Name) VALUES ('${userID}', '${userName}')`);
  return statements;
}

var port = 8888;

app.listen(port, function () {
 console.log(`Simlify is running!`);
});