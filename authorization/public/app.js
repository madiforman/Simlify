var timePeriod = "short_term";

async function timeGetter(time) {
  try {
    let url = `https://api.spotify.com/v1/me/top/tracks?time_range=short_range&limit=10&offset=0`;
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
          response.display_name =
            response.display_name.charAt(0).toUpperCase() +
            response.display_name.slice(1);
          secondName = response.display_name;

          userProfilePlaceholder1.innerHTML = userProfileTemplate1(response);
          //secondName = response.data.
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
          let firstName = params.firstName;
          document.getElementById("header").innerHTML =
            "Hi " + firstName + " and " + secondName + "!";
          tracksPlaceholder.innerHTML = tracksTemplate({
            cosine: 100 * params.score,
            tracks: data.trackList,
            artist: data.trackList,
            // songs: params.user1Songs, //use songs in html
            user1Name: params.firstName,
          });
        },
      });
    } else {
      $("#login").show();
      $("#loggedin").hide();
    }
  }
})();
