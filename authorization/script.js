require('dotenv').config()

/*To avoid making our API keys public, we don't want to add and commit them. We'll use a package named dotenv for that. The .env is referred to in the .gitignore file so you're safe!*/
const express = require('express');
const app = express();
var request = require('request');
const hbs = require('hbs');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var cors = require('cors');
const bodyParser = require('body-parser');
// require spotify-web-api-node package here:
const SpotifyWebApi = require("spotify-web-api-node");

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
var state = generateRandomString(16);

var scopes = ['user-read-private', 'user-read-email', 'user-top-read'],
redirectUri = 'http://localhost:8888/callback',
clientId = 'a2bd214fd5d44b278a1625e0f5376057',
clientSecret = '546e170d6d1042eeab670d4f84d233f8',
state = state;

// setting the spotify-api goes here:
const spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectUri
});

// create authorization url
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);


app.get('/login', function(req, res) {
 
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // redirect to the authorization url
  res.redirect(authorizeURL);
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  spotifyApi.authorizationCodeGrant(code).then(
    function(data) {
      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
    },
    function(err) {
      console.log('Something went wrong!', err);
    }
  );
  // console.log(req.query);
  // console.log(state);
  // console.log(req.cookies);
  // console.log(req.cookies[stateKey]);
  // console.log(storedState);

  if (state === null) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch',
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        access_token = body.access_token;
        var access_token = body.access_token,
          refresh_token = body.refresh_token;
 
         // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.send("There was an error during authentication.");
      }
    });
  }
  
});

// app.get('/#' + querystring.stringify({
//   access_token: spotifyApi.getAccessToken,
//   refresh_token: spotifyApi.refreshAccessToken
// }), function(req,res){
//   console.log(hi);
// });


// // the routes go here:
// app.get('/', (req, res, next) => {
//   res.render('index')
// })


// app.get('/artists', (req, res, next) => {
//   //console.log('artist is', req.query.artist)
//   spotifyApi
//     .searchArtists(req.query.artist)
//     .then(data => {
//         //console.log("The received data from the API: ", data.body.artists.items);
//         res.render('artists',  {artists: data.body.artists.items, artist: req.query.artist});
//     })
//     .catch(err => {
//         console.log("The error while searching artists occurred: ", err);
//     })
// });

// app.get('/albums/:id', (req, res, next) => {
//   spotifyApi
//     .getArtistAlbums(req.params.id)
//     .then(
//       function(data) {
//         let artist = req.query.artist
//         //console.log('Artist albums', data.body.items);
//         res.render('albums', {albums: data.body.items, artist: artist})
//       },
//       function(err) {
//         console.error(err);
//       }
//     );
// })

// app.get('/tracks/:id', (req, res, next) => {
//   spotifyApi
//     .getAlbumTracks(req.params.id)
//     .then(function(data) {
//       //console.log('tracks', data.body.items);
//       res.render('tracks', {tracks: data.body.items, album: req.query.album, artist: req.query.artist})

//     }, function(err) {
//       console.log('Something went wrong!', err);
//     })
// })


var port = 8888;

app.listen(port, function () {
 console.log(`My Spotify project running!`);
});