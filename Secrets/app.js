require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize())
app.use(passport.session())


// DATABASE (mongoDB)
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('useCreateIndex', true)

// database schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)




// model
const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
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

// Home route
app.get("/", (req,res) => {
    res.render("home")
})

// /auth/google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

// /auth/google/secrets
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) 
  {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  }
);

// Login route
app.get("/login", (req,res) => {
    res.render("login")
})


// register route (GET request)
app.get("/register", (req,res) => {
    res.render("register")
})

app.get("/secrets", (req,res) => {
    if(req.isAuthenticated()){
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

// logout
app.get("/logout", (req,res) => {
    req.logout()
    res.redirect("/")
})

// register POST request
app.post("/register", (req, res) => 
{
    User.register({username: req.body.username}, req.body.password, function(err, user)
    {
        if(err)
        {
            console.log(err)
            res.register("/register")
        } 
        else
        {
            passport.authenticate("local")
            (req, res, function()
            {
                res.redirect("/secrets")
            })
        } 

    })

    
})

// login post request
app.post("/login", (req, res) => 
{
   const user = new User({
    username: req.body.username,
    password: req.body.password
   })

   req.login(user, (err) => {
       if(err)
       {
           console.log(err);
       } 
       else 
       {
           passport.authenticate("local")
           (req, res, function()
           {
               res.redirect("/secrets")
           })
       }
   })
});

app.listen(3000, () => {
    console.log("Server started at port 3000");
})