'use strict';

function equals(a, b) {
  return !!(JSON.stringify(a) === JSON.stringify(b));
}

window.testValue = 'ok';

window.testFunction = function(name) {
  if (name) {
    return 'ok ' + name;
  } else {
    return 'ok default';
  }
};

window.testFunctionCallback = function(name, callback) {
  if (typeof callback === 'function') {
    callback(name);
  }

  return 'returning callback';
};

window.parent = {
  postMessage: function(message) {
    testFrame.triggerMessage(JSON.stringify(message));
  },
  triggerMessage: function(message) {
    client.messageEventHandler.apply(client, [{
      origin: 'file://',
      data: JSON.parse(message)
    }]);
  },
  location: {
    origin: 'file://'
  }
};

var testFrame = {
  eventCallbacks: {},
  contentWindow: {
    postMessage: function(message) {
      window.parent.triggerMessage(JSON.stringify(message) );
    }
  },
  addEventListener: function(eventId, callback) {
    var self = this;
    if (typeof callback !== 'function') {
      throw new Error('testFrame.addEventListener expected callback as function');
    }
    // Check if we need the init the array
    if (typeof self.eventCallbacks[eventId] === 'undefined') {
      self.eventCallbacks[eventId] = [];
    }
    // Push to the array
    self.eventCallbacks[eventId].push(callback);
  },
  triggerEvent: function(eventId, payload) {
    var self = this;
    if (self.eventCallbacks[eventId]) {
      for (var i = 0; i < self.eventCallbacks[eventId].length; i++) {
        try {
          var callback = self.eventCallbacks[eventId][i];
          callback.apply(window, [payload]);
        }catch(err) {
        }
      }
    }
  },
  triggerMessage: function(message) {
    cordova.messageEventHandler.apply(cordova, [{
      origin: 'http://localhost:3000',
      data: JSON.parse(message)
    }]);
  },
  onload: function() {}
};






var cordova = new MeteorCordova('http://localhost:3000', {
  // This shell version
  version: '0.0.1',
  // Do we rely on appcache?
  appcache: false,
  debug: false,
  testFrame: testFrame
});

// Initialise the client last
var client = new Cordova({
  debug: false
});

Tinytest.add('MeteorCordova - test suite', function(test) {
  test.isTrue(typeof cordova.testFrame !== false, 'cordova is rigged for iframe no testFrame?');
});

/*
Tinytest.addAsync('MeteorCordova - load test, ', function (test, onComplete) {
  function load() {
    cordova.load(function(error) {
      // This should not return an error since we are running localhost
      test.isUndefined(error, 'This test excpects to run localhost');

      onComplete();
    });

  }

  load();
});

Tinytest.add('MeteorCordova - test handshake', function(test) {
  testFrame.onload({ event: 'test' });
  test.isTrue(cordova.handshakeActivated, 'The cordova handshake should be activated');
  test.isTrue(client.handshakeActivated, 'The client handshake should be activated');
});

Tinytest.add('MeteorCordova - Events', function(test) {
  var eventData = {
    data: 'Hej'
  };

  var counter = 0;
  var counterDeviceReady = 0;

  test.isUndefined(client.eventCallbacks['test'], 'Before we start the event callbacks list should be empty');
  test.isUndefined(client.oneTimeEvents['test']);

  // Add an event listener
  client.addEventListener('test', function(event) {
    counter++;
    test.isTrue( equals(event, eventData) );
  });

  test.isTrue(typeof client.eventCallbacks['test'][0] === 'function', 'We would expect the handler as 0');


  // Now we trigger the event with data
  testFrame.triggerEvent('test', eventData);
  testFrame.triggerEvent('test', eventData);
  test.equal(counter, 2, 'Normal events should run every time');


  test.isTrue(client.eventCallbacks['deviceready'] !== 'undefined', 'Before we start the event callbacks deviceready should exist');
  test.isTrue(client.eventCallbacks['deviceready'].length === 1, 'Before we start the event callbacks deviceready should have one initial event');
  test.isTrue(client.oneTimeEvents['deviceready']);

  client.addEventListener('deviceready', function(event) {
    counterDeviceReady++;
    test.isTrue( equals(event, eventData) );
  });


  // Test oneTime event
  testFrame.triggerEvent('deviceready', eventData);
  testFrame.triggerEvent('deviceready', eventData);

  test.equal(counterDeviceReady, 1, 'one time events should only be run once');
});

Tinytest.addAsync('MeteorCordova - call - variable', function (test, onComplete) {
  // Test variables
  client.call('window.testValue', [], function(value) {
    test.equal(value, 'ok');
    onComplete();
  });

  client.call('console.log', ['------ TEST CALL CONSOLE LOG ----------']);
});

Tinytest.add('MeteorCordova - call - function not found', function(test) {
  // Test variables
  var errors = 0;
  try {
    client.call('im.not.found.foo');
  } catch(err) {
    errors++;
  }

  test.equal(errors, 1, 'Call should throw an error the function does not exist');
});

Tinytest.addAsync('MeteorCordova - call - variable no args', function (test, onComplete) {
  // Test variables
  client.call('window.testValue', function(value) {
    test.equal(value, 'ok');
    onComplete();
  });
});

Tinytest.addAsync('MeteorCordova - call - method', function (test, onComplete) {
  // Test variables
  client.call('window.testFunction', [], function(value) {
    test.equal(value, 'ok default');
    onComplete();
  });
});

Tinytest.addAsync('MeteorCordova - call - method no args', function (test, onComplete) {
  // Test variables
  client.call('window.testFunction', function(value) {
    test.equal(value, 'ok default');
    onComplete();
  });
});

Tinytest.addAsync('MeteorCordova - call - method no args no callback', function (test, onComplete) {
  // Test variables
  window.testNoCallback = function() {
    onComplete();
  };

  // Call the function
  client.call('window.testNoCallback');
});

Tinytest.addAsync('MeteorCordova - call - method with param', function (test, onComplete) {
  // Test variables
  client.call('window.testFunction', ['hello'], function(value) {
    test.equal(value, 'ok hello');
    onComplete();
  });
});



Tinytest.addAsync('MeteorCordova - call - method with callback param', function (test, onComplete) {
  var counter = 0;

  function complete() {
    counter++;
    if (counter === 2) {
      onComplete();
    }
  }

  // Test variables
  client.call('window.testFunctionCallback', ['hello', function(value) {
    // this is a function as parametre
    test.equal(value, 'hello');
    complete();
  }], function(value) {
    // Test the returning callback
    test.equal(value, 'returning callback');
    complete();
  });

});

// Test for no returning callbacks....
Tinytest.addAsync('MeteorCordova - call - method with callback param no returning', function (test, onComplete) {

  // Test variables
  client.call('window.testFunctionCallback', ['hello', function(value) {
    // this is a function as parametre
    test.equal(value, 'hello');
    onComplete();
  }]);

});


Tinytest.addAsync('MeteorCordova - call - test this.remove', function (test, onComplete) {
  var aCalled = 0;
  var bCalled = 0;
  var cCalled = 0;
  var returnCalled = 0;

  window.testFunctionCallback5 = function(callA, callB, callC) {
    callA();
    callA(); // this should run
    callB();
    callC();
    return 'returning callback';
  };


  function functionA() {
    this.remove();
    aCalled++;
  }

  function functionB() {
    bCalled++;
    this.removeAll();
  }

  function functionC() {
    test.fail('This function should never run?');
    cCalled++;
  }

  // Test variables
  client.call('testFunctionCallback5', [functionA, functionB, functionC], function(value) {
    // Test the returning callback
    test.equal(value, 'returning callback');
    returnCalled++;
  });

  Meteor.setTimeout(function() {
    test.equal(aCalled, 1, 'A should be called once');
    test.equal(bCalled, 1, 'B should be called once');
    test.equal(cCalled, 0, 'C should not be called');
    test.equal(returnCalled, 0, 'Return should not be called');
    onComplete();
  }, 100);
});

// Test for no returning callbacks....
Tinytest.addAsync('MeteorCordova - call - method with callback arguments', function (test, onComplete) {

  var funcCordova = 0;
  var funcClient = 0;
  var funcReturn = 0;

  window.testFunctionCallback6 = function(callA) {
    funcCordova++;
    callA({message: 'you got mail' });
    return 'hello';
  };

  var clientCallback = function(message) {
    test.equal('you got mail', message.message, 'Message is not correct');
    funcClient++;
  };

  // Test variables
  client.call('testFunctionCallback6', [clientCallback], function(value) {
    // this is a function as parametre
    test.equal(value, 'hello');
    funcReturn++;
  });

  Meteor.setTimeout(function() {
    test.equal(funcCordova, 1, 'funcCordova should be called once');
    test.equal(funcClient, 1, 'funcClient should be called once');
    test.equal(funcReturn, 1, 'funcReturn should be called once');
    onComplete();
  }, 100);

});


Tinytest.add('MeteorCordova - clone', function(test) {
  var date = new Date();
  var c = { d: 'test', q: { test: 'test' } };

  c.circular = c;

  var a = {
    bool: false,
    nr: 10,
    neg: -10,
    real: 0.32,
    str: 'text',
    obj: {
      c: 'ok',
      d: {
        e: 'okay'
      }
    },
    func: function() { return 'function called'; },
    date: date,
    nul: null,
    undef: undefined,
    c1: c,
    c2: c
  };

  a.global = window;

  a.circular = a;

  var b = {
    bool: false,
    nr: 10,
    neg: -10,
    real: 0.32,
    str: 'text',
    obj: {
      c: 'ok',
      d: {
        e: 'okay'
      }
    },
    //func: 'function called', // Removed
    date: new Date(date.getTime()),
    nul: null,
    undef: undefined,
    c1: { d: 'test', q: { test: 'test' } },
    c2: { d: 'test', q: { test: 'test' } }
  };

  var aCloned = EJSON.clone(a);

  test.equal(JSON.stringify(aCloned), JSON.stringify(b), 'clone didnt return as expected');
});*/
//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equalactual, expected, message, not
//test.length(obj, len)
//test.include(s, v)
//test.isNaN(v, msg)
//test.isUndefined(v, msg)
//test.isNotNull
//test.isNull
//test.throws(func)
//test.instanceOf(obj, klass)
//test.notEqual(actual, expected, message)
//test.runId()
//test.exception(exception)
//test.expect_fail()
//test.ok(doc)
//test.fail(doc)
//test.equal(a, b, msg)
