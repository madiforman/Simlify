/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var sqlite3 = require('sqlite3').verbose();

var client_id = 'a2bd214fd5d44b278a1625e0f5376057'; // Your client id
var client_secret = '546e170d6d1042eeab670d4f84d233f8'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

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

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
      show_dialog: true,
    }));
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        access_token = body.access_token;
        var access_token = body.access_token,
          refresh_token = body.refresh_token;
 
        //  var options = {
        //    url: 'https://api.spotify.com/v1/me',
        //    headers: { 'Authorization': 'Bearer ' + access_token },
        //    json: true
        //  };
 
        //  // use the access token to access the Spotify Web API
        //  request.get(options, function(error, response, body) {
        //    console.log(body);
        //  });
 
         // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        //  res.redirect('/#' +
        //    querystring.stringify({
        //      error: 'invalid_token'
        //    }));
        res.send("There was an error during authentication.");
      }
    });
  }
});
 
app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
/**NOTE : VECTORS CAN NOT CONTAIN ALL ZEROS OR WE WILL GET NaN. MUST CHECK BEFORE THAT THEYRE NOT ALL 0 */
/**
 * Function to find the magnitude of a vector
 * @param {*} v vector
 * @returns magnitude of v
 */
function vector_magnitude(v){
  let sum = 0;
    v.forEach(i =>{
      sum += i * i;
    })
    return Math.sqrt(sum);

}
/**
 * Function to find the dot product of two vectors
 * @param {*} v0 first vector
 * @param {*} v1 second vector
 * @param {*} len length of both vectors (must be the same)
 * @returns dot product of v0 . v1
 */
function dot_product(v0, v1, len){
  let product = 0;
  for(let i = 0; i < len; i++){
    product += + v0[i] * v1[i];
  }
  return product;
}
/**
 * I wanted a function that will round two the second decimal place in a precise manner
 * @param {*} num num to round
 * @returns rounded number
 */
function my_round(num){
  return Math.round(( num  + Number.EPSILON) * 100) / 100;
}
/**
 * Finds the cosine similarity of two vectors
 * @param {*} v0 first vector 
 * @param {*} v1 second vector
 * @param {*} len len of both vectors
 */
function cosine_similarity(v0, v1, len){
let num = dot_product(v0, v1, len);
let denom = vector_magnitude(v0) * vector_magnitude(v1);
return my_round(num/denom);
}
let vector0 = [[ 3, 2, 0, 5], [ 1, 7, 0, 5]];
let vector1 = [[3, 1, 1, 4], [1, 6, 0, 5]];
let v = [[0, 1, 0, 0], [1, 1, 1, 1]];
/**
 * Averages the cosine similarity of two lists of vectors
 * @param {*} list0 first list of vectors 
 * @param {*} list1 second list of vectors
 * @param {*} size number of vectors given (i.e. vector0 defined above has 2 vectors)
 * @param {*} elems number of elemnts per vector (i.e. vector0 has 4 elements in each vector)
 * @returns 
 */
function average_cosine_sim(list0, list1, size, elems){
  let cos = 0;
  for(let i = 0; i < size; i++){
    cos += cosine_similarity(list0[i], list1[i], elems);
  }
  return my_round(cos/size);
}

console.log(average_cosine_sim(v, vector1, 2, 4));