if (Meteor.isClient) {

  Template.navigation.events({
    'click .home': function (evt, tmpl) {
      Session.set("showRegisterForm", false);
      return false
    }, 
    'click .signup' : function(evt, tmpl){
      Session.set("showRegisterForm", true);
      return false
    }
  });

  Template.welcome.events({
    'click .login': function (evt, tmpl) {
      Session.set("showLogin", !Session.get("showLogin"));
      return false
    }, 
    'click .signup' : function(evt, tmpl){
      Session.set("showRegisterForm", !Session.get("showRegisterForm"));
      return false
    }
  });

   Template.registerForm.events({
    'click .login': function (evt, tmpl) {
      Session.set("showLogin", !Session.get("showLogin"));
      Session.set("showNewUser", false);
      return false
    },
    'click .newUser': function (evt, tmpl) {
      Session.set("showNewUser", !Session.get("showNewUser"));
      Session.set("showLogin", false);
      return false
    }
  });

  Template.welcome.showLogin = function() {
    return Session.get("showLogin");
  };

  Template.main.showRegisterForm = function() {
    return Session.get("showRegisterForm");
  };

 Template.registerForm.showLogin = function() {
  return Session.get("showLogin");
  };

  Template.registerForm.showNewUser = function() {
  return Session.get("showNewUser");
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
