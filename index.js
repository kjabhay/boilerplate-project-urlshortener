require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('node:dns');
const mongoose = require('mongoose');
const {URL} = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI);

let urlSchema = new mongoose.Schema({
  original : {type: String, required: true},
  short: Number
});

let Url = mongoose.model('Url', urlSchema);
// mongoose.set('useFindAndModify', false); 
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', bodyParser.urlencoded({extended: false}), (req, res) =>  {
  let inputShort = 1;

  // const expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  // const regex = new RegExp(expression);
  // if(!req.body.url.match(regex)){
  //   res.json({error: "invalid url"});
  //   return;
  // }
  let parsedUrl;
  try {
    parsedUrl = new URL(req.body.url);
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, (err, address, family) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    else{
    Url.findOne({})
    .sort({short: 'desc'})
    .exec((err, result) => {
      if(!err && result != undefined){
        inputShort = result.short + 1;
      }
      if(!err){
        Url.findOneAndUpdate({original: req.body.url}, {original: req.body.url, short: inputShort}, {new: true, upsert: true}, (err, savedUrl) =>{
          if(!err){
            res.json({original_url : req.body.url, shorten_url: savedUrl.short});
          }
        });
      }
    });
    }
  });
});

app.get("/api/shorturl/:input", async (req, res) => {
  let input = req.params.input;
  Url.findOne({short: input}, (err, found) => {
    if(!err && found != undefined){
      res.redirect(found.original);
    } 
    else{
      res.json("Not Found");
    }
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
