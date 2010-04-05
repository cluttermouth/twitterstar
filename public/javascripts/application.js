/******************************************************************************

I drafted this application up because I thought you might find a fully client-
side architecture interesting.  The server is a nearly empty rails app with a
very simple proxy.  The client side uses a pub-sub class I wrote once (Q.proxy)
to tie changes in the model to updates in the view.  It also uses a DOM
generation library I wrote called Dominate (T.div, etc).

Once you're logged in, you can do cool stuff like modify the model and watch it
update the view in real time.  Try:
  ts.model.set('is_signed_in', false);
This will put some app-level assumptions in jeapordy, so you'll have to set it
to true again before going on, but it demonstrates the active attention that
the element widgets are paying to the model.

Some known limitations to this implementation:
- DOM manufacturing in JavaScript can be quite slow
- I'm triggering full refreshes of the 'statuses' div on update
- In keeping with the client-side approach, I'm storing user credentials in
cookies, though is insecure
- this home-grown framework is definitely overkill for the features I've
implemented here, but what a conversation starter

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

  seed.init = function (){
    if(proxy.get('is_signed_in')){
      proxy.set('current_page', 'home');
      proxy.run('check_statuses');
    }
    setInterval(proxy.runner('check_statuses'), ts.constants.status_check_interval);
  };

  seed.sign_in = function (){
    ts.api('statuses/home_timeline', function (response){
      proxy.set('sign_in_failed', false);
      proxy.set('is_signed_in', true);
      proxy.set('current_page', 'home');
      proxy.run('check_statuses');
    }, function(response){
      proxy.set('sign_in_failed', true);
    });
  };

  seed.sign_out = function (){
    proxy.set('username', null);
    proxy.set('password', null);
    proxy.set('is_signed_in', null);
  };

  seed.check_statuses = function (success_callback, failure_callback){
    var call;
    if( proxy.get('current_page') === 'home' ){
      call = 'statuses/home_timeline';
    }else{
      return;
    }
    ts.api(call, function (response){
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
    ts.view.statuses()
  );

  return result;
};

ts.view.sign_in = function (){
  if( ts.view.sign_in.result ){ return ts.view.sign_in.result; }

  var result = ts.view.sign_in.result = K.displayed_when(ts.model, 'is_signed_in', function(val){ return val !== true; },
    K.enterable(ts.model.runner('sign_in'),
      T.div({'id':'sign_in'},
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
        K.visible_when(ts.model, 'sign_in_failed', function(val){ return val === true; },
          T.div({'id':'sign_in_failed'}, 'Sorry, try again')
        ),
        T.clearfix()
      )
    )
  );

  return result;
};

ts.view.header = function (){
  if( ts.view.header.result ){ return ts.view.header.result; }

  var result = ts.view.header.result = K.displayed_when(ts.model, 'is_signed_in', function(val){ return val === true; },
    T.div({'id':'header'},
      T.div({'class':'nav_link', 'onclick':ts.model.runner('sign_out')},
        'Sign out'
      ),
      T.div({'class':'nav_link', 'onclick':ts.model.runner('show_profile')},
        'Profile'
      ),
      T.div({'class':'nav_link', 'onclick':ts.controller.runner('on_click_home')},
        'Home'
      ),
      K.visible_when(ts.model, 'loading', function(value){ return value === true; },
        T.img({'id':'loading', 'src':'/images/loader.gif'})
      ),
      'Welcome, ',K.subscribing_container(ts.model, 'username', T.span()),'!'
    )
  );

  return result;
};


ts.view.statuses = function (){
  if( ts.view.statuses.result ){ return ts.view.statuses.result; }

  var result = ts.view.statuses.result = K.displayed_when(ts.model, 'is_signed_in', function(val){ return val === true; },
    T.div({'class':'statuses'},
      K.subscribing_list(ts.model, 'statuses', T.ul(),
        function (which, status){
          return ts.view.status(status);
        }
      )
    )
  );

  return result;
};

ts.view.status = function (status){
  if( ts.view.status.results[status.id] ){ return ts.view.status.results[status.id]; }

  var result = ts.view.status.results[status.id] = T.div({'class':'status'},
    T.img({'class':'status_profile_image', 'src':status.user.profile_image_url}),
    T.div({'class':'status_body'},
      T.span({'class':'status_username'}, status.user.name),
      status.text
    ),
    T.clearfix()
  );

  return result;
};
ts.view.status.results = {};



ts.controller = (function(){
  var seed = {};
  var proxy = Q.proxy(seed);

  seed.on_click_home = function(){
    ts.model.run('check_home_timeline');
    ts.model.set('home_timeline');
  };

  return proxy;
}());





// api wrapper

ts.api = function (command, args, success_callback, failure_callback){
  if(Q.type_of(args, 'function')){ // allows you to leave off the args parameter, like the $.post call does
    failure_callback = success_callback;
    success_callback = args;
    args = {};
  }
  $.ajax({
    'url' : 'proxy',
    'type' : 'POST',
    'data' : {
      'command':'/1/'+command+'.json',
      'username':ts.model.get('username'),
      'password':ts.model.get('password')
    },
    'success' : success_callback,
    'failure' : failure_callback,
    'dataType' : 'json'
  });
};







////////////////////
// initialize the document when ready
$(document).ready(function (){
  ts.model.run('init');
  $('body').html(ts.view.main());
});



