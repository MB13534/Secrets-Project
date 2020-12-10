//jshint esversion:6
// const md5 = require('md5');

//passports req passport, passport-local, passport-local-mongoose, express-session
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session'); //require this first
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findOrCreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config(); //this is new for environment variables, does not need constant

const app = express();
const port = 3000;

//const passportLocal = require('passport-local'); //this does not need to be required, local mongoose just needs it
// const bcrypt = require('bcrypt'); //bcrypt is industry standard, higher than md5
// const saltRounds = 10; //this is how many rounds of salt will be done
// const encrypt = require('mongoose-encryption'); //This is to encrypt the pw, now we use a HASH

app.use(express.static("Public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');

app.use(session({  //set up session for express session
  secret: "Out little secret.",  //innitial configurations
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize()); //innitialize and start using passport
app.use(passport.session()); //also use passport when dealing with the sessions

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({ //you now have to make a mongoose.Scheme, not just a JS object
  username: String,
  password: String,
  googleId: String
});

userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose); //used to hash and salt passwords and save users into mongoDB database
//the secret for the encryption is in env
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] }); //this is associating the mongoose plugin and the secret, ONLY encrypt the password


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //create a local login strategy

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID, //reference .env
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', function(req, res) {
  res.render('home');
});

app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }) //bring up pop up to sign into google account
);

app.get('/auth/google/secrets',
passport.authenticate('google', { failureRedirects: '/login'}),
function(req, res) {
  res.redirect('/secrets');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.get('/secrets', function(req, res){
  if (req.isAuthenticated()){
    res.render('secrets');
  } else{
    res.redirect('/login');
  }
});

app.get('/logout', function(req, res){
req.logout();
  res.redirect('/');
});

app.post('/register', function(req, res) {
 User.register({username: req.body.username}, req.body.password, function(err, user){
   if (err){
     console.log(err);
     res.redirect('/register');
   } else{
     passport.authenticate("local")(req, res, function(){ //checks to see if the user passed is authenticated
       res.redirect('/secrets');
     });
   }
 }); //passport local mongoose package, dont need to create the user ect.
});
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   // Store hash in your password DB.
  //   const newUser = new User({
  //     username: req.body.username,
  //     password: hash,
  //     // password: md5(req.body.password) //call the fash function on the pw req
  //   });
  //   newUser.save(function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.render('secrets');
  //     }
  //   });
  // });

app.post('/login', function(req, res) {
  const user = new User ({ //create new user
    username: req.body.username,
    password: req.body.password
  });
//use passport to login and authenticate, login is from passport
  req.login(user, function(err){
    if (err){
      console.log(err);
    }else{
      passport.authenticate('local')(req, res, function(){
        res.redirect('/secrets'); //sends to /secrets to check if they are authenticated
      });
    }
  });
});





  // const username = req.body.username;
  // const password = req.body.password;
  // // const password = md5(req.body.password);
  //
  // User.findOne({
  //   username: username
  // }, function(err, foundUser) {
  //   if (err) {
  //     console.log(err);
  //   } else;
  //   if (foundUser) {
  //     bcrypt.compare(password, foundUser.password, function(err, result) {
  //       // result == true
  //       if (result === true) {
  //         res.render('secrets');
  //       } else {
  //         res.send('Invalid credentials.');
  //       }
  //     });
  //   }
  // });










app.listen(port, function() {
  console.log(`Connection established on port: ${port}.`)
});
