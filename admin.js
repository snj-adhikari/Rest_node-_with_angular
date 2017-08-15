  (function(){
        var app = angular.module("auraMember", ["ngRoute" ,'angularUtils.directives.dirPagination']);
        app.config(function($routeProvider, $locationProvider) {
            $routeProvider
            .when("/",{
                templateUrl:"admin/dashboard.html",
                activetab:"dashboard",
                controller:"MainCtrl",
                controllerAs:"main"
            })
            .when("/authority", {
                templateUrl : "admin/authorityRegistration.html",
                activetab:"authority",
                controller:"AuthorityCtrl",
                controllerAs:"authority"
              
            }).when("/view", {
                templateUrl : "admin/profile.html",
                activetab:"dashboard",
                controller:"ProfileCtrl",
                controllerAs:"profile"  
            });
             $locationProvider.html5Mode(true);
            }).run(function ($rootScope, $route ,$location, $anchorScroll, $routeParams) {
                $rootScope.$route = $route;
            }).controller('MainCtrl', ['$scope','$route', '$routeParams', '$location', '$http', '$rootScope',
              function MainCtrl($scope , $route, $routeParams, $location , $http , $rootScope) {
                this.$route = $route;
                this.$location = $location;
                this.$routeParams = $routeParams;
                $scope.message = "main dasboard";
                var auth = getCookie('authorization');
                $scope.auths = []; //declare an empty array
                 //ajax request to fetch data 
                $http.get(appConfig.apiUrlBase + 'dashboard' ,{
                  headers: {
                      "Authorization": auth,
                      "newreview":"pending",
                      "oldreview" :"change",
                      "usertype" :"authority"
                  }
                }).then(function(response){ 
                  var data = response.data;
                  if(data.success==true){
                    $scope.auths = data.auth;
                  }
                  else{
                    $scope.not_found = data.msg;
                  }
                });
                $http.get(appConfig.apiUrlBase + 'dashboard' ,{
                  headers: {
                      "Authorization": auth,
                      "usertype" :"all"
                  }
                }).then(function(response){ 
                  var data = response.data;
                  if(data.success==true){
                    $scope.users = data.users;
                    console.log(data.users);
                  }
                  else{
                    $scope.not_found = data.msg;
                  }
                });
                $scope.setUserId= function(data){
                  $rootScope.userId = data;
                  
                }
                $scope.sort = function(keyname){
                  $scope.sortKey = keyname;   //set the sortKey to the param passed
                  $scope.reverse = !$scope.reverse; //if true make it false and vice versa
                }
               
            }])
            
            .controller('AuthorityCtrl', ['$scope','$routeParams' , '$http', function AuthorityCtrl($scope , $routeParams ,$http) {
              this.name = 'authority';
              this.params= $routeParams;
              $scope.message = "";
              $scope.class="";
              $scope.phones=[];
              $scope.newPhone="";
              $scope.emails=[];
              $scope.newEmail="";
              $scope.name="";

              $scope.addPhone=function(){
                $scope.phones.push($scope.newPhone);
              }
              $scope.addEmail=function(){
                $scope.emails.push($scope.newEmail);
              }
              $scope.delPhone= function(i){
                $scope.phones.splice(i,1);
              }
              $scope.delEmail = function(i){
                $scope.emails.splice(i,1);
              }
              var auth = getCookie('authorization');
              $scope.submit =function(authority){
                $scope.message="";
                $scope.class="";
                console.log(authority);
                $http({
                  method: 'POST',
                  url: appConfig.apiUrlBase + 'authRegistration',
                  headers: {
                  'Authorization': auth,
                  },
                  data:authority,
                }).then(function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    // alert('successful');
                    // console.log(data);
                    // alert(data.success);
                    if(response.data.success==true){
                      $scope.auth = {};
                      $scope.message = "Successfully Created new user";
                      $scope.class ="success";
                    }
                  }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    $scope.message = "Problem in sending the request";
                    $scope.class ="error";

                  });
              }
            }]).controller('ProfileCtrl', ['$scope', '$location','$routeParams', '$http','$rootScope', '$window',
              function ProfileCtrl($scope, $location,$routeParams , $http , $rootScope, $window) {
              this.name = 'profile';
              this.params= $routeParams;
              $scope.message = "";
              $scope.class="";
              $scope.newPhone="";
              $scope.newEmail="";
              $scope.name="";
              $scope.disable="disabled";
              $scope.editText = "edit";
              var auth = getCookie('authorization');
              $http({
                  method: 'GET',
                  url: appConfig.apiUrlBase + 'auth_detail',
                  headers: {
                  'Authorization': auth,
                  'user_id':$rootScope.userId,                  },
                }).then(function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    // alert('successful');
                    // console.log(data);
                    //alert(data.success);
                    var output = response.data;
                    console.log(response);
                    if(output.success==true){
                      var lat_and_long = '"'+ output.coordinate.lat +','+ output.coordinate.lng+'"';
                      console.log(lat_and_long);
                  //  $("#geocomplete").geocomplete("find", lat_and_long);
                      $scope.auth=output.detailAuth;
                      $scope.phones = output.phone;
                      $scope.emails = output.email;
                      // $scope.message = output.phone[0] + output.email[0];
                      // console.log(output.phone[0]);
                      $scope.coordinate = output.coordinate;
                      $scope.image =  output.image ;
                      $scope.location = output.detailAuth.address;
                      $scope.disable="disabled";
                    }
                    else {
                     // $scope.message =output.msg ;
                      $scope.class ="error";
                    }
                  }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    //alert("ERR");
                    $scope.message = "Problem getting information !! Try again later";
                    $scope.class ="error";
                  });
            
              $scope.addPhone=function(){
                $scope.phones.push($scope.newPhone);
              }
              $scope.addEmail=function(){
                $scope.emails.push($scope.newEmail);
              }
              $scope.delPhone= function(i){
                $scope.phones.splice(i,1);
              }
              $scope.delEmail = function(i){
                $scope.emails.splice(i,1);
              }
              $scope.editToggle= function(){
                $scope.disable = "";
              }
              $scope.remove=function(){
                // alert('here');
                // alert($rootScope.userId);
                 $http.get(appConfig.apiUrlBase + 'remove_document' ,{
                  headers: {
                      "Authorization": auth,
                      "usertype" :"authority",
                       "user_id" :$rootScope.userId,
                  }
                }).then(function(response){ 
                  var data = response.data;
                  console.log(data);
                  if(data.success==true){
                    $scope.message = data.msg;
                   // $window.location.href = appConfig.webBaseUrl + 'dashboard';
                    $location.path("/");
                  }
                  else{
                    $scope.not_found = data.msg;
                  }
                });
              }
              $scope.submit =function(authority){
                $scope.message="";
                $scope.class="";
                console.log(authority);
                $http({
                  method: 'POST',
                  url: appConfig.apiUrlBase + 'authUpdate',
                  headers: {
                  'Authorization': auth,
                  'user_id':$rootScope.userId, 
                  },
                  data:authority,
                }).then(function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    // alert('successful');
                    // console.log(data);
                    // alert(data.success);
                    if(response.data.success==true){
                      $scope.message = "Authority is verified !!!!!";
                      $scope.class ="success";
                    }
                  }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    $scope.message = "Problem in sending the request";
                    $scope.class ="error";

                  });
              }
               
            }]);
        })();
   
