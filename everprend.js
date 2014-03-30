Ideas = new Meteor.Collection("ideas")

if (Meteor.isClient) {


  Template.navigation.events({
    'click .home': function (evt, tmpl) {
      Session.set("showPeople", false)
      return false
    }
  });

   Template.main.events({
    'click .login': function (evt, tmpl) {
      Session.set("showLogin", !Session.get("showLogin"));
      Session.set("showNewUser", false);
      return false
    },
    'click .newUser': function (evt, tmpl) {
      Session.set("showNewUser", !Session.get("showNewUser"));
      Session.set("showLogin", false);
      return false
    },

    'click .signup' : function(evt, tmpl){
      Session.set("showRegisterForm", !Session.get("showRegisterForm"));
      return false
    },

    'click .ready' : function (evt, tmpl) {

      var idea = document.getElementById("idea").value;
      // Posible busqueda de nombres existentes
      var nameOfIdea = document.getElementById("nameOfIdea").value;
      //Separacion de tags
      var tagsOfIdea = document.getElementById("tagsOfIdea").value;
      var doc = {idea: idea, name: nameOfIdea, tags: tagsOfIdea, referrer: document.referrer, timestamp: new Date()}
      var words = tagsOfIdea.replace(',',' ');
      Meteor.subscribe('people_to_contact', words); //Al parecer se van a estar actualizando siempre los resultados que verá, no parece tan malo,
      //requiere su lógica, 
      Meteor.call("insertIdea", doc);
      Session.set("showRegisterForm", false);
      Session.set("showPeople", true);
      return false
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

 Template.registerForm.showLogin = function() {
  return Session.get("showLogin");
  };

  Template.registerForm.showNewUser = function() {
  return Session.get("showNewUser");
  };

  Template.people.helpers({
  people_to_contact: function() {
  return Ideas.find({});
  }
  });
}

if (Meteor.isServer) {

  Meteor.publish('people_to_contact', function(searchText) {
         var doc = {};
    var ideasIds = Meteor.call("searchPeople",searchText);
    if (ideasIds) {
        doc._id = {
            $in: ideasIds
        };
    }
    return Ideas.find(doc);
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
        tags: 'text'
    }, {
        name: 'peopleFinder'
    });
  });

    Meteor.methods({
      insertIdea: function(doc) {
          console.log('Adding Idea');
          Ideas.insert(doc);
      },

      _searchPeople: function (searchText) {
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
        if (results && results.documents[0].ok === 1) {
          future.return(results.documents[0].results);
          console.log(results.documents[0].results[0].obj)
          }
          else {
              future.return("{}");
              console.log("Error in text search")
          }
      });
      return future.wait();
      },

      // Helper that extracts the ids from the search results
      searchPeople: function (searchText) {
      if (searchText && searchText !== '') {
          console.log('Searching...');
          var searchResults = Meteor.call("_searchPeople", searchText);
          console.log('Results back');
          var ids = [];
          for (var i = 0; i < searchResults.length; i++) {
              ids.push(searchResults[i].obj._id);
          }
          return ids;
      }
      }
  });



  // Meteor.publish('persons', function(searchText) {
  //   var doc = {};
  //   var peersonsIds = searchPersons(searchText);
  //   if (personsIds) {
  //       doc._id = {
  //           $in: personsIds
  //       };
  //   }
  //   return Ideas.find(doc);
  // });
}
