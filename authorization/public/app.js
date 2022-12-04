(function(){
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
      refresh_token = params.refresh_token,
      error = params.error;

  var userProfileSource = document.getElementById('user-profile-template').innerHTML,
      userProfileTemplate = Handlebars.compile(userProfileSource),
      userProfilePlaceholder = document.getElementById('user-profile');
  
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
          userProfilePlaceholder.innerHTML = userProfileTemplate(response);
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
    }else{
      $('#login').show();
      $('#loggedin').hide();
    }
  }
})();