//DB Connnection
Ideas = new Meteor.Collection("ideas")
Comments = new Meteor.Collection("comments")
Texts = new Meteor.Collection("texts") //opcion a guardar tipo de letra y tamaño, y comandos html de cursiva y negrita
Projects = new Meteor.Collection("projects")

//File Storage
var imageStore = new FS.Store.GridFS("images");

Images = new FS.Collection("images", {
  stores: [imageStore],
  filter: {
      allow: {
        contentTypes: ['image/*'] //allow only images in this FS.Collection
      }
    }
});


//Routing (HTML pages)
Router.map(function() {
  this.route('welcome', {path: '/'});
  this.route('ideas', {path:'/ideas'});
  this.route('ideaData',
    {path:'ideas/:_id',
    waitOn: function()
    {
      Session.set("showSimilarIdeas", false);
      Session.set("currentIdea", this.params._id)
      return Meteor.subscribe("ideaProfile", this.params._id);
      
    }
    });
  this.route('editIdea',
    {path:'edit/:_id',
    waitOn: function()
    {
      Session.set("showSimilarIdeas", false);
      Session.set("currentIdea", this.params._id)
      return Meteor.subscribe("ideaProfile", this.params._id);
      
    }
  });
  this.route('loginForm', {path:'/login'});
  this.route('newUserForm', {path:'/newUser'});
  this.route('people',{path:'/people'});
  this.route('profile',
    {path: '/profile/:_id',
    waitOn: function()
    { 
      Session.set("userToShow", this.params._id);
      return Meteor.subscribe('userProfile', this.params._id);
    }
    });
});

if (Meteor.isClient) { //Client Side
  /*Subsription variables, useful to sync data*/
  ideas = Meteor.subscribe("similar_ideas", " ");
  users = Meteor.subscribe("allUsers");

  Meteor.startup(function () {
      Session.set("showWelcome", true);
      Session.set("newText", false);
      Session.set("newImage", false);
      Session.set("commentsToShow", []);
      Session.set("currentIdea", 0);
      Session.set("userToShow", 0);
  });

    

  Template.navigation.events({
    'click .welcomeLink': function (evt, tmpl) {
      if(Meteor.userId())
      {
        var old_wordsArray = Meteor.user().profile.words;
        var old_words = " ";
        for(var i = 0; i < old_wordsArray.length; i++)
        {
          var old_words = old_words + " "+ old_wordsArray[i];
        }
        ideas =  Meteor.subscribe('similar_ideas', old_words);
      }
        Router.go('welcome');
      },

    'click .ideasLink': function (evt, tmpl) {
      ideas = Meteor.subscribe("allIdeas");
      Router.go('ideas');
    },

    'click .peopleLink': function (evt, tmpl) {
      users = Meteor.subscribe("allUsers");
      Router.go('people');
    },

    'click .profileLink': function (evt, tmpl) {
      Router.go('profile');
    },

    'click .tryLogout': function (evt, tmpl) {
      Meteor.logout(function(err){
          if (err)
          {
            //To do if logout was not successfull
          }
          else{
              Session.set("tagsOfIdea", " ");
              Session.set("ideaData", " ");
              Router.go('loginForm');
            }
          });
      return false
    },

    'click .loginFormLink':function(evt, tmpl){
     Router.go('loginForm');
    },

    'click .newUserFormLink':function(evt, tmpl){
    Router.go('newUserForm');
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
      Session.set("currentIdea", 0);
      Session.set("userToShow", 0);
      var pitch = document.getElementById("pitch").value;
      //Separacion de tags
      var tagsOfIdea = document.getElementById("tagsOfIdea").value;

      if(pitch=="" || tagsOfIdea == "")
      {
        alert("Por favor llena los campos");
        return false;
      }
      var doc = {
                pitch: pitch, 
                nameOfIdea: " ",
                tagsOfIdea: tagsOfIdea,
                texts:{
                    id:[],
                    position:[]
                },
                files:{
                    id:[],
                    position:[]
                },
                lastScore: 0,
                points: 0,
                votedBy:[],
                peopleInvolved:{
                              users: [],
                              roles:[]
                            },
                comments:[], 
                referrer: document.referrer, timestamp: new Date()
                };
      Session.set("ideaData", doc);
      Session.set("tagsOfIdea",tagsOfIdea);
      ideas = Meteor.subscribe('similar_ideas', tagsOfIdea, function(){
        Session.set("showWelcome", false);
        Session.set("showNewIdea", false);
        Session.set("showAllIdeas",false);
        Session.set("showSimilarIdeas", true);  
      });
      // if(IdeasSubscription.error) //No results back
      // {
      //   Session.set("showWelcome", false);
      //   Session.set("showNewIdea", false);
      //   Session.set("showAllIdeas",true);
      //   alert("No hubo ideas similares, tu idea ha sido guardada")
      // }

      return false
    },

    'click .saveIdea': function (evt, tmpl) {

    if (Meteor.userId())
    {
        var new_words = Session.get("tagsOfIdea");
        var words = new_words.replace(',',' ');
        Meteor.call("updateUserProfile", Meteor.userId(), words);
        Session.set("tagsOfIdea", " ")
        var old_wordsArray = Meteor.user().profile.words;
        var old_words = " ";
        for(var i = 0; i < old_wordsArray.length; i++)
        {
          var old_words = old_words + " "+ old_wordsArray[i];
        }
        var doc = Session.get("ideaData");
        var currentIdea = Session.get("currentIdea")
        if( currentIdea != 0) //This idea tries to improve another
        {
          doc.peopleInvolved.users.push(Meteor.userId());
          Meteor.call("addComment", Meteor.userId(), doc, currentIdea);
          Meteor.subscribe('similar_ideas', old_words +","+ new_words);
          Session.set("currentIdea", 0);
          Session.set("ideaData", " ");
        }
        else
        {
          doc.peopleInvolved.users.push(Meteor.userId());
          Meteor.call("insertIdea", Meteor.userId(), doc);
          Meteor.subscribe('similar_ideas', old_words +","+ new_words);
          Session.set("ideaData", " ");
        }
        Session.set("showSimilarIdeas", false);
        Meteor.subscribe("userData");
        return true;
    }
    else
    {
      //This can not happen
    }
      return false
    },
    //Decrease is not used
    'click .decrease': function (evt, tmpl) {
      if(Meteor.userId())
      {
        
         Meteor.call("decrease", Meteor.userId(), this._id);
      }
      else
      {
        alert("Necesitas ser usuario para votar");
      }
      return false
    }
  });


  Template.newComment.events({

    'click .saveComment': function (evt, tmpl) {
      var text = tmpl.find('#textOfComment').value;
      var currentIdea = this._id;
      var doc = {user: Meteor.userId(),
                idea: currentIdea,
                text: text, 
                image: null,
                video: null,
                audio: null,
                otherFile: null,
                points:0,
                votedBy:[], 
                referrer: document.referrer, timestamp: new Date()
                };
       Meteor.call("addComment", Meteor.userId(), doc, currentIdea);
       tmpl.find('#textOfComment').value = " ";
      return false
    }
  });
  Template.comments.events({
    'click .increase': function (evt, tmpl) {
      if(Meteor.userId())
      {
         Meteor.call("increase", Meteor.userId(), this._id);
      }
      else
      {
        alert("Necesitas ser usuario para votar");
      }
      return false
    },

    'click .showComments': function (evt, tmpl) {
      var commentsToShow = Session.get("commentsToShow");
      var selected = this._id;
      if(commentsToShow.indexOf(selected) == -1)
          commentsToShow.push(selected);
      else
        commentsToShow.splice(commentsToShow.indexOf(selected), 1);
      Session.set("commentsToShow", commentsToShow);
      return false
    }

  });

  Template.idea.events({
    'click .followIdea': function (evt, tmpl) {
    if (Meteor.userId())
    {
       Meteor.call("followIdea", Meteor.userId(), this._id);
    }
    else
    {
      alert("Necesitas ser usuario para dar kip");
    }
      return false
    },
  });

  Template.editIdea.events({
  'click .newText': function (evt, tmpl) {
     Session.set("newText", !(Session.get("newText")));
    },
  'click .newImage': function (evt, tmpl) {
      Session.set("newImage", !(Session.get("newImage")));
    },
  'click .done': function (evt, tmpl) {
     var currentIdea = Session.get("currentIdea");
      var newPitch = tmpl.find('#description').value;
      Meteor.call("updatePitch", newPitch, currentIdea);
      Router.go('ideaData');
      return true;
    },
  'change .image': function(event, template) {
    var currentIdea = Session.get("currentIdea");
    FS.Utility.eachFile(event, function(file) {
      im = Images.insert(file, function (err, fileObj) {
        //Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
        if(err){
          alert("Error al cargar el archivo");
        }
      });
      Meteor.call("addFile", im._id, currentIdea);
    });
  }
  });

  Template.loginForm.events({
    'click .tryLogin' : function (evt, tmpl) {
      evt.preventDefault();
      var username = tmpl.find('#username').value;
      var password = tmpl.find('#password').value;

      if(username=="" || password=="")
      {
        alert("Por favor llena los campos");
        return false;
      }

      Meteor.loginWithPassword(username, password,
        function(err){
          if (err)
          {
            //To do if login was not successfull
            alert("Usuario o contraseña incorrectos");
            return false;
          }
          else{
              //Suscribir a tipo de ideas que se mostraran en la pagina de ideas
              Router.go('ideas');
              ideas = Meteor.subscribe('similar_ideas', old_words);
              return false;
          }
        });
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
      var role_checkbox = document.getElementsByName("role");

      if(firstName=="" || lastName=="" || username=="" || password=="" || role_checkbox.length==0)
        {
          alert("Hay campos vacios");
          return false;
        }
            
      if(!email.match(/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/))      
        {
          alert("El correo electrónico no es válido");
          return false;
        }
      if(!password.match(/^\w*(?=\w*\d)(?=\w*[a-z])(?=\w*[A-Z])\w*$/))
      {
        alert("El password no es válido. Debe tener al menos una letra minúscula, una mayúscula y un número.")
        return false;
      }
      var roles=[];
      for (var i = 0; i < role_checkbox.length; i++)
      {
          if (role_checkbox[i].checked == true)
          {
              roles.push(role_checkbox[i].value);
          }
      }

      Accounts.createUser({
                          username:username,
                          email: email,
                          password : password,
                          profile: {
                                    firstName:firstName,
                                    lastName:lastName,
                                    roles:roles,
                                    words:[], //change name to tags
                                    ideas:[],
                                    comments:[],
                                    points:0,
                                  }
                          }, function(err){
                                          if (err)
                                          {
                                            // Inform the user that account creation failed
                                            alert("Algo salió mal, por favor inténtalo de nuevo");
                                            return false;
                                          }
                                          else 
                                          {
                                            // Success. Account has been created and the user
                                            // has logged in successfully.
                                            
                                            //Meteor.subscribe('similar_ideas', old_words);
                                             Meteor.subscribe("userData");
                                             Router.go('ideas');
                                          }
                          });
      return false;
    }
  });

  
  Template.main.showSimilarIdeas = function() {
    return Session.get("showSimilarIdeas");
  };

  Template.main.showNewIdea = function() {
    return Session.get("showNewIdea");
  };

  Template.editIdea.newText = function(){
    return Session.get("newText");
  };

  Template.editIdea.newImage = function(){
    return Session.get("newImage");
  };

   Template.similar_ideas.helpers({
    matching_idea: function(){
    //var tagsOfIdea = Session.get("tagsOfIdea");
    return Ideas.find({'peopleInvolved.users':{$nin:[Meteor.userId()]}});
    }
  });

  //All ideas
  Template.ideas.helpers({
    open_idea: function(id){
    return Ideas.find();
    }
  });

  //One idea
  Template.idea.helpers({
     canEdit: function(users, currentUserId) {
        for(var i=0; i < users.length; i++)
        {
           if(users[i]==currentUserId)
                return true;
        }
        return false;
        }
  });

  Template.editIdea.helpers({
      ideaData: function(){
        return Ideas.find({_id: Session.get('currentIdea')});
      }
  });

  Template.fileDisplay.helpers({
      fileFounded: function(idF){
        var im = Images.find({_id: idF});
        alert(im.name)
      }
  });
  Template.comments.helpers({
    commentToShow: function (idea) {
      var commentsToShow = Session.get("commentsToShow");
      var ideaId = idea._id;
      if(commentsToShow.indexOf(ideaId) != -1)
      {
        //all
        Meteor.subscribe("commentsOfIdea", ideaId);
        return Comments.find({idea: ideaId}, {sort: {points: -1}});
      }
      else
      {
        //show only five
        Meteor.subscribe("commentsOfIdea", ideaId);
        return Comments.find({idea: ideaId}, {sort: {points: -1}, limit: 5});
      }
    },

    commentData: function(commentId){
     Meteor.subscribe("comment", commentId);
    return Comments.find({_id: commentId});
    }
  });

  Template.people.helpers({
    user: function(){
    return Meteor.users.find({},{sort:{'profile.points':-1}});
    }
  });

  Template.persons.helpers({
    user: function(userId) {
    Meteor.subscribe("userProfile", userId);
    return  Meteor.users.find({_id: userId});
    }
  });

  Template.theUser.helpers({
  user: function() {
    return Meteor.users.find({_id:Meteor.userId()});
  }
  });

  Template.profile.helpers({
  user: function() {
    //return Meteor.users.find({_id:{$ne:Meteor.userId()}});
    return Meteor.users.find({_id: Session.get("userToShow")});
  },

  idea_data: function (ideaId) {
   Meteor.subscribe("ideaProfile", ideaId);
  return Ideas.find({_id: ideaId});
  },

  related_data: function (commentId) {
   Meteor.subscribe("comments", commentId);
  return Comments.find({_id: commentId});
  }

  });

  Template.ideaData.helpers({
  idea_to_show: function() {
    return Ideas.find({_id: Session.get("currentIdea")});
  },

  commentData: function (commentId) {
   Meteor.subscribe("comment", commentId);
  return Comments.find({_id: commentId});
  },
  user_data: function(userId){
    Meteor.subscribe("userProfile", userId);
    return Meteor.users.find({_id: userId});
  }

  });
}
/*********************************************************************************/
if (Meteor.isServer) { //Server Side

 
  Meteor.publish('similar_ideas', function(searchText) {

         var doc = {};

    var ideasIds = Meteor.call("searchIdeas",searchText);
   
    console.log(ideasIds)
    if(ideasIds.length > 0)
   {
        doc._id = {
            $in: ideasIds
        };

      var matchingIdeas = Ideas.find(doc,{sort:{lastScore:-1}});
      return matchingIdeas;
    }
    else
    {
      console.log("subscription has no results back");
      return Ideas.find({});
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

  Meteor.publish("comment", function (id) {
  console.log("publishing comment with id:");
  if (id) {
    console.log(id);
    return Comments.find({_id: id});
  } else {
    this.ready();
  }
  });

  Meteor.publish("commentsOfIdea", function (ideaId){
    console.log("publishing comments of idea with id:");
  if (ideaId) {
    console.log(ideaId);
    return Comments.find({idea: ideaId});
  } else {
    this.ready();
  }
  });

  Meteor.publish("allIdeas", function () {
  console.log("publishing all ideas");
  return Ideas.find();
  });

  Meteor.publish("allUsers", function () {
  console.log("publishing all users");
  return Meteor.users.find({},{sort:{'profile.points':-1}});
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
          Meteor.users.update({_id: userId},
          {$inc: {'profile.points':10}});
      },

      followIdea: function(userId, ideaId) {
          console.log('following Idea with id');
          console.log(ideaId);
          Meteor.users.update({_id: userId, 'profile.ideas':{$nin:[ideaId]}},
          {$push: {'profile.ideas':ideaId}});
          Ideas.update({_id: ideaId,'votedBy':{$nin:[userId]}},
          {$inc: {'points':1}, $push: {'votedBy':userId}});
      },

      increase: function(userId, commentId) {
        console.log("Vote by " + userId + "on");
         console.log(commentId);
          Comments.update({_id: commentId,'votedBy':{$nin:[userId]}},
          {$inc: {'points':1}, $push: {'votedBy':userId}});
      },

      decrease: function(userId, commentId) {
          console.log("Vote by " + userId + "on")
          console.log(commentId)
          Comments.update({_id: commentId,'votedBy':{$nin:[userId]}},
          {$inc: {'points':-1}, $push: {'votedBy':userId}});
      },

      addComment: function(userId, doc, currentIdea) {
          console.log('Adding Comment with doc');
          console.log(doc);
          console.log("currentIdea: ");
          console.log(currentIdea);
          var commentId = Comments.insert(doc);
          Ideas.update({_id: currentIdea},
          {$push: {'comments':commentId}});
          Meteor.users.update({_id: userId},
          {$push: {'profile.comments':commentId}});
          Meteor.users.update({_id: userId},
          {$inc: {'profile.points':5}});
      },

      updatePitch: function(newPitch, currentIdea) {
        console.log('Changing pitch of idea:');
        console.log(currentIdea);
        Ideas.update({_id: currentIdea},
          {$set: {'pitch': newPitch}});
      },

      addFile: function(fileId, currentIdea){
        Ideas.update({_id: currentIdea},
          {$push: {'files.id': fileId}});
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
