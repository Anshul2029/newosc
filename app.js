var express = require('express')
var mongoose = require('mongoose')
var body = require('body-parser')
var app = express()
var session = require('express-session')
var sessionstorage = require("node-sessionstorage")

app.use(session({ secret: "something written here", resave: false, saveUninitialized: true }))

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(body.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/deliverysystem", { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })

var UserSchema = new mongoose.Schema({
    name: String,
    username: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: Number,
        length: 10,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        validate: [
            (input) => input.length >= 6,
            "Password should be longer."
        ]
    }
});

var itemschema = new mongoose.Schema({
    image: String,
    title: String,
    name: String,
    description: String,
    price: Number, 
})

var itemmodel = mongoose.model("itemmodel", itemschema);
var usermodel = mongoose.model("usermodel", UserSchema);

var pizzalist=[];
var numberlist =[];

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/register", function (req, res) {
    res.render("register")
})

app.get('/home', function(req,res){
    if(req.session.user){
        var person = sessionstorage.getItem('user');
        console.log(person.name);
        res.render("home", { person: person });
    }
    else{
        res.redirect("/login");
    }
    
})

app.get('/home/:page', (req, res) => {
    const pageName = req.params.page;
    var person = sessionstorage.getItem('user');
    res.render(pageName, {
        person : person
    });
});    

app.get('/items/:itemname', (req,res)=>{
    var c= req.params.itemname;
    itemmodel.findOne({title: c}, function(err, item){
        res.render("items",{item: item});
    })
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    pizzalist=[];
    numberlist= [];
    res.redirect('/login');
});

app.get('/orders', function(req,res){
    res.render('orders', { pizzalist:pizzalist , numberlist:numberlist })
})

app.post('/orders/:title', function(req,res){
    itemmodel.findOne({ title: req.params.title}, function(err, pizza){
        if(err){
            res.redirect('/orders');
        }
        else{
            pizzalist.push(pizza);
            numberlist.push(1);
            res.redirect('/orders');
        }
    })
})

app.post('/login', function(req, res) {
    usermodel.findOne({username: req.body.username}, function(err,user){
        if (err) {
            console.log(err)
            res.render("login");
        }
        else if (user.password == req.body.pass) {
            req.session.user = user;
            sessionstorage.setItem('user', user);  
            req.session.pizzalist = pizzalist;
            req.session.numberlist = numberlist;
            res.redirect("/home");
        }
        else {
            res.redirect("/login");
        }
        })
    }
);

app.post("/register", function (req, res) {
    var name = req.body.name;
    var username = req.body.username;
    var mobile = req.body.mobile;
    var password = req.body.pass;
    var confirmpass = req.body.confirmpass;
    var newuser = { name: name, username: username, mobile: mobile, password: password };
    usermodel.create(newuser, function (err, user) {
        if (err) {
            console.log(err);
        }
        else {
            if (confirmpass === password) {
                res.render("login");
            }
            else {
                console.log("The two passwords didnt match. Try Again!");
                res.render("register");
            }
        }
    })
});

app.listen(3040, "localhost", function () {
    console.log("Connected to server 3040")
})
