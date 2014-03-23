if (Meteor.isClient) {

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

  Template.welcome.showLogin = function() {
    return Session.get("showLogin");
  };

  Template.main.showRegisterForm = function() {
    return Session.get("showRegisterForm");
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
