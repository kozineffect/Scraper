
// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Comment = require("./models/Comments.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;


// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Make public a static dir
// app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://kozineffect:ditka1985@ds123050.mlab.com:23050/onion-scraper");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function (error) {
    console.log("Mongoose Error: ", error);
});


db.once("open", function () {
    request("http://www.theonion.com/", function (error, response, html) {
        var $ = cheerio.load(html);
        $("h2.headline").each(function (i, element) {
            var result = {};

            result.title = $(this).children("a").text();
            result.link = "http://www.theonion.com" + $(this).children("a").attr("href");

            var entry = new Article(result);

            entry.save(function (err, doc) {
                // Log any errors
                if (err) {

                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log("Successfully scraped!");
                }
            });

        });
        console.log("Mongoose connection successful.");
    });


    // Routes
    // ======
    app.get("https://onion-scraper.herokuapp.com/", function (req, res) {
        Article.find({}).populate("comment")
            .exec(function (error, doc) {
                // Log any errors
                if (error) {
                    console.log(error);
                }
                // Send the doc to the browser as a json object
                else {
                    console.log(doc[0]);
                    res.render("index", {
                        articles: doc
                    });
                }
            });
    });
});

// Create a new note or replace an existing note
app.post("https://onion-scraper.herokuapp.com/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry

    var newComment = new Comment(req.body);
    // And save the new note the db
    newComment.save(function (error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Otherwise
        else {
            // Use the article id to find and update it's note
            Article.findOneAndUpdate({
                    "_id": req.params.id
                }, {
                    $set: {
                        "comment": doc._id
                    }
                })
                // Execute the above query
                .exec(function (err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/");
                    }
                });
        }
    });
});


// Listen on port 3000
app.listen(3000, function () {
    console.log("App running on port 3000!");
});