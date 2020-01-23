var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars")

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/MongoHeadlines";

mongoose.connect(MONGODB_URI);



app.get("/scrape", function(req, res) {
  axios.get("https://old.reddit.com/hot/").then(function(response) {

  var $ = cheerio.load(response.data);

  var results = [];

  $("p.title").each(function(i, element) {

    var title = $(element).text();

    var link = $(element).children().attr("href");

    results.push({
      title: title,
      link: link
    });
      db.Article.create(results)
        .then(function(dbArticle) {

          console.log(dbArticle);
        })
        .catch(function(err) {

          console.log(err);
        });
    });
      console.log(results);
    });

    res.send("Scrape Complete");
  });

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {

      res.json(dbArticle);
    })
    .catch(function(err) {

      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {

  db.Article.findOne({ _id: req.params.id })

    .populate("note")
    .then(function(dbArticle) {

      res.json(dbArticle);
    })
    .catch(function(err) {

      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {

  db.Note.create(req.body)
    .then(function(dbNote) {

      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {

      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
