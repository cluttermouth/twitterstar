/******************************************************************************

I drafted this application to demonstrate a nearly fully client-side app using
the observer pattern.  The server is a nearly empty rails app with a simple
proxy.  The client side uses a pub-sub class I wrote once (Q.proxy) to tie
changes in the model to updates in the view.  It also uses a DOM generation
library I wrote called Dominate (T.div, etc).

A few cool examples:

// Once you're logged in, you can do cool stuff like modify the model and watch it update the view in real time.  Try this in firebug:
ts.model.run('check_statuses'); //only interesting if you have a new status posted

// or
ts.model.set('loading', true);
setTimeout(ts.model.setter('loading', false), 500);

// or
ts.model.set('current_profile', 1183041);
ts.model.set('current_page', 'profile');

// or
ts.model.set('statuses', [{
  "user":{
    "screen_name":"adage",
    "id":11630327233,
    "profile_image_url":"http://a3.twimg.com/profile_images/56448039/adage_logo_for_twitter_v3_normal.jpg"
  },
  "text":"Wow, what a cool observer pattern!"
}]);


Tested on a mac in Firefox 3.5.9, on and Chrome 5.0.342.7, and Safari 4.0.5.


Some known limitations to this implementation:
- DOM manufacturing in JavaScript can be quite slow
- I'm triggering full refreshes of the 'statuses' div on update, rather than
smartly shuffling the new ones in the right places
- In keeping with the client-side approach, I'm storing user credentials in
cookies, and then SENDING THEM IN PLAINTEXT to the server.  This is crazy
insecure.
- this home-grown framework is definitely overkill for the features I've
implemented here, but what a conversation starter

todo:
- investigate all possible error responses the server might send back
- error checking for privacy of profiles the user visits
- implement suggestions from character counting faq
- public timeline

*/


// Define the application namespace
var ts = {};
ts.constants = {
  'status_check_interval' : 60000
};

// Model

ts.model = (function (){
  // the seed is the generic storage location of all model data.
  var seed = {};
  // the proxy acts as an interface to the public, and is ultimately returned by this anonymous function
  // this allows the views to subscribe for updates to the model
  var proxy = Q.proxy(seed);
  seed.statuses = [];

  seed.get_username     = function (){
    return $.cookieJSON('username');
  };
  seed.set_username     = function (input){
    $.cookieJSON('username', input);
  };
  seed.get_password     = function (){
    return $.cookieJSON('password');
  };
  seed.set_password     = function (input){
    $.cookieJSON('password', input);
  };
  seed.get_is_signed_in = function (){
    return $.cookieJSON('is_signed_in');
  };
  seed.set_is_signed_in = function (input){
    $.cookieJSON('is_signed_in', input);
  };
  seed.set_current_page = function(input){
    seed.current_page = input;
    proxy.set('loading', true);
    proxy.run('check_statuses', [function(){
      proxy.set('loading', false);
    }, function(){
      proxy.set('loading', false);
    }]);
  };

  seed.init = function (){
    if(proxy.get('is_signed_in')){
      proxy.set('current_page', 'home');
    }
    setInterval(proxy.runner('check_statuses'), ts.constants.status_check_interval);
  };

  seed.sign_in = function (){
    ts.model.set('loading', true);
    ts.api('GET', 'statuses/home_timeline', function (response){
      proxy.set('sign_in_failed', false);
      proxy.set('is_signed_in', true);
      proxy.set('current_page', 'home');
      proxy.run('check_statuses');
    }, function(response){
      ts.model.set('loading', false);
      proxy.set('sign_in_failed', true);
    });
  };

  seed.update_status = function(){
    if( ! proxy.get('new_status') || proxy.get('updating_status') ){ return; }
    proxy.set('updating_status', true);
    ts.api('POST', 'statuses/update', {'status':proxy.get('new_status')}, function (response){
      proxy.set('new_status', '');
      proxy.set('updating_status', false);
      seed.check_statuses();
    },function (response){
      proxy.set('updating_status', false);
      alert('Error posting status');
    });
  };

  seed.show_my_profile = function(){
    proxy.set('current_page', 'profile');
    proxy.set('current_profile', proxy.get('username'));
  };

  seed.show_profile = function(username){
    proxy.set('current_profile', username);
    proxy.set('current_page', 'profile');
  };

  seed.sign_out = function (){
    proxy.set('username', null);
    proxy.set('password', null);
    proxy.set('is_signed_in', null);
  };

  seed.check_statuses = function (success_callback, failure_callback){
    var call, args = {}, current_page = proxy.get('current_page'), method = 'GET';
    if( current_page === 'home' ){
      call = 'statuses/home_timeline';
    }else if( current_page === 'profile' ){
      call = 'statuses/user_timeline';
      args = {'id':proxy.get('current_profile')};
    }else{
      return;
    }
    ts.api(method, call, args, function (response){
      if( ! Q.type_of(response, 'array') ){ Q.error('Empty response?'); return; }
      proxy.set('statuses', response);
      if(success_callback){
        success_callback(response);
      }
    },function (response){
      if(failure_callback){
        failure_callback(response);
      }
    });
  };

  return proxy;
}());



// View
ts.view = {};

ts.view.main = function (){
  if( ts.view.main.result ){ return ts.view.main.result; }

  var result = ts.view.main.result = T.div({'id':'main'},
    ts.view.sign_in(),
    ts.view.header(),
    ts.view.status_updater(),
    ts.view.statuses()
  );

  return result;
};

ts.view.sign_in = function (){
  if( ts.view.sign_in.result ){ return ts.view.sign_in.result; }

  var result = ts.view.sign_in.result = K.displayed_when_value(ts.model, 'is_signed_in', function(val){ return val !== true; },
    K.enterable(ts.model.runner('sign_in'),
      T.div({'id':'sign_in'},
        ts.view.app_loading(),
        T.div({'class':'sign_in_input'},
          T.label({'for':'username'}, 'Username: '),
          K.pubsub_input(ts.model, 'username',
            T.input({'id':'username', 'type':'text', 'name':'username'})
          )
        ),
        T.div({'class':'sign_in_input'},
          T.label({'for':'password'}, 'Password: '),
          K.pubsub_input(ts.model, 'password',
            T.input({'id':'password', 'type':'password', 'name':'password'})
          )
        ),
        T.div({'class':'sign_in_input'},
          T.input({'type':'submit', 'value':'Sign in', 'onclick':ts.model.runner('sign_in')})
        ),
        K.visible_when_value(ts.model, 'sign_in_failed', function(val){ return val === true; },
          T.div({'id':'sign_in_failed'}, 'Sorry, bad combo - try again')
        ),
        T.clearfix()
      )
    )
  );

  return result;
};

ts.view.status_updater = function (){
  if( ts.view.status_updater.result ){ return ts.view.status_updater.result; }

  var result = ts.view.status_updater.result = K.displayed_when_value(ts.model, ['current_page', 'is_signed_in'], function(current_page, is_signed_in){ return current_page === 'home' && is_signed_in; },
    K.enterable(ts.model.runner('update_status'),
      T.div({'id':'status_updater'},
        T.div({'id':'status_submitter'}, T.input({'type':'submit', 'value':'Update!', 'onclick':ts.model.runner('update_status')})),
        T.div({'id':'status_prompt'}, 'What\'s shakin?'),
        T.div({'id':'new_status_holder'},
          K.pubsub_input(ts.model, 'new_status',
            T.input({'type':'text','id':'status_field'})
          )
        )
      )
    )
  );

  return result;
};

ts.view.header = function (){
  if( ts.view.header.result ){ return ts.view.header.result; }

  var result = ts.view.header.result = K.displayed_when_value(ts.model, 'is_signed_in', function(val){ return val === true; },
    T.div({'id':'header'},
      T.div({'class':'nav_link', 'onclick':ts.model.runner('sign_out')},
        T.a({'href':'#'}, 'Sign out')
      ),
      T.div({'class':'nav_link', 'onclick':ts.model.runner('show_my_profile')},
        T.a({'href':'#'}, 'Profile')
      ),
        T.div({'class':'nav_link', 'onclick':ts.model.setter('current_page', 'home')},
        T.a({'href':'#'}, 'Home')
      ),
      ts.view.app_loading(),
      'Welcome, ',K.subscribing_container(ts.model, 'username', T.span({'onclick':ts.model.runner('show_my_profile')})),'!'
    )
  );

  return result;
};

ts.view.app_loading = function(){
  return T.div({'class':'app_loading'},
    K.displayed_when_value(ts.model, 'loading', function(value){ return value === true; },
      T.img({'src':'/images/loader.gif'})
    ),
    K.displayed_when_value(ts.model, 'loading', function(value){ return value !== true; },
      T.img({'src':'/images/nonloader.gif'})
    )
  );
};

ts.view.statuses = function (){
  if( ts.view.statuses.result ){ return ts.view.statuses.result; }

  var result = ts.view.statuses.result = K.displayed_when_value(ts.model, 'is_signed_in', function(val){ return val === true; },
    T.div({'class':'statuses'},
      K.displayed_when_value(ts.model, ['loading', 'statuses'], function(loading, statuses){ return !loading && statuses.length; },
        K.subscribing_list(ts.model, 'statuses', T.ul(),
          function (which, status){
            return ts.view.status(status);
          }
        )
      ),
      K.displayed_when_value(ts.model, ['loading', 'statuses'], function(loading, statuses){ return !loading && !statuses.length; },
        T.div({'id':'no_statuses'},
          'Sorry, no statuses here!'
        )
      )
    )
  );

  return result;
};

ts.view.status = function (status){
  var show_profile_runner = ts.model.runner('show_profile', [status.user.id]);
  var result = T.div({'class':'status'},
    T.img({'class':'status_profile_image', 'src':status.user.profile_image_url, 'onclick':show_profile_runner}),
    T.div({'class':'status_body'},
      T.span({'class':'status_username', 'onclick':show_profile_runner}, T.a({'href':'#'},status.user.screen_name)),
      status.text
    ),
    T.clearfix()
  );

  return result;
};
ts.view.status.results = {};






// api wrapper

ts.api = function (method, command, args, success_callback, failure_callback){
  if(Q.type_of(args, 'function')){ // allows you to leave off the args parameter, like the $.post call does
    failure_callback = success_callback;
    success_callback = args;
    args = {};
  }
  $.ajax({
    'url' : 'proxy',
    'type' : method,
    'data' : Q.extend(args,{
      'command':'/1/'+command+'.json',
      'username':ts.model.get('username'),
      'password':ts.model.get('password')
    }),
    'success' : success_callback,
    'error' : failure_callback,
    'dataType' : 'json'
  });
};







////////////////////
// initialize the document when ready
$(document).ready(function (){
  ts.model.run('init');
  $('body').html(ts.view.main());
});



