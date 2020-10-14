var express = require('express')
var mongoose = require('mongoose')
var body = require('body-parser')
var app = express()
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require("node-sessionstorage")

app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);

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

var orderlist=['mango'];
var frequency=[2];

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/register", function (req, res) {
    res.render("register")
})

app.get('/home/:page', (req, res) => {
    const pageName = req.params.page;
    var person = session.getItem('user');
    res.render(pageName, {
        person : person
    });
});    

app.get('/items/:itemname', (req,res)=>{
    var c= req.params.itemname;
    itemmodel.findOne({title: c}, function(err, item){
        res.render('items', {item:item});
    })
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

// app.get('/orders', function(req,res){
//     res.render('orders', { orderlist: orderlist, frequency: frequency })
// })

app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }),
    function(req, res) {
        session.setItem('user', req.user);
        res.render('home', {person : req.user});
    }
);

app.post("/items/:itemname", function(req,res){
    var itname = req.params.itemname;
    var num= req.body.num;
    itemmodel.findOne({ name: itname }, function (err, item) {
        orderlist.push(item.name);
        frequency.push(num);
        res.render('orders', { orderlist: orderlist, frequency: frequency });
    });
    console.log(orderlist);
    
})

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

function initializePassport(passport) {
    passport.use(new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'pass'
        },
        function (username, password, done) {
            usermodel.findOne({ username: username }, function (err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (password !== user.password) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
        }
    ));
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
}

app.listen(3040, "localhost", function () {
    console.log("Connected to server")
})
