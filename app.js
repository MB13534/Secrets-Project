//jshint esversion:6
require('dotenv').config(); //this is new for environment variables

const express = require('express');
const app = express();
const port = 3000;
app.use(express.static("Public"));


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));


const ejs = require('ejs');
app.set('view engine', 'ejs');


const encrypt = require('mongoose-encryption'); //This is to encrypt the pw

const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({ //you now have to make a mongoose.Scheme, not just a JS object
  username: String,
  password: String
});


//the secret for the encryption is in env
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] }); //this is associating the mongoose plugin and the secret, ONLY encrypt the password

const User = new mongoose.model("User", userSchema);


app.get('/', function(req, res){
  res.render('home');
});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/register', function(req, res){
  res.render('register');
});


app.post('/register', function(req, res){
  const newUser = new User ({
    username: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if (err){
      console.log(err);
    }else{
      res.render('secrets');
    }
  });
});


app.post('/login', function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({username: username}, function(err, foundUser){
    if(err){
      console.log(err);
    }else;
    if(foundUser){
      if (foundUser.password === password){
        res.render('secrets');
      }else{
        res.send('Invalid credentials.');
      }
    }
  });
});




























app.listen(port, function(){
  console.log(`Connection established on port: ${port}.`)
});
