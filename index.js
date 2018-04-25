// npm install -g localtunnel
// lt --port 3000 --subdomain conoro
// FB Callback then available on https://conoro.localtunnel.me

require("dotenv").config();
var express = require("express"),
  graph = require("fbgraph");
var app = express();
var server = require("http").createServer(app);
const axios = require("axios");
var postIDs = [];

var conf = {
  client_id: process.env.APP_PUBLIC_ID,
  client_secret: process.env.APP_SECRET_ID,
  scope: "email, user_birthday, user_location, publish_actions, user_likes, user_photos, user_posts, user_tagged_places, user_videos",
  // Add the URL below on your Facebook App using Settings -> Add platform -> Website
  redirect_uri: "https://conoro.localtunnel.me/auth"
};

// Configuration
var methodOverride = require("method-override");
var bodyParser = require("body-parser");
var errorHandler = require("errorhandler");

app.set("views", __dirname + "/views");
// Jade was renamed to pug
app.set("view engine", "pug");
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(methodOverride());

var path = require("path");
app.use(express.static(path.join(__dirname, "/public")));

var env = process.env.NODE_ENV || "development";
if ("development" == env) {
  app.use(
    errorHandler({
      dumpExceptions: true,
      showStack: true
    })
  );
}

// Routes

app.get("/", function (req, res) {
  res.render("index", {
    title: "click link to connect"
  });
});

app.get("/auth", function (req, res) {
  // we don't have a code yet
  // so we'll redirect to the oauth dialog
  if (!req.query.code) {
    console.log("Performing oauth for some user right now.");

    var authUrl = graph.getOauthUrl({
      client_id: conf.client_id,
      redirect_uri: conf.redirect_uri,
      scope: conf.scope
    });

    if (!req.query.error) {
      //checks whether a user denied the app facebook login/permissions
      res.redirect(authUrl);
    } else {
      //req.query.error == 'access_denied'
      res.send("access denied");
    }
  } else {
    // If this branch executes user is already being redirected back with
    // code (whatever that is)
    console.log("Got Oauth code");
    // code is set
    // we'll send that and get the access token
    graph.authorize({
        client_id: conf.client_id,
        redirect_uri: conf.redirect_uri,
        client_secret: conf.client_secret,
        code: req.query.code
      },
      function (err, facebookRes) {
        var options = {
          timeout: 3000,
          pool: {
            maxSockets: Infinity
          },
          headers: {
            connection: "keep-alive"
          }
        };

        graph.setOptions(options).get("me/posts", function (err, resg) {
          for (var i = 0; i < resg.data.length; i++) {
            postIDs.push(resg.data[i].id);
            console.log(resg.data[i].id);
          }
          // Just do one page whilst testing
          //if (resg.paging && resg.paging.next) getAllPages(resg);
          getAllAttachments();

          // Send list of IDs to the user for reference
          res.setHeader("Content-type", "application/octet-stream");
          res.setHeader(
            "Content-disposition",
            "attachment; filename=my_facebook_post_ids.csv"
          );
          res.send(postIDs);
        });
      }
    );
  }
});

async function getAllPages(res) {
  var keep_grabbing = res;
  while (keep_grabbing != false) {
    keep_grabbing = await getPage(keep_grabbing);
  }
}

const getPage = async res => {
  try {
    if (res && res.paging && res.paging.next) {
      const response = await axios.get(res.paging.next);
      const fbresp = response.data;
      for (var i = 0; i < fbresp.data.length; i++) {
        console.log(fbresp.data[i].id);
      }
      return fbresp;
    } else {
      console.log("All IDs collected.");
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

async function getAllAttachments() {
  var options = {
    timeout: 3000,
    pool: {
      maxSockets: Infinity
    },
    headers: {
      connection: "keep-alive"
    }
  };

  /* Temporarily disable
  for (var i = 0; i < postIDs.length; i++) {
    await graph
      .setOptions(options)
      .get(postIDs[i] + "/attachments", function(err, result) {
        if (result.data && result.data[0] && result.data[0].title)
          console.log(result.data[0].title);
        if (result.data && result.data[0] && result.data[0].description)
          console.log(result.data[0].description);
        if (result.data && result.data[0] && result.data[0].media)
          console.log(result.data[0].media);
        if (result.data && result.data[0] && result.data[0].target)
          console.log(result.data[0].target);
        var url;
        if (result.data && result.data[0] && result.data[0].url) {
          if (result.data[0].url.startsWith("http://l.facebook.com/l.php?u=")) {
            url = result.data[0].url.replace(
              "http://l.facebook.com/l.php?u=",
              ""
            );
          } else if (
            result.data[0].url.startsWith("https://l.facebook.com/l.php?u=")
          ) {
            url = result.data[0].url.replace(
              "https://l.facebook.com/l.php?u=",
              ""
            );
          } else {
            url = result.data[0].url;
          }
        }
        console.log(decodeURIComponent(url));
      });
  }
*/
  // Raw Post Data
  for (var i = 0; i < postIDs.length; i++) {
    graph.setVersion('2.12');
    var params = {
      fields: "id, caption, created_time, description, full_picture, link, message, message_tags, permalink_url, picture, story, story_tags"
    };
    await graph.setOptions(options).get(postIDs[i], params, function (err, result) {
      console.log(result);
    });
  }
}

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Express server listening on port %d", port);
});