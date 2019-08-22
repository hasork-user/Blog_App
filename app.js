var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var expressSanitizer = require("express-sanitizer");
var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");

mongoose.connect("mongodb+srv://sand123:sand123@cluster0-t0jwv.gcp.mongodb.net/blog_app?retryWrites=true&w=majority", { useNewUrlParser: true });

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); 
app.use(methodOverride("_method"));
mongoose.set("useFindAndModify", false);

var userSchema = new mongoose.Schema({
	username: String,
	password: String
});
userSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", userSchema);

app.use(require("express-session")({
	secret: "This is secret btw",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});



var blogSchema = new mongoose.Schema({
	title: String,
	image: String,
	body: String,
	created: {type: Date, default: Date.now}
});

var Blog = mongoose.model("Blog", blogSchema);



app.get("/",function(req, res){
	res.redirect("/blogs");
});

app.get("/blogs",isLoggedIn,function(req, res){
	Blog.find({},function(err,blogs){
		if(err){
			console.log("ERROR!");
		}
		else{
			res.render("index",{blogs:blogs});
		}
	});
	
})

app.get("/blogs/new",isLoggedIn,function(req,res){
	res.render("new");
});

app.post("/blogs",isLoggedIn,function(req,res){
	req.body.blog.body = req.sanitize(req.body.blog.body);
	Blog.create(req.body.blog,function(err, newBlog){
		if(err){
			res.render("new");
		}
		else{
			res.redirect("/blogs");
		}
	});
});

app.get("/blogs/:id",isLoggedIn,function(req,res){
	Blog.findById(req.params.id,function(err,foundBlog){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.render("show",{blog: foundBlog});
		}
	});
});

app.get("/blogs/:id/edit",isLoggedIn,function(req,res){
	Blog.findById(req.params.id,function(err, foundBlog){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.render("edit",{blog:foundBlog});
		}
	});
});


app.put("/blogs/:id",isLoggedIn,function(req,res){
	req.body.blog.body = req.sanitize(req.body.blog.body);
	Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updatedBlog){
	if(err){
		res.redirect("/blogs");
	}
	else{
		res.redirect("/blogs/"+req.params.id);
	}
});
});

app.delete("/blogs/:id",isLoggedIn,function(req,res){
	Blog.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.redirect("/blogs");
		}
	});
});

app.get("/register", function(req, res){
	res.render("register");
});

app.post("/register", function(req, res){
	User.register(new User({username: req.body.username}), req.body.password, function(err, user){
		if(err)
		{
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res, function(){
			res.redirect("/blogs");
		});
	});
});

app.get("/login", function(req, res){
	res.render("login");
});

app.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/blogs",
		failureRedirect: "/login"
	}) , function(req, res){

});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/blogs");
});


function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}


app.listen(process.env.PORT,process.env.IP,function(){
	console.log("Blog App Running!");
});