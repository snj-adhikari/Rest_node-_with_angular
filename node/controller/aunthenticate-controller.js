
var jwt = require('jsonwebtoken');
var User        = require('../models/user');
var config      = require('../../config/database');
var Log= require('../models/log');

module.exports.register = function(req,res){
  var role;
  if(!req.body.role){
    role="citizen"
  }
  else {
    role = req.body.role;
  }
if(!req.body.username ||!req.body.password ){

      return res.json({success:false , msg:'Please Pass all the parameters' , data: req.body});

  } else {
        User.findOne({
            username: req.body.username
          }, function(err, user) {
            if (err) throw err;
         
            if (!user) {
                var newUser = new User({
                username:req.body.username,
                password:req.body.password,
                role:role,
                last_login:new Date(),
                status:"new",
               });


                newUser.save(function(err,user) {
                if (err) {
                  return res.json({success: false, msg: 'Error Occurred',err: err });
                }
                 var log = {message:"Registered" , time: new Date()};
                 var newLog = new Log({
                    userId:user.id,
                    logs:log,
                 });
                 newLog.save(function(err,log){
                   if(err){
                     res.json({success:false , msg:"Resistration not successfull"});
                   }
                 });
                res.json({success: true, msg: 'Successful created new user.' ,user:user  });
              });
            } else {
              res.send({success:false, msg:'User already exists'})
              } 
            }
          );
   
      }
}
module.exports.uservalidation= function(req ,res ){
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;
 
    if (!user) {
      res.send({success: false, msg: 'User not found !!!'});
    } else {
      res.send({success:true, msg:'Username already exists !!!'})
      } 
    }
  );
}
module.exports.authenticate =function(req, res  ) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;
 
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      var role = user.role;
      var secretkey = config.secret;
      var expireday = config.expireday;
      var maxage = expireday * 24 * 60 * 60 * 1000
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          payload = {userid: user.id , role:user.role};
          var token = jwt.sign(payload, secretkey);
          //log
            var log = {message:"Logged In", time:new Date()};
          //update log
           Log.findOneAndUpdate ({
              userId: user.id,
            },
            {
              $push: {logs: log}
            },
            {
              upsert: true, 
              'new': true
            }, function(err,updatedLog){
              if(err){
                res.json({success:false, msg:"Error on updating log" + err});
              }
            });

          // return the information including token as JSON
          
          // res.cookie('cokkieName','JWT ' + token, { maxAge: maxage, httpOnly: true });
          res.json({success: true, token: 'JWT ' + token , days:expireday });
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.', err:err});
        }
      });
    }
   // res.send({success:false , msg:user , err:err});
  });
}



