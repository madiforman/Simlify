var timePeriod = "long_term";

const values = {
  "4 Weeks": "short_term",
  "6 Months": "medium_term",
  "Several Years": "long_term",
};
var timeMenu = document.getElementById("time");
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

  for (let val in values) {
    var option = document.createElement("option");
    option.setAttribute("value", values[val]);

    let optionText = document.createTextNode(val);
    option.appendChild(optionText);
    timeMenu.appendChild(option);
  }
  timeMenu.addEventListener("change", (e) => {
    timePeriod = e.target.value;
   // console.log(e.target.value);
  });

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
    if (access_token) {
      $.ajax({
        url: "https://api.spotify.com/v1/me",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          userProfilePlaceholder1.innerHTML = userProfileTemplate1(response);
          $("#login").hide();
          $("#loggedin").show();
        },
      });

      $.ajax({
        url: await timeGetter(document.getElementById("time").value),
        //`https://api.spotify.com/v1/me/top/tracks?time_range=${timePeriod}&limit=10&offset=0`,
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
          timeMenu.remove();
          document.getElementById("time-question").remove();
          tracksPlaceholder.innerHTML = tracksTemplate({
            cosine: 100 * params.score,
            tracks: data.trackList,
            artist: data.trackList,
          });
        },
      });
    } else {
      $("#login").show();
      $("#loggedin").hide();
    }
  }
})();

function drawCircles(simScore) {
  if (simScore >= 0 && simScore < 0.3) {
    document.getElementById("circles::after").style.left = "190px";
  } else if (simScore >= 0.3 && simScore < 0.5) {
    document.getElementById("circles::after").style.left = "150px";
  } else if (simScore >= 0.5 && simScore < 0.7) {
    document.getElementById("circles::after").style.left = "100px";
  } else if (simScore >= 0.7 && simScore < 0.9) {
    document.getElementById("circles::after").style.left = "60px";
  } else if (simScore >= 0.9 && simScore < 1) {
    document.getElementById("circles::after").style.left = "40px";
  }
  //draws the circle based on similarity score
}
