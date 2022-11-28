(function() {

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */

  var displayName = "APP NAME";
  var dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  var today = new Date();

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

  /////////////////////////
  function retrieveTracks(timeRange, domNumber, domPeriod) {
      $.ajax({
        url: `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=10&offset=5`,
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          let data = {
            trackList: response.items,
            total: 0,
            date: today.toLocaleDateString("en-US", dateOptions).toUpperCase(),
            json: true,
          };
          for (var i = 0; i < data.trackList.length; i++) {
            data.trackList[i].name = data.trackList[i].name.toUpperCase() + " - ";
            data.total += data.trackList[i].duration_ms;
            data.trackList[i].id = (i + 1 < 10 ? "0" : "") + (i + 1);
            let minutes = Math.floor(data.trackList[i].duration_ms / 60000);
            let seconds = (
              (data.trackList[i].duration_ms % 60000) /
              1000
            ).toFixed(0);
            data.trackList[i].duration_ms =
              minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
            for (var j = 0; j < data.trackList[i].artists.length; j++) {
              data.trackList[i].artists[j].name =
                data.trackList[i].artists[j].name.trim();
              data.trackList[i].artists[j].name =
                data.trackList[i].artists[j].name.toUpperCase();
              if (j != data.trackList[i].artists.length - 1) {
                data.trackList[i].artists[j].name =
                  data.trackList[i].artists[j].name + ", ";
              }
            }
          }
          minutes = Math.floor(data.total / 60000);
          seconds = ((data.total % 60000) / 1000).toFixed(0);
          data.total = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  
          tracksPlaceholder.innerHTML = tracksTemplate({
            tracks: data.trackList,
            total: data.total,
            time: data.date,
            num: domNumber,
            name: displayName,
            period: domPeriod,
          });
          console.log(data.trackList);
        },
      });
  }
  ////////////////

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
      retrieveTracks("short_term", 1, "LAST MONTH");
      },
      false
    );
  }
})();
