/* ================================================================================
 Name        : Simlify
 Authors     : Seung Park, Ben McAuiffe, Madison Sanchez-Forman, and Mitch Hurley
 Version     : 12.16.22
 Description : Uses the Spotify API to login and authenticate two users. At the 
 login of each user, data is extracted from their account about their individual 
 listening history. We use this data to create 10 vectors corresponding to their
 top 10 most listened to songs for a time period of their chosing, and then use
 cosine similarity to estimate how similar each users music taste is
 ================================================================================ */
 
/* ALL REQUIRE STATEMENTS */
const express = require("express");
const app = express();
var cookieParser = require("cookie-parser");
var querystring = require("querystring");
var cors = require("cors");
const bodyParser = require("body-parser");
var sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("455app.db");
const axios = require("axios");
const { request } = require("http");
const { application } = require("express");
/** setting up express enviornment */
var stateKey = "spotify_auth_state";
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
/** LOCAL VARIABLES */
var temp = [];
var songVector0 = [];
var songVector1 = [];
var songNames0 = [];
var songNames1 = [];
/**** FUNCTIONS USED THROUGHOUT SCRIPT (DB CREATION/POPULATION, VECTOR BUILDING/MANIPULATION) *****/
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
/**
 * Creates and returns a list of insert statements to our music relation based on each users top most listened to songs
 * @param {*} trackList - promise object of tracks
 * @param {*} features - promise object of info about each track
 * @returns Insert statments as list of strings
 */
 function giveMusicInserts(trackList, features) {
  var statements = [];
  let i = 0;
  features.forEach((index) => {
    let songName = trackList[i].name;
    songName = songName.replaceAll('"', "");
    songName = songName.replaceAll("'", "");
    let songID = trackList[i].id;
    let Acousticness = features[i].acousticness;
    let Danceability = features[i].danceability;
    let Energy = features[i].energy;
    let Liveness = features[i].liveness;
    let Valence = features[i].valence;
    let Speechiness = features[i].speechiness;
    let Tempo = features[i].tempo;
    statements.push(
      `INSERT OR IGNORE INTO Music (songID,songName,Acousticness,Danceability,Energy,Liveness,Valence,Speechiness,Tempo) VALUES ('${songID}', '${songName}', '${Acousticness}', '${Danceability}',  '${Energy}', '${Liveness}', '${Valence}', '${Speechiness}', '${Tempo}')`
    );
    i++;
  });
  return statements;
}
/**
 * Creates insert statements for User info
 * @param {*} userInfo promise object of user info
 * @returns insert statments as strings
 */
function giveUserInserts(userInfo) {
  var statements = [];
  let userID = userInfo.id;
  let userName = userInfo.display_name;
  statements.push(
    `INSERT INTO Users (userID,Name) VALUES ('${userID}', '${userName}')`
  );
  return statements;
}
/**
 * Create insert statments for userSongs relation
 * @param {*} userInfo promise object of user info
 * @param {*} trackIDs ids of listened to songs
 * @returns list of insert statements as strings
 */
function getUserSongInserts(userInfo, trackIDs) {
  let statements = [];
  trackIDs.forEach((i) => {
    let userID = userInfo.id;
    let songID = i;
    statements.push(
      `INSERT OR IGNORE INTO userSongs (userID, songID) VALUES ('${userID}', '${songID}')`
    );
  });
  return statements;
}
/**
 * Function to find the magnitude of a vector
 * @param {*} v vector
 * @returns magnitude of v
 */
function vector_magnitude(v) {
  let sum = 0;
  v.forEach((i) => {
    sum += (i * i);
  });
  return Math.sqrt(sum);
}
/**
 * Function to find the dot product of two vectors
 * @param {*} v0 first vector
 * @param {*} v1 second vector
 * @param {*} len length of both vectors (must be the same)
 * @returns dot product of v0 . v1
 */
function dot_product(v0, v1, len) {
  let product = 0;
  for (let i = 0; i < len; i++) {
    product += +v0[i] * v1[i];
  }
  return product;
}
/**
 * Finds the cosine similarity of two vectors
 * @param {*} v0 first vector
 * @param {*} v1 second vector
 * @param {*} len len of both vectors
 */
function cosine_similarity(v0, v1, len) {
  let num = dot_product(v0, v1, len);
  let denom = vector_magnitude(v0) * vector_magnitude(v1);

  if (denom == 0) {
    return "Divison by 0 error";
  }
  return num / denom;
}
/**
 * I wanted a function that will round to the second decimal place in a precise manner
 * @param {*} num num to round
 * @returns rounded number
 */
 function my_round(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
/**
 * Averages the cosine similarity of two lists of vectors
 * @param {*} list0 first list of vectors
 * @param {*} list1 second list of vectors
 * @param {*} size number of vectors given 
 * @param {*} elems number of elemnts per vector
 * @returns
 */
function avg_cosine_similarity(list0, list1, size, elems) {
  let cos = 0;
  for (let i = 0; i < size; i++) {
    cos += cosine_similarity(list0[i], list1[i], elems);
  }
  return my_round(cos/size);
}
/* SPOTIFY AUTHORIZATION VARIABLES */
var redirectUri = "http://localhost:8888/callback",
  clientId = "a2bd214fd5d44b278a1625e0f5376057",
  clientSecret = "546e170d6d1042eeab670d4f84d233f8";

/* LOGIN AND BEGINNING OF SCRIPT */
app.get("/login", function (req, res) {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = "user-read-private user-read-email user-top-read";

  const queryParams = querystring.stringify({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state: state,
    scope: scope,
    show_dialog: true,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

/* LOGOUT AND BEGINNING OF SCRIPT */
app.get("/logout", function (req, res) {
  res.redirect(`https://accounts.spotify.com/en/logout`);
  setTimeout(res.redirect('http://localhost:8888/'), 2000)
});

let user1Name = "";
let songList = [];
/* CREATE TABLES */
db.serialize(() => {
  db.run("DROP TABLE IF EXISTS Music");
  db.run("DROP TABLE IF EXISTS Users");
  db.run("DROP TABLE IF EXISTS userSongs");
  db.run("CREATE TABLE userSongs(userID, songID)");
  db.run("CREATE TABLE Users (userID, Name)");
  db.run(
    "CREATE TABLE Music (songID UNIQUE,songName,Acousticness,Danceability,Energy,Liveness,Valence,Speechiness,Tempo)"
  );
});

/* GET AUTHORIZATION AND USER INFORMATION */
app.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  const code = req.query.code || null;
  axios({
    method: "POST",
    url: "https://accounts.spotify.com/api/token",
    data: querystring.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "accept-encoding": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        const access_token = response.data.access_token;
        const token_type = response.data.token_type;
        const refresh_token = response.data.refresh_token;
        // MAKING REQUEST FOR USER INFORMATION
        axios
          .get("https://api.spotify.com/v1/me", {
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "accept-encoding": "application/x-www-form-urlencoded",
              Authorization: `${token_type} ${access_token}`,
            },
          })
          .then((response) => {
            // INSERT INTO USERS SQL SB
            let userInserts = giveUserInserts(response.data);
            let userInfo = response.data;
            db.serialize(() => {
              for (let i = 0; i < userInserts.length; i++) {
                db.run(userInserts[i]);
              }
            });
            // MAKING REQUEST FOR TOP TRACKS
            axios
              .get(
                `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50&offset=0`,
                {
                  headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    "accept-encoding": "application/x-www-form-urlencoded",
                    Authorization: `${token_type} ${access_token}`,
                  },
                }
              )
              .then((response) => {
                let trackList = response.data.items;
                var trackIds = [];
                for (var i = 0; i < response.data.limit; i++) {
                  var arr = trackList[i].uri.split(":");
                  trackIds.push(arr[arr.length - 1]);
                }
                // GETS STRING COMBINING ALL TRACKS
                var ids = "";
                for (var i = 0; i < trackIds.length - 2; i++) {
                  ids += trackIds[i] + "%";
                }
                ids += trackIds[trackIds.length - 1];
                // MAKING REQUEST FOR TRACK AUDIO FEATURES
                axios
                  .get(
                    `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
                    {
                      headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        "accept-encoding": "application/x-www-form-urlencoded",
                        Authorization: `${token_type} ${access_token}`,
                      },
                    }
                  )
                  .then((response) => {
                    // INSERT INTO MUSIC SQL DB
                    let musicInserts = giveMusicInserts(trackList, response.data.audio_features);
                    let userSongInserts = getUserSongInserts(userInfo, trackIds);

                    db.serialize(() => {
                      //add data to tables
                      musicInserts.forEach((i) => {
                        db.run(i);
                      });
                      userSongInserts.forEach((i) => {
                        db.run(i);
                      });
                      db.get(
                        "SELECT Name, COUNT(userID) AS numUsers FROM Users",
                        (err, num) => {
                          if (num.numUsers == 1) {
                            res.redirect("/?#");
                            user1Name = num.Name;
                            // obtain user 1's track information
                            for(let i = 0; i < 10; i++){
                              arts = [];
                              for(let j = 0; j < trackList[i].artists.length; j++){
                                arts.push({
                                  name: trackList[i].artists[j].name,
                                });
                              }
                              songList.push({
                                name: trackList[i].name,
                                artists: arts,
                              });
                            }
                          } else {
                            var userArray = [];

                            db.serialize(() => {
                              db.each(
                                "SELECT DISTINCT userID FROM Users",
                                (err, user) => {
                                  userArray.push(user.userID);
                                  db.each(
                                    "SELECT userID, Acousticness, Danceability, Energy, Liveness, Valence, Speechiness FROM userSongs NATURAL JOIN Music WHERE userID =" +
                                      '"' +
                                      user.userID +
                                      '"',
                                    (err, row) => {
                                      //creating vectors of song data
                                      if (userArray[0] == row.userID) {
                                        temp.push(parseFloat(row.Acousticness));
                                        temp.push(parseFloat(row.Danceability));
                                        temp.push(parseFloat(row.Energy));
                                        temp.push(parseFloat(row.Liveness));
                                        temp.push(parseFloat(row.Valence));
                                        temp.push(parseFloat(row.Speechiness));
                                        songVector0.push(temp);
                                        temp = [];
                                      } else {
                                        temp.push(parseFloat(row.Acousticness));
                                        temp.push(parseFloat(row.Danceability));
                                        temp.push(parseFloat(row.Energy));
                                        temp.push(parseFloat(row.Liveness));
                                        temp.push(parseFloat(row.Valence));
                                        temp.push(parseFloat(row.Speechiness));
                                        songVector1.push(temp);
                                        temp = [];
                                      }
                                      //checking to see if a user is comparing against themself
                                      db.get(
                                        "SELECT COUNT(DISTINCT userID) AS numUsers FROM Users",
                                        (err, num) => {
                                          if (num.numUsers == 1) {
                                            songVector1 = songVector0.filter(() => true);
                                          }
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            });
                            setTimeout(() => {
                              console.log(JSON.stringify(songList));
                              res.redirect(
                                "/?#" +
                                  querystring.stringify({
                                    access_token: access_token,
                                    refresh_token: refresh_token,
                                    score: avg_cosine_similarity(songVector0, songVector1,  50,  6),
                                    songList : JSON.stringify(songList),
                                    firstName : user1Name,
                                    //add first users top tracks
                                  })
                              );
                            }, "1000");
                          }
                        }
                      );
                    }); //end serialize
                  });
              });
          })
          .catch((error) => {
            res.send(error);
          });
      } else {
        res.send(response);
      }
    })
    .catch((error) => {
      res.send(error);
    });
});

var port = 8888;
app.listen(port, function () {
  console.log(`Simlify is running!`);
});

