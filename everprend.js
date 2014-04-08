Ideas = new Meteor.Collection("ideas")

if (Meteor.isClient) {


  Template.navigation.events({
    'click .home': function (evt, tmpl) {
      Session.set("showPeople", false)
      return false
    },
    'click .name': function (evt, tmpl) {
      Meteor.logout()
      return false
    },

    'click .login':function(evt, tmpl){
      Session.set("showRegisterForm", false);
      Session.set("showLogin", true);
      return false
    }
  });

   Template.main.events({
    'click .entrar': function (evt, tmpl) {
      Session.set("showLogin", false);
      Session.set("showRegisterForm", true);
      Session.set("showNewUser", false);
      return false
    },

    'click .person': function (evt, tmpl) {
      //var idOfUser = tmpl.find('#_id').value;
      //'Yymz7cQYErsHc4RDv'
      var id = this._id;
      Meteor.subscribe("userProfile", id);
      Session.set("showProfile", true);
      return false
    },

    'click .newUser': function (evt, tmpl) {
      Session.set("showLogin", false);
      Session.set("showNewUser", true);
      return false
    },

    'click .signup' : function(evt, tmpl){
      evt.preventDefault();
      var role = document.getElementById("role").value;
      var idea = document.getElementById("idea").value;
      // Posible busqueda de nombres existentes
      var nameOfIdea = document.getElementById("nameOfIdea").value;
      //Separacion de tags
      var tagsOfIdea = document.getElementById("tagsOfIdea").value;
      var doc = {
                idea: idea, 
                nameOfIdea: nameOfIdea,
                tagsOfIdea: tagsOfIdea,
                peopleInvolved:{
                              users: [],
                              roles:[role]
                            },
                referrer: document.referrer, timestamp: new Date()
                };
      Session.set("ideaData", doc);
      Session.set("tagsOfIdea",tagsOfIdea);
      Session.set("userRole",role);
      Session.set("showRegisterForm", false);
      Session.set("showLogin", true);
      return false
    }
  });

  Template.loginForm.events({
    'click .tryLogin' : function (evt, tmpl) {
      evt.preventDefault();
      var username = tmpl.find('#username').value;
      var password = tmpl.find('#password').value;

      Meteor.loginWithPassword(username, password,
        function(err){
          if (err)
          {
            //To do if login was not successfull
          }
          else{
            //Session.set("Name", Meteor.users.find({_id:Meteor.userId()})).fetch();
            var new_words= Session.get("tagsOfIdea").replace(',',' ');
            var userRole= Session.get("userRole");
            if(new_words && userRole)
            {
                Meteor.call("updateUserProfile", Meteor.userId(), userRole, new_words);
            }
            var doc = Session.get('ideaData');
            doc.peopleInvolved.users.push(Meteor.user());
            var old_words = Meteor.user().profile.words;
            if(doc)
            {
              Meteor.subscribe('people_to_contact', userRole, old_words +" "+ new_words) //Probablemente los enviemos separadas, para darle peso a cada palabra
              Meteor.call("insertIdea", Meteor.userId(), doc);
            }
            else
            {
              Meteor.subscribe('people_to_contact', "given", old_words);
            } 
            Meteor.subscribe("userData");
            Session.set("showProfile", false);
          }
        });
      
      //Session.set("showPeople", true);
      return false;
    }
  });

  Template.newUserForm.events({
    'click .createUser' : function(evt, tmpl) {
      evt.preventDefault();
      var firstName = tmpl.find('#firstName').value;
      var lastName = tmpl.find('#lastName').value;
      var username = tmpl.find('#username').value;
      var email = tmpl.find('#email').value;;
      var password = tmpl.find('#password').value;
        // Trim and validate the input

      Accounts.createUser({
                          username:username,
                          email: email,
                          password : password,
                          profile: {
                                    firstName:firstName,
                                    lastName:lastName,
                                    roles:[],
                                    words:[],
                                    ideas:[],
                                  }
                          }, function(err){
                                          if (err) {
                                            // Inform the user that account creation failed
                                          } else {
                                            // Success. Account has been created and the user
                                            // has logged in successfully.
                                            var new_words= Session.get("tagsOfIdea").replace(',',' ');
                                            var userRole= Session.get("userRole");
                                            if(new_words && userRole)
                                            {
                                                Meteor.call("updateUserProfile", Meteor.userId(), userRole, new_words);
                                            }
                                            var doc = Session.get('ideaData');
                                            doc.peopleInvolved.users.push(Meteor.user());
                                            if(doc)
                                            {
                                              Meteor.subscribe('people_to_contact', userRole, new_words)
                                              Meteor.call("insertIdea", Meteor.userId(), doc);
                                            } 
                                          }

                          });
      Session.set("showNewUser", false);
      Session.set("showLogin", false);
      Session.set("showPeople", true);
      return false;
    }
  });


  Template.welcome.showLogin = function() {
    return Session.get("showLogin");
  };

  Template.welcome.showRegisterForm = function() {
    return Session.get("showRegisterForm");
  };

  Template.main.showPeople = function() {
    return Session.get("showPeople");
  };

  Template.main.showProfile = function() {
    return Session.get("showProfile");
  };

 Template.main.showLogin = function() {
  return Session.get("showLogin");
  };

  Template.welcome.showNewUser = function() {
  return Session.get("showNewUser");
  };

   Template.people.helpers({
  people_to_contact: function() {
    //return Meteor.users.find({});
    return  Ideas.findOne({}, {fields: { 'peopleInvolved.users': 1}});
  },
  matching_idea: function(){
    return Ideas.find({});
  }
  });

  Template.userData.helpers({
  user: function() {
    return Meteor.users.find({_id:Meteor.userId()});
  }
  });

  Template.profile.helpers({
  user_profile: function() {
    return Meteor.users.find({});
  }
  });
}

if (Meteor.isServer) {

  
  Meteor.publish('people_to_contact', function(role, searchText) {
         var doc = {};

    var ideasIds = Meteor.call("searchIdeas",searchText);
   
    console.log(ideasIds)
    if (ideasIds) {
        doc._id = {
            $in: ideasIds
        };
      var matchingIdeas = Ideas.find(doc)


      return matchingIdeas;
    }
    else
    {
      console.log("subscription retrieves error");
      this.error();
    }

  });

  Meteor.publish("userProfile", function (idOfUser) {
  console.log("publishing profile of");
  if (idOfUser) {
    console.log(idOfUser);
    //console.log("inside if");
    return Meteor.users.find({_id: idOfUser});
  } else {
    this.ready();
  }
  });


  Meteor.publish("userData", function () {
  console.log("publishing user data of");
  if (this.userId) {
    console.log(this.userId);
    //console.log("inside if");
    return Meteor.users.find({_id: this.userId});
  } else {
    this.ready();
  }
  });

  Meteor.startup(function () {
    // code to run on server at startup
    //Comment this line the first time, so Meteor can find the index_name afterwards
    search_index_name = 'peopleFinder'

    // Remove old indexes as you can only have one text index and if you add 
    // more fields to your index then you will need to recreate it.
    //Ideas._dropIndex(search_index_name);

    //text
    Ideas._ensureIndex({
        idea: 'text',
        tagsOfIdea: 'text'
    }, {
        name: 'peopleFinder'
    });
  });

    Meteor.methods({
      insertIdea: function(userId, doc) {
          console.log('Adding Idea with doc');
          console.log(doc);
          var ideaId = Ideas.insert(doc);
          Meteor.users.update({_id: userId},
          {$push: {'profile.ideas':ideaId}});
      },

      updateUserProfile:function(userId, role, words){
        console.log(userId);
        console.log(role);
        console.log(words);
        var wordsArray = words.split(/\s+/);
        for(var i=0; i < wordsArray.length; i++)
        {
          Meteor.users.update({_id: userId},
          {$push: {'profile.words':wordsArray[i]}} );
        }
        Meteor.users.update({_id: userId},
          {$push: {'profile.roles':role}});
        
      },

      _searchIdeas: function (searchText) {
      var Future = Npm.require('fibers/future');
      var future = new Future();
      MongoInternals.defaultRemoteCollectionDriver().mongo.db.executeDbCommand({
          text:'ideas', //Collection
          search: searchText, //String to search, sustitute with words
          //limit:3 
          // project: { //No funciona en nuestra base de datos
          // id: 1 // Only take the ids
          // }
          }, function(error, results) {
        console.log(results)
        if (results.documents[0].results[0] && results.documents[0].ok === 1) {
          future.return(results.documents[0].results);
          //console.log(results.documents[0].results[0].obj)
          }
          else {
              future.return('');
              console.log("No results in text search")
          }
      });
      return future.wait();
      },

      // Helper that extracts the users ids from the search results
      searchIdeas: function (searchText) {
        console.log(searchText)
      if (searchText && searchText !== '') {
          console.log('Searching Ideas...');
          var searchResults = Meteor.call("_searchIdeas", searchText);
          console.log('Ideas back');
          var ids=[]
          for (var i = 0; i < searchResults.length; i++) {
              ids.push(searchResults[i].obj._id);
          }
          console.log(ids);
          return ids;
      }
      }
  });
}
