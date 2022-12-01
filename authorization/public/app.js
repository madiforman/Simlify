(function () {

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  var musicInserts = [];
  var userInserts = [];

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

  /* TABLES
  Users: userID, Name
  Music: trackID, trackName, Acousticness, Danceability, Energy, Livelyness, Valence, Speechiness, Tempo
  UserTracks: UserID, MusicID*/
  function giveMusicInserts(trackInfo, features){
    var statements = [];
    for (var i = 0; i < trackInfo.trackList.length;i++){
      let songName = trackInfo.trackList[i].name;
      let songID = trackInfo.trackList[i].id;
      let Acousticness = features[i].acousticness;
      let Danceability = features[i].danceability;
      let Energy = features[i].energy;
      let Liveness = features[i].liveness;
      let Valence = features[i].valence;
      let Speechiness = features[i].speechiness;
      let Tempo = features[i].tempo;
      statements.push(`INSERT INTO Music (trackID, trackName, Acousticness, Danceability, Energy, Liveness, Valence, Speechiness, Tempo)
        VALUES (${songID}, ${songName}, ${Acousticness}, ${Danceability},  ${Energy}, ${Liveness}, ${Valence}, ${Speechiness}, ${Tempo})`);
    }
    return statements;
  }

  function giveUserInserts(userInfo){
    var statements = []
    let userID = userInfo.id;
    let userName = userInfo.display_name;
    statements.push(`INSERT INTO Users (userID, userName) 
      VALUES ( ${userID}, ${userName})`);
    return statements;
  }

  let tracks = {};
  let audio = {};
  /**
   * This function takes a time range and generates a user's top tracks. It then takes the ID's
   * of the tracks and generates the audio features of each track
   * @param timeRange a time range for the set of tracks
   */

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
        url: `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=25&offset=0`,
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          tracks = {
            trackList: response.items,
          };
          for (var i = 0; i < tracks.trackList.length; i++) {
            for (var j = 0; j < tracks.trackList[i].artists.length; j++) {
              tracks.trackList[i].artists[j].name =
                tracks.trackList[i].artists[j].name.trim();
              if (j != tracks.trackList[i].artists.length - 1) {
                tracks.trackList[i].artists[j].name =
                  tracks.trackList[i].artists[j].name + ", ";
              }
            }
          }
          
          // get track ID's
          var trackIds = [];
          for(var i = 0; i < tracks.trackList.length; i++){
            var arr = tracks.trackList[i].uri.split(":");
            trackIds.push(arr[arr.length-1]);
          }
  
          tracksPlaceholder.innerHTML = tracksTemplate({
            tracks: tracks.trackList,
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
              audio = {
                features: response.audio_features,
              };
            }
          });
        },
      });
      giveMusicInserts(tracks, audio.features);

      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            Authorization: 'Bearer ' + access_token,
          },
          success: function(response) {

            userProfilePlaceholder.innerHTML = userProfileTemplate(response);
            // console.log(giveUserInserts(response));
            userInserts = giveUserInserts(response);
            let btn = document.createElement("button");
            btn.innerHTML = "Click to login next user";
            document.body.appendChild(btn);
            btn.setAttribute("id", "btn");
            btn.addEventListener('click', function(){
            $('#login').show();
            $('#loggedin').hide();
            });
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
  }
})();