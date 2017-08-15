var User        = require('../models/user');
var Log         = require('../models/log');
var Citizen     = require('../models/citizen');
var Usergen     = require('../logic/user-generation');
var Authority   = require('../models/authority');
var fs          = require('fs');
function newcitzen(req,res,next){
      var role = req.user.role;
    if(role == "citizen"){
       var roletoassign='citizen';
        var status = 'pending';
      }
    else if(role=='admin' || role ==  "r_authority"){
        var roletoassign= 'citizen';
        var status = 'verified';

    }
    else {
        return res.json({success:false, msg:'You are not allowed to create new user'}); 
    }
     
if(!req.body.first_name ||!req.body.last_name || !req.body.parent || !req.body.address
 || !req.body.Phone ||!req.body.email || !req.body.birthdate || !req.body.gender || !req.filelocation){

      return res.json({success:false , msg:'Please Pass all the parameters' , req:req.body });

  } else {

    var name = req.body.first_name+" "+ req.body.last_name;

    var newcitizen = {
      fullname:name,
      parent:req.body.parent,
      birthdate:req.body.birthdate,
      location:req.body.address,
      gender:req.body.gender,
      contact:{
          phone:req.body.Phone,
          email:req.body.email,

      },
      photo:req.filelocation,
      status:status,  
      userId:req.user.id,
     };
      Citizen.findOne({
        userId:req.user.id
      },function(err,citizen){
        if (err) throw err;
          
        if (citizen) {
          var location =appRoot + citizen.filelocation;
          fs.unlinkSync(location);
        } 
      });
      Citizen.findOneAndUpdate({
        userId:req.user.id,
      },
      newcitizen,
      {
      upsert: true, 
      'new': true,
      setDefaultsOnInsert: true,
      },
      function(err,citizen) {
        console.log('inside');
        if (err) {
          return res.json({success: false, msg: 'Error Occurred',err: err });
        }
        console.log(citizen);
        if(citizen){
          console.log('CItizen inside');
          User.findOneAndUpdate({
            _id:req.user.id,
          },{
            $set:{status:"pending"}
          },{
            upsert: true, 
          },function (err, user){
             if(err){
               res.json({success:false , msg:"Unable to update user status" ,err:err});
             }
             if(user){
                res.json({success: true, msg: 'Successful created new citizen.' ,citizen:citizen  });
             }
             else{
                 res.json({success:false, msg:"Unable to change user status" });
             }
          });
          
        }
        else{
          res.json({success:false , msg: "Something went wrong"});
        }
      
    });
      }
}

module.exports.newCitizenUser=function(req, res,next ) {
   newcitzen(req,res,next);

  }
module.exports.newAuthority = function(req, res ,next){
  var role = req.user.role;
  var status,userId;
  if(role=='citizen'){
      status = 'pending';
      
    }
  else if(role=='admin'){
       status = 'verified';   
  }
  else {
      fs.unlinkSync(appRoot + req.filelocation);
      return res.json({success:false , msg:"Sorry !! You are not allowed to perform this action"});
  }
    
     
if(!req.body.name ||!req.body.address || !req.body.lat|| !req.body.lng ||!req.body.auth_type
 ||  !req.body.description || !req.filelocation){
      fs.unlinkSync(appRoot + req.filelocation);
      return res.json({success:false , msg:'Please Pass all the parameters' , detail:req.body});
    
  } else {
        
      var storein = appRoot + '/public/uploads/profileimage/';
      var picLoc;
      if (req.fileLocation==storein){
        picLoc = appRoot + '/public/uploads/default_image.png';
      }
      else {
        picLoc = req.filelocation;
      }
      var authType ;
      authUser(req.body.name ,req.body.auth_type,function(err,user){
        if(role =='v_authority' || role =='r_authority'){
          userId = req.user.id;  
          authtype = req.user.role;
        }
        else {
          if(user){
            userId = user.id;
            authtype = user.role;
          }
          else {
            res.json({success:false , msg:"New authority couldnot be created"});
          }
        }
        if(user){
           authorityModelUpdate(req,userId,authType,picLoc,status,res);
          }
          else {
             res.json({success:false,msg:"coudnot create a new user" });
          }
      });


         
      }
}
module.exports.updateAuthority = function(req,res,next){
var role = req.user.role;
  var status,userId;
  var authType ;
  
  if(role =='v_authority' || role =='r_authority'){
      status = 'change';
      userId = req.user.id;  
      authtype = req.user.role;
      
    }
  else if (role=='admin'){
       status = 'verified'; 
       userId = req.headers.user_id;  
      authtype = req.body.auth_type;  
  }
  else {
      fs.unlinkSync(appRoot + req.filelocation);
      return res.json({success:false , msg:"Sorry !! You are not allowed to perform this action"});
  }
  if(!req.body.name ||!req.body.address || !req.body.lat|| !req.body.lng ||!req.body.auth_type
 ||  !req.body.description || !req.filelocation){
      fs.unlinkSync(appRoot + req.filelocation);
      return res.json({success:false , msg:'Please Pass all the parameters' , detail:req.body});
    
  } else {
        
      var storein = appRoot + '/public/uploads/profileimage/';
      var picLoc;
      if (req.fileLocation==storein){
        picLoc = appRoot + '/public/uploads/default_image.png';
      }
      else {
        picLoc = req.filelocation;
      }
      authorityModelUpdate(req,userId,authType,picLoc,status ,res);
      
  }
}
authUser = function (authname,role ,callback){
  var usernames = Usergen.randuser(authname);
  var pass = Usergen.pass;
  var  usersug =  usernames[Math.floor(Math.random() * usernames.length)];
   createUser(authname, usersug, pass,role,callback); 
}

createUser = function (authname, usersug,pass ,role,callback){
  User.findOne({
            username: usersug,
          }, function(err, user) {
            if (err) throw err;
         
            if (!user) {
                var newUser = new User({
                username:usersug,
                password:"pass",
                role:role,
                last_login:new Date(),
                status:"new",
               });


                newUser.save(function(err,newauth) {
                if (err) throw err;
                console.log('authority detial' +newauth)
                 if(newauth){
                  console.log(newUser);
                 var log = {message:"Registered" , time: new Date()};
                 var newLog = new Log({
                    userId:newauth.id,
                    logs:log,
                 });
                 newLog.save(function(err,log){ 
                   if(log){
                    callback(err,newauth);
                   }
                 });
              }
              });
            }  
            }
          );


}

authorityModelUpdate = function (req,userId,authType,picLoc,status ,res){
  Authority.findOne({
    userId:userId,
    },function(err,authority){
      if (err) throw err;
      console.log(err);
      if (authority) {
        var location =appRoot +  authority.photo_location;
        console.log(location);
        fs.unlinkSync(location);
        console.log("file removal");
      } 
  });
  //  update Authority
  var contact;
   var tempEmail=[];
   var tempPhone=[];
   for(var index in req.body.email){
     tempEmail.push(req.body.email[index]);
   }
    for(var index in req.body.phone){
      tempPhone.push(req.body.phone[index]);
    }
    contact={
      email: tempEmail,
      phone: tempPhone,
      
      
    }
    console.log('email ::' + tempEmail);
    console.log('phone ::' + tempPhone);


  console.log(contact);
   Authority.findOneAndUpdate ({
      userId: userId,
    },
    {
      name:req.body.name, 
      type:authtype,
      photo_location:picLoc,
      address:req.body.address,
      coordinate:{
          lat:req.body.lat ,
          lng:req.body.lng, 
      },
      contact:contact,
      description:req.body.description,
      status:status ,
    },
    {
      upsert: true, 
      'new': true
    }, function(err,updatedAuthority){
      if(err){
        res.json({success:false, msg:"Error on updating authority " + err});
        fs.unlinkSync(appRoot + req.filelocation);
        console.log("error appeared update authority" +err)
      }
      else {
        res.json({success:true, msg:updatedAuthority});
        console.log('everything is fine');
      }
    });
}
    
module.exports.removeDocument = function(req,res,next){
  if(req.user.role=="admin"){
    console.log("inside remove if condition");
     User.findOneAndRemove({
       _id:req.headers.user_id,
     },function(err,user){
       if(!err){
        console.log('inside no error');
         if(user.role == "citizen"){
           citizenremove(req,res,next);
         } else if( user.role == "r_authority" || user.role == "v_authority"){
            authorityremove(req,res,next);
          }
          else {
            res.json({success:false,msg:"Not a valid user"});
          }
         }
       
       else {
        console.log('inside else');
        res.json({success:false , msg:"Unsuccessful to delete user" ,err:err});
       }
     });
  }
  else {
    res.json({success:false , msg:"Not Authorized"});
  }

}
citizenremove=function (req, res , next){
  console.log('INSIDE CITIZEN');
  Citizen.findOneAndRemove({
    userId: req.headers.user_id,
  },function(err ,citizen){
     if(!err){
       res.json({success:true, msg:"Successfully Deleted User"});
     }
     else{
       res.json({success:false,msg:"Unable to delete citizen",err:err});
     }
  });

}
authorityremove = function (req,res ,next){
  console.log('inside authority');
  Authority.findOneAndRemove({
    userId: req.headers.user_id,
  },function(err,auth){
    if(!err){
      res.json({success:true, msg:"Successfully Deleted User"});
    }
    else {
      res.json({success:false,msg:"Unable to delete authority" ,err:err});
    }
  });
};
