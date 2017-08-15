var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport	= require('passport');
var config      = require('./config/database'); // get db config file
var generation = require('./app/logic/user-generation');
var qs          = require('qs');
var crypto      = require('crypto');
var mime        = require('mime');
var fs          = require('fs');
var path        = require('path');
global.appRoot = __dirname;
//console.log(generation);
 // get the mongoose model
// var Citizen  = require('./app/models/citizen'); //get the verifying body
// var Log        = require('./app/models/log'); //get the verifying body
var port        = process.env.PORT || 8080;
// var jwt         = require('jwt-simple'); 
var jwt = require('jsonwebtoken');
var authenticateController = require('./app/controller/authenticate-controller');
var authorityController = require('./app/controller/authority-controller');
 var User        = require('./app/models/user');
 var dataController = require('./app/controller/data-controller');

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json({limit: '50mb'}));
// app.use(express.static('public'));

// For multipart form data 
 var multer = require('multer');
//   var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/uploads/citizenpic/')
//   },
//   filename: function (req, file, cb) {
//      crypto.pseudoRandomBytes(16, function (err, raw) {
//       cb(null, raw.toString('hex') +'-'+ Date.now() + '.' + mime.extension(file.mimetype));
//     });
//   }  
// });


 var upload = multer(/*{ storage: storage }*/);
 // var uploadedpic = upload.single('profilepic');
 var multerupload = upload.array();


// log to console
app.use(morgan('dev'));
//set header 
// Add headers
app.use(function (req, res, next) {

// Website you wish to allow to connect
res.header("Access-Control-Allow-Origin", '*');



// Request methods you wish to allow
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

// Request headers you wish to allow
res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,newreview,oldreview,usertype,user_id');

// Set to true if you need the website to include cookies in the requests sent
// to the API (e.g. in case you use sessions)
 res.setHeader('Access-Control-Allow-Credentials', true);

// Pass to next layer of middleware
next();
});
 
// Use the passport package in our application
app.use(passport.initialize());
 
// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});
// connect to database
mongoose.connect(config.database);
 
// pass passport for configuration
require('./config/passport')(passport);

 
// bundle our routes
var apiRoutes = express.Router();


//middleware  
function requireLogin(req, res, next ){
  var token = getToken(req.headers);

  if(!token){
    res.json({success:false , msg:"no login" , headers:req.headers});
    //res.redirect("/login");
  }
  else{
    var decoded = jwt.decode(token,config.secret);
    User.findOne({
      _id:decoded.userid,
      role:decoded.role
    },function(err, user){
      
      if (!user) {
          return res.status(403).send({success: false,  msg: 'Authentication failed. User not found.'});
        } else {
          //res.json({success: true,decoded:decoded,hello:user, msg: 'Welcome in the member area ' + user.username + '!'});
          // req.user.role= user.role;
          req.user = {
              role:user.role ,
              name: user.name , 
              id:user.id,
              status:user.status,
            };
          next();
        }
    });
  }

}


savefile = function savebase64file(base64url ,location, fileextension ,cb){
//  console.log('i m inside');
   var storage = new crypto.pseudoRandomBytes(16, function (err, raw) {
      var storelocation =location + raw.toString('hex') +'-'+ Date.now() + '.' + fileextension;
      cb(null,storelocation);
  });
 
}

//middleware for regisgtration
function photosaving(req, res , next){
  if(req.body.profilepic ==""){
    req.filelocation = __dirname + '/public/uploads/default_image.png';
    next();
  }
  else {
    var profilepic = req.body.profilepic;

    // console.log(profilepic);
    var storein= __dirname + '/public/uploads/profileimage/';
    
    // console.log(storein);
    savefile(profilepic,storein , 'png',function(err, result)  {
      if (err) {
          // file save ensuccessful
          res.json({success:false , err: err ,msg:"Error on saving photo"});
      } else {
          // file save successful
         // res.json({success:true, result:result});
         // return res.json({success:false,req:req.body})
         var base64image = req.body.profilepic.replace(/^data:image\/png;base64,/, "");
         fs.writeFile(result, base64image, 'base64', function(err) {
          if (err){
            res.json({success:false , err: err ,msg:"Error on saving photo"});
          } 
          else {
              var relLocation  = result.replace(__dirname,"");
              req.filelocation = relLocation;
              console.log(result);
              next();
          }
        });
      }
    });
}
}
app.get('/hello',function(req,res,next){
  res.json({success:true,msg:"hello world"});
});
//login api route
app.post('/login',authenticateController.authenticate) ;

//Check user
app.post('/checkuser',authenticateController.uservalidation);

//Register to aura 
app.post('/register',authenticateController.register);

//Determines the user role based on authentication header.
apiRoutes.get('/find_user_role',function(req,res){
  res.json({success:true, role:req.user.role ,status:req.user.status});
});
//Registration Api Route
apiRoutes.post('/newUsers' ,multerupload , photosaving , authorityController.newCitizenUser);
//auth registration
apiRoutes.post('/authRegistration' , multerupload , photosaving ,authorityController.newAuthority);
apiRoutes.post('/authUpdate' ,multerupload,photosaving,authorityController.updateAuthority);
apiRoutes.get('/remove_document',authorityController.removeDocument);
apiRoutes.get('/authorities' , dataController.authorities);
// Get the citizen detail
apiRoutes.get('/citizen_detail',dataController.citizenDetail);
apiRoutes.post('/authenticate',authenticateController.authenticate );
// route to a restricted info (GET http://localhost:8080/api/memberinfo)
apiRoutes.get('/dashboard', dataController.dashboard);

// route to a get auth detail ( POST http://localhost:8080/api/auth_detail)
apiRoutes.get('/auth_detail' , dataController.authDetail)

 apiRoutes.get('/memberArea', passport.authenticate('jwt', { session: false}), function(req, res) {
  // var token = getToken(req.headers);
  // if (token) {
  //   var decoded = jwt.decode(token, config.verifyingbodysecret);
  //   verify.findOne({
  //     username: decoded.username
  //   }, function(err, user) {
  //       if (err) throw err;
 
  //       if (!user) {
  //         return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
  //       } else {
  //         res.json({success: true, msg: 'Welcome in the member area ' + user.username + '!'});
  //       }
  //   });
  // } else {
  //   return res.status(403).send({success: false, msg: 'No token provided.'});
  // }
});
getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};
 
app.use('/public', express.static('public'));
app.use('/api',/*passport.authenticate('jwt', { session: false}),*/ requireLogin, apiRoutes);
// Try block


// Start the server
app.listen(port,'0.0.0.0');
console.log('There will be dragons: http://localhost:' + port);
process.on('uncaughtException', function (err) {
    console.log(err);
    console.log('it is error');
}); 
