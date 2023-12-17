var timePeriod = "short_term";

async function timeGetter(time) {
  try {
    let url = `https://api.spotify.com/v1/me/top/tracks?time_range=${time}&limit=10&offset=0`;
    return url;
  } catch (err) {
    console.log(err);
    return;
  }
}
(async function () {
  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var params = getHashParams();
  // GET TOKENS
  var access_token = params.access_token,
    error = params.error;

  var userProfileSource1 = document.getElementById(
      "user-profile-template1"
    ).innerHTML,
    userProfileTemplate1 = Handlebars.compile(userProfileSource1),
    userProfilePlaceholder1 = document.getElementById("user-profile1");

  var tracksSource = document.getElementById("tracks-template").innerHTML,
    tracksTemplate = Handlebars.compile(tracksSource),
    tracksPlaceholder = document.getElementById("tracks");

  if (error) {
    alert("There was an error during the authentication");
  } else {
    let secondName = "";
    if (access_token) {
      $.ajax({
        url: "https://api.spotify.com/v1/me",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          response.display_name = response.display_name.charAt(0).toUpperCase() + response.display_name.slice(1);
          secondName = response.display_name;

          userProfilePlaceholder1.innerHTML = userProfileTemplate1(response);
          $("#login").hide();
          $("#loggedin").show();

        },
      });

      $.ajax({
        url: await timeGetter(timePeriod),
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          let data = {
            trackList: response.items,
          };

          // Capitalize the first letter of users' names
          let firstName = params.firstName;
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
          secondName = secondName.charAt(0).toUpperCase() + secondName.slice(1);
          
          document.getElementById("header").innerHTML = "Hi " + secondName + " and " + firstName + "!";
          
          /**
           * Format songs and artists
           */
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
          let songs = JSON.parse(params.songList);
          for (var i = 0; i < songs.length; i++) {
            songs[i].name = songs[i].name + " - ";
            for (var j = 0; j < songs[i].artists.length; j++) {
              songs[i].artists[j].name =
                songs[i].artists[j].name.trim();
              if (j != songs[i].artists.length - 1) {
                songs[i].artists[j].name =
                  songs[i].artists[j].name + ", ";
              }
            }
          }

          // Send data to front-end
          tracksPlaceholder.innerHTML = tracksTemplate({
            cosine: 100 * params.score,
            tracks: data.trackList,
            artist: data.trackList,
            songs: songs, //use songs in html
            user1Name: firstName,
            user2Name: secondName,
          });
          
  
        },
      });
    } else {
      $("#login").show();
      $("#loggedin").hide();
    }
  }
})();
