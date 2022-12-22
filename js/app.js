// login
// get current album cover
//    if none display spotify logo
//   when album changes update
//    how often to test?
//   background last 50 albums played
//  when mouse moves
//    display artist album track names
//    display spotify icon for profile top right
//      profile contains info and logout button?

// this app uses https://github.com/massivelines/login-node-for-spotify to login to spotify
// TODO check scopes
// TODO test when spotify is off
var scopes = [
  "user-read-email",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
  "user-top-read",
  "user-read-private",
]; //scopes for permissions
var nodeHost = "https://musicnight-backend.herokuapp.com"; //location of node server

// controls how long the login element fades in milliseconds
loginFade = 300;

var spotify = new SpotifyHeroku(scopes, nodeHost, loginFade); //passes vars to new class

document.getElementById("login-button").addEventListener(
  "click",
  function () {
    // TODO setup node to fade instead of none
    spotify.login();
  },
  false
);

document.getElementById("logout").addEventListener(
  "click",
  function () {
    spotify.logout();
  },
  false
);

// hides the loggedin-profile div until the user has loged in
var userProfile = document.getElementById("profile");
userProfile.setAttribute("style", "display: none;");

// called from app.js after logged in
function main() {
  var commercial = false;
  var access_token;

  // shows user profile after logging in
  userProfile.setAttribute("style", "display: inherit;");

  function accessToken() {
    access_token = localStorage.getItem("access_token");
  }
  accessToken();

  backgroundArt();
  profile();

  function profile() {
    $.ajax({
      url: "https://api.spotify.com/v1/me",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      success: function (response) {
        console.log("hello");
        console.log(response);
        var user = {
          name: response.display_name,
          email: response.email,
          profileImg: response.images["0"]?.url,
          product: response.product,
        };
        if (user?.profileImg) {
          $("#profileImg").html('<img src="' + user.profileImg + '">');
        }
        $("#user").html("<h1>Logged in as " + user.name + "</h1>");
        $("#email").text("Email: " + user.email);
        $("#product").text("Account Type: " + user.product);
      },
      error: function (response) {
        console.log("profile");
        console.log(response);
      },
    });
  } // end of profile --------------------------------------------------

  // TODO if playing, get device, and same info
  // https://api.spotify.com/v1/me/player
  // else so dialog to start playback
  // also pass device to profile page

  //holder to check if art needs to change
  var holdAlbumImg = null;
  var holdTrackName = null;

  function getCurrentAlbum() {
    var refresh;

    function refreshCurrentAlbum() {
      $.ajax({
        url: "https://api.spotify.com/v1/me/player/",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          // if a commercial is on
          if (response?.item == null) {
            // commercial = true;
            // $("#cover_background").css("opacity", 0);
            // $("#track").html("");
            // $("#artist").html("");
            // $("#album").html("");
            // else get album art
          } else {
            // fade in to cover from commercial and toggle track-details visiblity
            if ($("#cover_background").css("opacity") == 0) {
              $("#cover_background").css("opacity", 1);
              commercial = false;
            }
            var playing = {
              artist: response.item.album.artists["0"].name,
              album: response.item.album.name,
              track: response.item.name,
              albumImg: response.item.album.images["0"].url,
              artistURL: response.item.artists["0"].external_urls.spotify,
              albumURL: response.item.album.external_urls.spotify,
              trackURL: response.item.external_urls.spotify,
            };

            // if changing to new cover
            if (holdAlbumImg != playing.albumImg) {
              // if there was a previous cover
              if (holdAlbumImg) {
                $("#cover-image").hide();
                $("#cover-image").css("transition", "0s");
                $("#cover-image").css("opacity", 0);
                $("#cover_bg_blur").hide();
                $("#cover_bg_blur").css("transition", "0s");
                $("#cover_bg_blur").css("opacity", 0);
              }
              $("#cover-image").attr("src", playing.albumImg);
              $("#cover-image").show();
              $("#cover-image").css("transition", "1s");
              $("#cover-image").css("opacity", 1);
              $("#cover_bg_blur").css(
                "background-image",
                "url('" + playing.albumImg + "')"
              );
              $("#cover_bg_blur").show();
              $("#cover_bg_blur").css("transition", "1s");
              $("#cover_bg_blur").css("opacity", 1);
              if (holdAlbumImg === null) {
                $("#cover_container").css("opacity", 1);
                $("#cover-image-prev").attr("src", playing.albumImg);
                $("#cover_bg_blur-prev").css(
                  "background-image",
                  "url('" + playing.albumImg + "')"
                );
              } else {
                setTimeout(() => {
                  $("#cover-image-prev").attr("src", playing.albumImg);
                }, "1000");
                setTimeout(() => {
                  $("#cover_bg_blur-prev").css(
                    "background-image",
                    "url('" + playing.albumImg + "')"
                  );
                }, "1000");
              }
              holdAlbumImg = playing.albumImg;
            }
            if (holdTrackName != playing.track) {
              $("#track").html(playing.track);
              $("#artist").html(playing.artist);
              $("#album").html(playing.album);
              holdTrackName = playing.track;
            }
          }
          refresh = setTimeout(refreshCurrentAlbum, 250);
        },
        error: function (response) {
          if (response.status == 401) {
            console.log("refreshCurrentAlbum == 401");
            console.log(response);
            spotify.refresh();
            console.log("refresh token");
            accessToken();
            refreshCurrentAlbum();
          } else {
            console.log("refreshCurrentAlbum");
            console.log(response);
          }
        },
      });
    }

    refreshCurrentAlbum();
  } // end of get getCurrentAlbum ------------------------------------------

  // get user's top albums
  // save id's in array
  // lookup id's and get album art
  // create grid or bricks, maybe random sizes

  function backgroundArt() {
    // ---------------------------------------------------------

    // function 1
    //    loop
    //      gets album id
    //      add to var
    //    call 2

    // function 2
    //    reduces to 20 in array
    //    loop
    //      gets album art
    //      adds to array
    //    sends to grid

    //calls getArtID then sends multiTrack to getArtUrl
    getArtID(getArtUrl);

    function getArtID(callback) {
      //.when compleates only after both ajax calls pass
      $.when(
        $.ajax({
          url: "https://api.spotify.com/v1/me/top/tracks/",
          data: {
            limit: 50,
          },
          headers: {
            Authorization: "Bearer " + access_token,
          },
          success: function (response) {},
          error: function (response) {
            console.log(response);
          },
        }),
        $.ajax({
          url: "https://api.spotify.com/v1/me/player/recently-played",
          data: {
            limit: 50,
          },
          headers: {
            Authorization: "Bearer " + access_token,
          },
          success: function (response) {},
          error: function (response) {
            console.log("getArtID");
            console.log(response);
          },
        })
        //done pushes all ids together and filters for duplicates then callback
      ).done(function (top50, recentlyPlayed) {
        var top50Arr = [];
        var recentlyPlayedArr = [];
        var topLength = top50Arr.length;
        var recentlyLength = recentlyPlayedArr.length;
        var multiTrack = [];

        // pushes the ids from top tracks into and array
        for (var i = 0; i < top50["0"].items.length; i++) {
          top50Arr.push(top50["0"].items[i].album.id);
        }
        // pushes the ids from last played into and array
        for (var j = 0; j < recentlyPlayed["0"].items.length; j++) {
          recentlyPlayedArr.push(recentlyPlayed["0"].items[j].track.album.id);
        }

        // combines array for filtering
        multiTrack = top50Arr.concat(recentlyPlayedArr);

        // fillter the array for duplicates
        multiTrack = multiTrack.filter(function (elem, pos) {
          return multiTrack.indexOf(elem) == pos;
        });

        callback(multiTrack);
      });
    }

    function getArtUrl(multiTrack, callback) {
      holdID = multiTrack;
      var times = 2;
      var start = 0;
      var test = 0;
      var tempARR = [];
      var idARR = [];
      var tempStringArr = [];
      var itt = Math.ceil(holdID.length / 20);

      if (holdID.length > 19) {
        for (var i = 0; i < itt; i++) {
          if (holdID.length > 19) {
            tempStringArr[i] = holdID.splice(0, 20);
          } else {
            tempStringArr[i] = holdID.splice(0, holdID.length);
          }
          idARR[i] = tempStringArr[i].join(",");
        }
      } else {
        idARR[0] = holdID.join(",");
      }

      function loop(idARR, test, itt, callback) {
        if (test < idARR.length) {
          $.ajax({
            url: "https://api.spotify.com/v1/albums",
            data: {
              ids: idARR[test],
            },
            headers: {
              Authorization: "Bearer " + access_token,
            },
            success: function (response) {
              // get the tracks images and push to array multiTrackImg (300px)
              for (var j = 0; j < response.albums.length; j++) {
                tempARR.push(response.albums[j].images["0"].url);
              }
              test = test + 1;
              loop(idARR, test, times, callback);
            },
            error: function (response) {
              console.log("getArtUrl");
              console.log(response);
            },
          });
        } else {
          callback(tempARR);
        }
      }

      loop(idARR, test, itt, function (reData) {
        //  shuffles the array and reasignes it
        //  anonymous self-invoking function so all vars are contained
        reData = (function (imageArray) {
          // suffles the reData array
          var ran, temp, i;
          for (i = imageArray.length; i; i--) {
            ran = Math.floor(Math.random() * i);
            temp = imageArray[i - 1];
            imageArray[i - 1] = imageArray[ran];
            imageArray[ran] = temp;
          }
          return imageArray;
        })(reData);

        output(reData);
      });
    }
  } // end of backgroundArt --------------------------------------------------

  // create grid using mason.js
  // http://masonjs.com/
  function output(multiTrackImg) {
    var currentWidth;
    var currentHeight;
    var columnSize;
    var numberOfColumns;
    var newWidth;
    var gridStyles;

    function random(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    var columnBreaks = [
      [0, 480, 8],
      [480, 780, 10],
      [780, 1080, 12],
      [1080, 1320, 14],
      [1320, 1680, 16],
    ];

    // get #container size

    // console.log(gridSize);

    function appendImages(callback) {
      var fillers = multiTrackImg.splice(
        0,
        Math.floor(multiTrackImg.length / 2)
      );
      $.each(multiTrackImg, function () {
        $(".grid").append(
          '<div class="grid-item"><div class="grid-background" style="background-image: url(' +
            this +
            '); background-repeat: no-repeat; background-size:cover;"></div></div>'
        );
      });
      $.each(fillers, function () {
        $(".hidden").append(
          '<div class="fillers"><div class="grid-background" style="background-image: url(' +
            this +
            '); background-repeat: no-repeat; background-size:cover;"></div></div>'
        );
      });

      callback();
    }

    appendImages(function () {
      // starts mason after all the images are loaded

      $(".grid")
        .imagesLoaded()
        .done(function (instance) {
          // build grid
          var mason = $(".grid").mason({
            itemSelector: ".grid-item",
            ratio: 1,
            sizes: [
              [3, 3],
              [2, 2],
              [1, 1],
            ],
            columns: columnBreaks,
            filler: {
              itemSelector: ".fillers",
              filler_class: "mason_filler",
              keepDataAndEvents: true,
            },
            layout: "fluid",
            gutter: 2,
          });
        })
        .done(function () {
          // randomizes the fade in on the grid items
          var artDivs = $(".grid-background").get();
          var artDivsLength = artDivs.length;

          function opacityLoop() {
            if (artDivsLength > 0) {
              setTimeout(function () {
                var loc = random(0, artDivsLength);
                $(artDivs[loc]).css("opacity", 1);
                artDivs.splice(loc, 1);
                artDivsLength--;
                opacityLoop();
              }, 20);
            }
          }
          opacityLoop();
        })
        .done(function () {
          // starts getCurrentAlbum art with interval and fades it in
          // TEMP: Change for testing, turns off full art
          getCurrentAlbum();
          $("#cover_background").css("opacity", 1);
        });
    });

    // use foundation throttle and deboucer
    $("body").on("resizeme.zf.trigger", function () {
      // $('#container').css('top', -random(0, $('.grid').height() - currentHeight) / 2 + 'px');
    });
  } // end of output ------------------------------------------------
} // end of main -------------------------------------------------

$(document).foundation();
