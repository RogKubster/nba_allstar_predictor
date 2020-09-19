const all_star_predictor = require('./all_star_predictor.js');
var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');

var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false });


//Serve files from the public directory
app.use("/public", express.static(path.join(__dirname + '/public')));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//Start the express web server listening on 3000
app.listen(3000, () => {
  console.log('listening on 3000');
});

// serve the homepage
app.get('/', (req, res) => {
    console.log('got req from /');
    res.render('main');
});

//Serve all stars
app.post('/', urlencodedParser, async (req, res) =>
{
    let all_stars = await all_star_predictor.get_player_data(req.body.period, {Off_value: req.body.offSlider, Def_value: req.body.defSlider, Win_value: req.body.winSlider, Play_value: req.body.playSlider});

    res.render('allstars', {allstars: all_stars});
});