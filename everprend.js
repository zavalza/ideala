//Separar tus tags por commas - regex 

Ideas = new Meteor.Collection("ideas")

if (Meteor.isClient) {
    
    Meteor.startup(function () {
        Session.set("showWelcome", true);
    });

  Template.navigation.events({
    'click .home': function (evt, tmpl) {
      Session.set("showPeople", false)
      return false
    },
    'click .tryLogout': function (evt, tmpl) {
      Meteor.logout(function(err){
          if (err)
          {
            //To do if logout was not successfull
          }
          else{
              Session.set("tagsOfIdea", " ")
              Session.set("ideaData", " ")
              Session.set("showSimilarIdeas", false)
            }
          });
      return false
    },

    'click .showLogin':function(evt, tmpl){
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

    'click .searchIdea': function (evt, tmpl) {
      evt.preventDefault();
      var idea = document.getElementById("idea").value;
      //Separacion de tags
      var tagsOfIdea = document.getElementById("tagsOfIdea").value;
      var doc = {
                idea: idea, 
                nameOfIdea: " ",
                tagsOfIdea: tagsOfIdea,
                lastScore: 0,
                peopleInvolved:{
                              users: [],
                              roles:[]
                            },
                relatedIdeas:{
                  ideas: [],
                },  
                referrer: document.referrer, timestamp: new Date()
                };
      Session.set("ideaData", doc);
      Session.set("tagsOfIdea",tagsOfIdea);
      Meteor.subscribe('similar_ideas', tagsOfIdea, function(){
          Session.set("showWelcome", false);
          Session.set("showSimilarIdeas", true)});
      return false
    },

    'click .saveIdea': function (evt, tmpl) {
    if (Meteor.userId())
    {
       var new_words= Session.get("tagsOfIdea");
        if((new_words != " "))
        {
            var words = new_words.replace(',',' ');
            Meteor.call("updateUserProfile", Meteor.userId(), words);
            Session.set("tagsOfIdea", " ")
        }
        var doc = Session.get('ideaData');
        var old_words = Meteor.user().profile.words;
        if(doc != " ")
        {
          doc.peopleInvolved.users.push(Meteor.userId());
          Meteor.subscribe('similar_ideas', old_words +","+ new_words)
          Meteor.call("insertIdea", Meteor.userId(), doc);
          Session.set("ideaData", " ")
        }
        else
        {
          Meteor.subscribe('similar_ideas', old_words);
        } 
        Meteor.subscribe("userData");
    }
    else
    {
      Session.set("showSimilarIdeas", false);
      Session.set("showWelcome", false);
      Session.set("showLogin", true);
    }
      return false
    },

    'click .person': function (evt, tmpl) {
      var id = this._id;
      Meteor.subscribe("userProfile", id);
      Session.set("showProfile", true);
      return false
    },

    'click .seeIdea': function (evt, tmpl) {
    var id = this._id;
    Meteor.subscribe("ideaProfile", id);
    Session.set("showSimilarIdeas", false);
    Session.set("showWelcome", false);
    Session.set("showIdeaData", true);
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
                lastScore: 0,
                peopleInvolved:{
                              users: [],
                              roles:[role]
                            },
                relatedIdeas:{
                  ideas: [],
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
            var new_words= Session.get("tagsOfIdea");
            if((new_words != " "))
            {
                var words = new_words.replace(',',' ');
                Meteor.call("updateUserProfile", Meteor.userId(), words);
                Session.set("tagsOfIdea", " ")
            }
            var doc = Session.get('ideaData');
            var old_wordsArray = Meteor.user().profile.words;
            var old_words = " ";
            for(var i = 0; i < old_wordsArray.length; i++)
            {
              var old_words = old_words + " "+ old_wordsArray[i];
            }
            if(doc != " ")
            {
              doc.peopleInvolved.users.push(Meteor.userId());
              Meteor.subscribe('similar_ideas', old_words +","+ new_words)
              Meteor.call("insertIdea", Meteor.userId(), doc);
              Session.set("ideaData", " ")
            }
            else
            {
              Meteor.subscribe('similar_ideas', old_words);
            } 
            Meteor.subscribe("userData");
          }
        });
      Session.set("showProfile", false);
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
                                            var new_words= Session.get("tagsOfIdea");
                                            if((new_words != " "))
                                            {
                                                var words = new_words.replace(',',' ');
                                                Meteor.call("updateUserProfile", Meteor.userId(), words);
                                                Session.set("tagsOfIdea", " ")
                                            }
                                            var doc = Session.get('ideaData');
                                            var old_wordsArray = Meteor.user().profile.words;
                                            var old_words = " ";
                                            for(var i = 0; i < old_wordsArray.length; i++)
                                            {
                                              var old_words = old_words + " "+ old_wordsArray[i];
                                            }
                                              
                                            if(doc != " ")
                                            {
                                              doc.peopleInvolved.users.push(Meteor.userId());
                                              Meteor.subscribe('similar_ideas', old_words +","+ new_words)
                                              Meteor.call("insertIdea", Meteor.userId(), doc);
                                              Session.set("ideaData", " ")
                                            }
                                            else
                                            {
                                              Meteor.subscribe('similar_ideas', old_words);
                                            } 
                                            Meteor.subscribe("userData");
                                                                          }

                          });
      Session.set("showNewUser", false);
      Session.set("showLogin", false);
      return false;
    }
  });


  Template.welcome.showLogin = function() {
    return Session.get("showLogin");
  };

  Template.welcome.showRegisterForm = function() {
    return Session.get("showRegisterForm");
  };

  Template.main.showWelcome = function() {
  return Session.get("showWelcome");
  };

  Template.main.showPeople = function() {
    return Session.get("showPeople");
  };

  Template.main.showSimilarIdeas = function() {
    return Session.get("showSimilarIdeas");
  };

  Template.main.showProfile = function() {
    return Session.get("showProfile");
  };

  Template.main.showIdeaData = function() {
  return Session.get("showIdeaData");
  };

 Template.main.showLogin = function() {
  return Session.get("showLogin");
  };

  Template.welcome.showNewUser = function() {
  return Session.get("showNewUser");
  };

  Template.newIdea.ideaData = function() {
  return Session.get("ideaData");
  };

  Template.newIdea.tagsOfIdea = function() {
  return Session.get("tagsOfIdea");
  };

   Template.similar_ideas.helpers({
    matching_idea: function(){
    return Ideas.find({'peopleInvolved.users':{$nin:[Meteor.userId()]}});
    }
  });

  Template.ideas.helpers({
    open_idea: function(){
    return Ideas.find({'peopleInvolved.users':{$nin:[Meteor.userId()]}});
    }
  });

  Template.persons.helpers({
    user: function(userId) {
    Meteor.subscribe("userProfile", userId);
    return  Meteor.users.find({_id: userId});
    }
  });

  Template.userData.helpers({
  user: function() {
    return Meteor.users.find({_id:Meteor.userId()});
  }
  });

  Template.profile.helpers({
  user: function() {
    return Meteor.users.find({_id:{$ne:Meteor.userId()}});
  },

  idea_data: function (ideaId) {
   
  return Ideas.find({_id: ideaId});
  }

  });

  Template.ideaData.helpers({
  idea_to_show: function() {
    return Ideas.find();
  },

  idea_data: function (ideaId) {
   
  return Ideas.find({_id: ideaId});
  }

  });
}

if (Meteor.isServer) {

  
  Meteor.publish('similar_ideas', function(searchText) {
         var doc = {};

    var ideasIds = Meteor.call("searchIdeas",searchText);
   
    console.log(ideasIds)

    if (ideasIds) {
        doc._id = {
            $in: ideasIds
        };
      var matchingIdeas = Ideas.find(doc,{sort:{lastScore:-1}});


      return matchingIdeas;
    }
    else
    {
      console.log("subscription retrieves error");
      this.error();
    }

  });

  Meteor.publish("userProfile", function (idOfUser) {
  console.log("publishing profile of user with id:");
  if (idOfUser) {
    console.log(idOfUser);
    //console.log("inside if");
    return Meteor.users.find({_id: idOfUser});
  } else {
    this.ready();
  }
  });

  Meteor.publish("ideaProfile", function (idOfIdea) {
  console.log("publishing profile of idea with id:");
  if (idOfIdea) {
    console.log(idOfIdea);
    return Ideas.find({_id: idOfIdea});
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
    search_index_name = 'ideasFinder'

    // Remove old indexes as you can only have one text index and if you add 
    // more fields to your index then you will need to recreate it.
    Ideas._dropIndex(search_index_name);

    //text
    Ideas._ensureIndex({
        idea: 'text',
        tagsOfIdea: 'text'
    }, {
        name: 'ideasFinder'
    },{
      weight: {idea: 1, tagsOfIdea: 3}
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

      updateUserProfile:function(userId, words){
        console.log(userId);
        console.log(words);
        var wordsArray = words.split(/\s+/);
        for(var i=0; i < wordsArray.length; i++)
        {
          Meteor.users.update({_id: userId},
          {$push: {'profile.words':wordsArray[i]}} );
        }
      },

      _searchIdeas: function (searchText) {
      console.log(typeof(searchText));
      console.log(searchText);
      
      var Future = Npm.require('fibers/future');
      var future = new Future();
      MongoInternals.defaultRemoteCollectionDriver().mongo.db.executeDbCommand({
          text:'ideas', //Collection
          search: searchText, //String to search
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
              var id = searchResults[i].obj._id;
              var score = searchResults[i].score;
              console.log(score);
              Ideas.update({_id: id}, {$set: {'lastScore':score}});
              ids.push(id);
          }
          console.log(ids);
          return ids;
      }
      }
  });
}
