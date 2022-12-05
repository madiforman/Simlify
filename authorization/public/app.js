(function(){
  var song0 = 
  [
    [ 0.211, 0.756, 0.554, 0.274, 0.563, 0.145 ],
    [ 0.134, 0.595, 0.604, 0.11, 0.632, 0.0235 ],
    [ 0.193, 0.639, 0.45, 0.0974, 0.561, 0.0287 ],
    [ 0.122, 0.877, 0.826, 0.104, 0.814, 0.206 ],
    [ 0.327, 0.63, 0.465, 0.142, 0.377, 0.03 ],
    [ 0.804, 0.81, 0.402, 0.107, 0.54, 0.0537 ],
    [ 0.136, 0.753, 0.462, 0.111, 0.825, 0.0313 ],
    [ 0.0441, 0.802, 0.599, 0.0957, 0.873, 0.0343 ],
    [ 0.0000862, 0.528, 0.812, 0.189, 0.734, 0.0327 ],
    [ 0.00717, 0.331, 0.78, 0.102, 0.42, 0.0407 ]
  ]
  var song1 =
  [
    [ 0.129, 0.522, 0.689, 0.16, 0.0763, 0.0286 ],
    [ 0.725, 0.429, 0.265, 0.104, 0.22, 0.0293 ],
    [ 0.065, 0.377, 0.31, 0.114, 0.145, 0.029 ],
    [ 0.0462, 0.431, 0.416, 0.144, 0.177, 0.0296 ],
    [ 0.638, 0.258, 0.571, 0.141, 0.175, 0.0415 ],
    [ 0.31, 0.253, 0.359, 0.359, 0.115, 0.0317 ],
    [ 0.371, 0.303, 0.478, 0.131, 0.117, 0.0352 ],
    [ 0.00446, 0.363, 0.542, 0.332, 0.25, 0.0322 ],
    [ 0.00564, 0.358, 0.613, 0.146, 0.0481, 0.0308 ],
    [ 0.519, 0.289, 0.478, 0.124, 0.058, 0.0491 ]
  ]
  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
   function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var params = getHashParams();

  // GET TOKENS
  var access_token = params.access_token,
      error = params.error;

  var userProfileSource1 = document.getElementById('user-profile-template1').innerHTML,
      userProfileTemplate1 = Handlebars.compile(userProfileSource1),
      userProfilePlaceholder1 = document.getElementById('user-profile1');
  
  var tracksSource = document.getElementById('tracks-template').innerHTML,
      tracksTemplate = Handlebars.compile(tracksSource),
      tracksPlaceholder = document.getElementById('tracks');

  if(error){
    alert('There was an error during the authentication');
  }else{
    if(access_token){
      $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
        success: function(response) {
          // UPDATE USER PROFILE PAGE
          userProfilePlaceholder1.innerHTML = userProfileTemplate1(response);
          // ADD BUTTON FOR NEXT USER TO LOGIN
          let btn = document.createElement("button");
            btn.innerHTML = "Click to login next user";
            document.body.appendChild(btn);
            btn.setAttribute("class", "btn btn-default");
            btn.setAttribute("id", "login-next-user");
            btn.addEventListener('click', function(){
              $('#login').show();
              $('#loggedin').hide();
            });
            $('#login').hide();
            $('#loggedin').show();
        }
      });
      $.ajax({
        url: `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10&offset=0`,
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          let data = {
            trackList: response.items
          };
          for (var i = 0; i < data.trackList.length; i++) {
            data.trackList[i].name = data.trackList[i].name + " - ";
            for (var j = 0; j < data.trackList[i].artists.length; j++) {
              data.trackList[i].artists[j].name =
                data.trackList[i].artists[j].name.trim();
              if (j != data.trackList[i].artists.length - 1) {
                data.trackList[i].artists[j].name =
                  data.trackList[i].artists[j].name + ", ";
              }
            }
          }
          var cosineSim = avg_cosine_similarity(song0, song1, 10, 6);
          tracksPlaceholder.innerHTML = tracksTemplate({
            cosine: cosineSim,
            tracks: data.trackList,
            artist: data.trackList
          });
          drawCircles(cosineSim);
        },
      });
    }else{
      $('#login').show();
      $('#loggedin').hide();
    }
  }
  /** FUNCTIONS USED FOR MANIPULATING DATA TO FIND COS SIMILARITY */
  /** NOTE: A VECTOR CANNOT CONTAIN ALL ZEROES BUT I DONT THINK THAT SHOULD HAPPEN */
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
   * I wanted a function that will round to the second decimal place in a precise manner
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

      if(denom == 0){
        return "Divison by 0 error";
      }
    return num/denom;
  }
  // let vector0 = [[ 3, 2, 0, 5], [ 1, 7, 0, 5]];
  // let vector1 = [[3, 1, 1, 4], [1, 6, 0, 5]];
  // let v = [[0, 1, 0, 0], [1, 1, 1, 1]];
  /**
   * Averages the cosine similarity of two lists of vectors
   * @param {*} list0 first list of vectors 
   * @param {*} list1 second list of vectors
   * @param {*} size number of vectors given (i.e. vector0 defined above has 2 vectors)
   * @param {*} elems number of elemnts per vector (i.e. vector0 has 4 elements in each vector)
   * @returns 
   */
  function avg_cosine_similarity(list0, list1, size, elems){
    let cos = 0;
    for(let i = 0; i < size; i++){
    cos += (cosine_similarity(list0[i], list1[i], elems));
    }
    return my_round(cos/size);
  }
})();

function drawCircles(simScore){	
	var canvas = document.getElementById('myCanvas');
	var context = canvas.getContext('2d');
	//draws the circle based on similarity score
	var centerX = (canvas.width / 2)-((1-simScore)*140);
	var centerY = canvas.height / 2;
	var radius = 140;

	context.beginPath();
	//sets the arc to the right location
	context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
  // context.arc(100, 75, 50, 0, 2 * Math.PI, false);
	
	context.fillStyle = 'green';
	context.fill();
	context.lineWidth = 5;
	context.strokeStyle = '#003300';
	context.stroke();
	
	//moves the context to the accurate location
	context.moveTo((canvas.width / 2) + ((1-simScore)*140), centerY);
	context.fillStyle = 'red';
	
	context.stroke();
}