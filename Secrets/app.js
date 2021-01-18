// environmental variable
require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')



const app = express();

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}))



// DATABASE (mongoDB)
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true})

// database schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})



userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] })

// model
const User = new mongoose.model("User", userSchema)

// Home route
app.get("/", (req,res) => {
    res.render("home")
})

// Login route
app.get("/login", (req,res) => {
    res.render("login")
})

// register route (GET request)
app.get("/register", (req,res) => {
    res.render("register")
})

// register POST request
app.post("/register", (req, res) => 
{
    const newUser = new User(
    {
        email: req.body.username,
        password: req.body.password
    })

    newUser.save((err) => 
    {
        if(err){
            console.log(error);
        } else {
            res.render("secrets")
        }
    })
})

// login post request
app.post("/login", (req, res) => 
{
    const username = req.body.username;
    const password = req.body.password

    User.findOne
    (
        {email : username},
        (err, foundUser) => 
        {
            if(err)
            {
                console.log(err);
            } else 
            {
                if(foundUser) 
                {
                    if(foundUser.password === password)
                    {
                        res.render('secrets')
                    }
                }
            }
        }
    )
});

app.listen(3000, () => {
    console.log("Server started at port 3000");
})