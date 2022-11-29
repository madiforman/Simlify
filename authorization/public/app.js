(function() {

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

  var userProfileSource = document.getElementById('user-profile-template').innerHTML,
      userProfileTemplate = Handlebars.compile(userProfileSource),
      userProfilePlaceholder = document.getElementById('user-profile');
  
  var tracksSource = document.getElementById('tracks-template').innerHTML,
      tracksTemplate = Handlebars.compile(tracksSource),
      tracksPlaceholder = document.getElementById('tracks');

  /**
   * This function takes a time range and generates a user's top tracks. It then takes the ID's
   * of the tracks and generates the audio features of each track
   * @param timeRange a time range for the set of tracks
   */
  function retrieveTracks(timeRange) {
      // Get top tracks of user
      $.ajax({
        url: `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=25&offset=0`,
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          let data = {
            trackList: response.items,
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
          
          // get track ID's
          var trackIds = [];
          for(var i = 0; i < data.trackList.length; i++){
            var arr = data.trackList[i].uri.split(":");
            trackIds.push(arr[arr.length-1]);
          }
  
          tracksPlaceholder.innerHTML = tracksTemplate({
            tracks: data.trackList,
            trackIds: trackIds,
          });
          // get string combining all track IDs
          var ids = "";
          for(var i = 0; i < trackIds.length-2; i++){
            ids += trackIds[i] + "%";
          }
          ids+=trackIds[trackIds.length-1];
          // get track audio features
          $.ajax({
            url: `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
            headers: {
              Authorization: "Bearer " + access_token,
            },
            success: function (response) {
              let audio = {
                features: response.audio_features,
              };
            }
          });
        },
      });
  }

  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  var oauthSource = document.getElementById('oauth-template').innerHTML,
      oauthTemplate = Handlebars.compile(oauthSource),
      oauthPlaceholder = document.getElementById('oauth');

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {
      // render oauth info
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token
      });

      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            Authorization: 'Bearer ' + access_token,
          },
          success: function(response) {
            userProfilePlaceholder.innerHTML = userProfileTemplate(response);

            $('#login').hide();
            $('#loggedin').show();
          }
      });
    } else {
        // render initial screen
        $('#login').show();
        $('#loggedin').hide();
    }

    document.getElementById('obtain-new-token').addEventListener('click', function() {
      $.ajax({
        url: '/refresh_token',
        data: {
          'refresh_token': refresh_token
        }
      }).done(function(data) {
        access_token = data.access_token;
        oauthPlaceholder.innerHTML = oauthTemplate({
          access_token: access_token,
          refresh_token: refresh_token
        });
      });
    }, false);

    document.getElementById("get-track").addEventListener("click", function () {
      retrieveTracks("short_term");
      },
      false
    );
  }
})();
