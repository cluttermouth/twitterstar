////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//// Kwidgets - Marcus Phillips 2009
//// HTML Widgets with some kick
////
//// Requires: Qombat, Dominate, jQuery
////
//// Version ~0.1
//// Please report any bugs to qombat@marcusphillips.com
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

(function(){

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// Setup

  var Q = QOMBAT.queries;
  var K = QOMBAT._initialize_module({
    NAME : 'kwidgets',
    SHORTCUT : 'K',
    DELEGATE : undefined
  });

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////










  // binds the callback to an enter keypress on all input elements
  K.enterable = function(callback, root_element){
    $(root_element).delegate('*', 'keydown', function(event){
      if(event.keyCode === Q.keycodes.enter){
        callback(event);
      }
    });
    return root_element;
  };

  // inserts the value of some property in a proxy object and updates it as that value changes
  // accepts:
  //   - proxy: a qombat proxy object
  //   - key: the key to register listening for
  //   - container: the element to populate with the value from proxy.get(key)
  K.subscribing_container = function(proxy, key, container){
    jq_container = $(container);
    proxy.subscribe('did_change '+key, function(){
      jq_container.html(proxy.get(key));
    });
    jq_container.html(proxy.get(key));
    return container;
  };

  // K.publishing_input accepts a callback and an input field.  Every time the input's value changes, it calls the callback with the value as an argument
  K.publishing_input = function(updater,field){//todo: expand to other element types
    var submit = function(){updater(field.value); };
    $(field).keyup(submit).keypress(submit).change(submit);
    return field;
  };

  // unlike K.publishing_input, K.pubsub_input depends on the Q.proxy object interface.  It publishes its changes to the value at 'key' in the proxy, and also subscribes for changes to it
  K.pubsub_input = function(proxy, key, field){
    K.publishing_input(proxy.setter(key), field);
    var jq_field = $(field);
    proxy.subscribe('did_change '+key, function(){
      var new_val = proxy.get(key);
      if( jq_field.val() !== new_val){
        jq_field.val(new_val);
      }
    });
    return field;
  }

  // accepts
  //   - proxy: a qombat proxy object
  //   - key: a key for proxy that holds an array
  //   - container: an element to hold all the rendered items
  //   - item_template: a function that generates a dom node from an element of an array
  //     accepts: index, and one element of the array
  //     returns: a generated dom node
  // returns
  //   - the same element, with the auto-populating functionality enabled
  K.subscribing_list = function(proxy, key, container, item_template){
    var populate_items = function (){
      var results = [];
      Q.each(proxy.get(key), function (which, item){
        results.push(item_template(which, item));
      })
      $(container).html(results);
    };
    proxy.subscribe('did_set '+key, populate_items);
    populate_items();
    return container;
  };

  // accepts
  //   - a qombat proxy object
  //   - a key (or list of keys) to listen to, and
  //   - condition: a function to determine whether or not to reveal the element.  it will be passed the values at locations of [keys] (or key) at change time for any one of them
  //   - an element that will be obscured or not
  // returns
  //   - the same element, with the hiding functionality enabled
  K.visible_when_value = function(proxy, keys, condition, element){
    keys = Q.pluralized(keys);
    var jq_element = $(element), am_hiding = false;
    var previous_state = jq_element.css('visiblity');
    var toggle = function(){
      var vals = Q.results(keys, function(which, key){
        return proxy.get(key);
      });
      if( condition.apply({}, vals) ){
        jq_element.css('visibility', previous_state);
        am_hiding = false;
      }else if(! am_hiding){
        previous_state = jq_element.css('visibility');
        jq_element.css('visibility', 'hidden');
        am_hiding = true;
      }
    };
    Q.each(keys, function(which, key){
      proxy.subscribe('did_change '+key, toggle);
    });
    toggle();
    return element;
  };


  // accepts
  //   - a qombat proxy object
  //   - a key (or list of keys) to listen to
  //   - condition: a function to determine whether or not to reveal the element.  it will be passed the values at locations of [keys] (or key) at change time for any one of them
  //   - an element that will be obscured or not
  // returns
  //   - the same element, with the hiding functionality enabled
  // todo: factor out commonality with this and visible_when_value
  K.displayed_when_value = function(proxy, keys, condition, element){
    keys = Q.pluralized(keys);
    var jq_element = $(element), am_hiding = false;
    var previous_state = jq_element.css('visiblity');
    var toggle = function(){
      if(keys.length === 2){
        var a = 3;
      }
      var vals = Q.results(keys, function(which, key){
        return proxy.get(key);
      });
      if(condition.apply({}, vals )){
        jq_element.css('display', previous_state);
        am_hiding = false;
      }else if(! am_hiding){
        previous_state = jq_element.css('display');
        jq_element.css('display', 'none');
        am_hiding = true;
      }
    };
    Q.each(keys, function(which, key){
      proxy.subscribe('did_change '+key, toggle);
    });
    toggle();
    return element;
  };



  // some old school ideas

  /*
  K.live_container = function(callback_accepter, container, template){
    var callback = function(){
      $(container).html(template());
    };
    callback_accepter(callback);
    callback();
    return container;
  };

  K.live_output = function(callback_accepter, element){
    var callback = function(new_value){ $(element).html(new_value); };
    callback_accepter(callback);
    return element;
  };
  */

}())
