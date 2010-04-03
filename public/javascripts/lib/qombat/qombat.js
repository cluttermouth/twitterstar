////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//// QOMBAT Queries - Marcus Phillips 2009
//// JavaScript language extensions and helpers
////
//// Version ~0.1
//// Please report any bugs to qombat@marcusphillips.com
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// todo: this QOMBAT variable should be the same as the Q variable
if( QOMBAT === undefined ){
  var QOMBAT = {
    // options may include
    //   NAME: the name that the module will be given within the qombat namespace - ie QOMBAT[options.NAME] => this is where you will can it
    //   SHORTCUT: a string that will be defined in the global namespace for accessing this module directly
    //   DELEGATE: a member of the module that the module will deferr to if called directly.  i.e. QOMBAT.my_module(4,5) => QOMBAT.my_module[options.DELEGATE](4,5)
    '_initialize_module' : function( options ){
      if( ! options.NAME ){ throw 'please name the module'; }
      if( typeof(QOMBAT[options.NAME]) !== 'undefined' && console ){ console.log('The '+options.NAME+' module of the QOMBAT library is already defined'); }
      var module = options.DELEGATE ? function(){ return module[options.DELEGATE].apply({}, arguments); } : {};
      module._options = options;
      module._previous_version = QOMBAT[options.NAME];
      QOMBAT[options.NAME] = module;
      if( options.SHORTCUT ){ window[options.SHORTCUT] = module; }
      return module;
    }
  };
}

(function(){

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// Setup

  var Q = QOMBAT._initialize_module({
    NAME : 'queries',
    SHORTCUT : 'Q'
  });

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// language basics

  // value: an object whose type is under scrutiny
  // matchers (optional): a name or list of names of valid types.  if supplied, Q.type_of will return a boolean reflecting whether the objects type was among them
  // todo: consider:
  //  function isArray(o) {
  //    return Object.prototype.toString.call(o) === '[object Array]'; 
  //  }
  Q.type_of = function( value, matchers, seeking_match ){
    var guess = typeof value;
    var type =
      guess !== 'object' ? guess : // any var not typed as an 'object' is correctly guessed
      value === null ? 'null' : // a falsey var guessed as 'object' is null
      ! Q.has_builtin(value, 'length') ? 'object' : // a non-null var guessed as 'object' without an unenumerable length is an object
      value.splice ? 'array' : // a non-null, non-object var guessed as 'object' and containing a splice method is an array
      'arguments'; // a non-null, non-object, non-array guessed as 'object' is an arguments array
      //todo: check for nodeType (to avoid dom matching)
    if( arguments.length < 2 ){ return type; }
    if( typeof matchers === 'string' ){ matchers = [matchers]; } // must use custom pluralization to avoid recursion
    for( var which in matchers ){
      if( type === matchers[which] ){
        return Boolean(Q.defaulted(seeking_match, true));
      }
    }
    return false;
  };

  Q.has_builtin = function( item, key ){ return item[key] !== undefined  && ! item.propertyIsEnumerable(key); };

  Q.defaulted = function( current_value, default_value ){
    if( arguments.length < 2 ){ throw 'Q.defaulted() requires at least 2 arguments'; }
    return (current_value === undefined) ? default_value : current_value;
  };

  // todo: make sure q.defaults does (doesnt?) alter the object passed into it
  Q.defaults = function( focus, defaults ){ // todo: make this one of the iterators?
    focus = Q.defaulted(focus, {});
    for( var which in defaults ){ if( defaults.hasOwnProperty(which) ){
      focus[which] = Q.defaulted(focus[which], defaults[which]);
    }}
    return focus;
  };

  Q.leaf = function(scope, key){
    while( Q.type_of(scope[key]) ){ scope = scope[key]; }
    return scope;
  };

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// object orientation helper methods


  Q.child = function(parent, traits){ return Q.inherit_from({}, parent, traits); };

  Q.prototyped = function ( parent ){
    var child = function(){};
    child.prototype = parent;
    return new child();
  };

  // inherit takes the members of the parent object that are named in the traits object and adds them to the child.
  //  if traits is an array, then all members of the names in the array will be copied.  if traits is a mapping of keys to values, then the members with name===key will be assigned to the child with the name [value]
  Q.inherit = function(child, parent, traits){ // todo: add a trait renaming option // todo: make it loop through arguments inheriting from multiple scopes
    traits = Q.defaulted(traits, Q.keys(parent)); // if no traits object is passed, absorb all traits
    if( Q.type_of(traits, 'string') ){ traits = {traits : traits}; } // make a mapping of the format key:key so that the child will inherit without name conversion
    if( Q.type_of(traits, 'list'  ) ){ traits = Q.reduce({}, traits, function(reduction, which, trait){ reduction[trait]=trait; }); } // same for a list of strings
    Q.traverse(traits, function( which, trait ){ child[trait] = parent[which]; });
    return child;
  };


  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// event and flow control

  Q.apply_all = function( functions, scope, args ){
    return Q.results(functions, function(which, each){
      return each.apply(scope, args);
    });
  };

  // after executes a set of consequences exactly once after a set of conditions have all called back
  // conditions: a set of functions to be called at the outset of the pattern.  they will be passed a single callback argument that they must execute when they have finished.  their return value will be discarded
  // consequences: a set of functions to be called back after each of the conditions has answered back once
  Q.after = function( conditions, consequences ){
    var satisfaction = 0, satisfieds={};
    conditions = Q.pluralized(conditions); consequences = Q.pluralized(consequences);
    var satisfy = function(which){
      if( ! satisfieds[which] ){ satisfaction++; }
      satisfieds[which] = true;
      if( satisfaction === conditions.length ){ Q.qpply_all(consequences); }
    };
    Q.each(conditions, function(which, condition){ condition(function(){satisfy(which);}); });
  };

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// Numbers

  // note - rounds off fractions of pennies
  Q.in_dollars = function( price ){ // price is in cent notation
    var dollars = Math.floor(price/100).toString();
    var cents = Math.floor(price - dollars*100).toString();
    if( cents.length < 2 ){
      cents = '0'+cents;
    }
    return [dollars,cents];
  };

  // note - rounds off fractions of pennies
  Q.dollar_string = function( price ){ // price is in cent notation
    var dollars = Math.floor(price/100).toString();
    var cents = Math.floor(price - dollars*100).toString();
    if( cents.length < 2 ){
      cents = '0'+cents;
    }
    return dollars+'.'+cents;
  };

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// strings

  Q.trim                = function(string){ return (string).replace(/^\s*|\s*$/g,'' ); };
  Q.remove_whitespace   = function(string){ return (string).replace(/\s+/g,      '' ); };
  Q.collapse_whitespace = function(string){ return (string).replace(/\s+/g,      ' '); };
  Q.alphabetizable      = function(string){ return Q.collapse_whitespace(Q.trim(string.toLowerCase())); }; // makes a string that is conducive to alphabetization by ignoring leading whitespace, whitespace length and capitalization

  Q.delimited = function( list, delimiter ){
    var output = '';
    var first = true;
    Q.each( arguments, function( which_argument, argument ){
      if( ! first ){ output += delimiter; }else{ first = false; }
      output += argument;
    });
    return output;
  };

  Q.substitute = function( unsubstituted_string, substitutions ){
    var segments = unsubstituted_string.split('#{');
    var substituted_string = segments[0];
    segments = segments.slice(1);
    Q.each(segments, function(which_segment, each_segment){
      each_segment = each_segment.split('}');
      if( each_segment.length !== 2 ){ Q.error('parse error in string substitution'); }
      if( substitutions[each_segment[0]] === undefined ){ Q.error(each_segment[0] + ' not found in substitution list'); }
      substituted_string += substitutions[each_segment[0]] + each_segment[1];
    });
    return substituted_string;
  };

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// arrays and objects

  Q.flatten = function( structure ){
    for( var i = 0; i < structure.length; i++ ){
      var is_array =
        structure[i] &&
        typeof(structure[i]) == 'object' &&
        structure.length !== undefined &&
        ! structure.propertyIsEnumerable('length');
        //todo: check for nodeType (to avoid dom matching)
      if( is_array ){
        structure = structure.slice(0,i).concat(structure[i]).concat(structure.slice(i+1,structure.length));
      }
    }
    return structure;
  };

  Q.get = function( container, keys, default_value ){
    return Q.reduce(Q.pluralized(keys), function(which, key, scope){
      return Q.type_of(scope[key], 'undefined') ? Q.BREAK(default_value) : scope[key];
    }, container);
  };

  Q.slice = function( focus ){
    var slice_args = Array.prototype.slice.call(arguments, 1);
    return Array.prototype.slice.apply(focus, slice_args);
  };
  Q.slice_arguments = Q.slice;

  // if nothing is passed for key_generator, the set is assumed to be a collection of strings, and they are used as the indexes themselves
  // if a string is passed to the key generator, a function is created to replace it that assumes the items are all objects, each of which has a property of that name
  // if a function is passed to key_generator, it is used to determine the key for each item in the set
  Q.indexed = function(set, key_generator, options){
    key_generator = Q.defaulted(key_generator, function(item){return item;});
    key_generator = Q.type_of(key_generator, 'string') ? function(item){return item[key_generator];} : key_generator;
    return Q.reduce(set, function(which_item, each_item, reduction){
      reduction[key_generator(each_item)] = each_item;
    }, {}, options);
  };

  Q.sorted = function(set, key_generator){ // todo
    throw 'not_implemented';
  };

  // Q.alphabetized accepts a collection of items and returns a new list sorted by dictionary order.
  // lookup:
  //   if no argument is passed, for the 'lookup', elements are assumed to be strings and put into a new list in order
  //   if the lookup is a string, elements are assumed to be objects, and the string indicates what key within each object to sort based on
  //   if a function is passed, it is applied to each object in order to produce a string for alphabetization.  it must return a string.
  Q.alphabetized = function(set, string_maker){
    string_maker = Q.defaulted(string_maker, function(each_item){return Q.alphabetizable(each_item        );});
    string_maker = Q.type_of(string_maker, 'string') ? function(each_item){return Q.alphabetizable(each_item[string_maker]);} : string_maker;
    var result = Q.reduce(set, function(which_item, each_item, reduction){ reduction.push(each_item); }, []);
    return result.sort(function(apple,orange){
      var apple_string = string_maker(apple), orange_string = string_maker(orange);
      return apple_string < orange_string ? -1 : orange_string < apple_string ? 1 : 0;
    });
  };


  // among searches all the keys in an object or array and returns true if the object is among them, false if it is not
  // indicating 'strict' makes Q.among compare using === instead of ==
  // options.ancestry : if truthy, among will also search the prototype chain
  Q.is_among = function(needle, haystack, strictly, options) {
    options = Q.defaulted(options, {});
    for(var which in haystack){if(options.ancestry || haystack.hasOwnProperty(which)){ // todo: make this an iterator?
      if(  strictly && haystack[which] === needle ){ return true; }
      if( !strictly && haystack[which] ==  needle ){ return true; }
    }}
    return false;
  };

  Q.to_array = function(input){
    if(!input){return [];}
    return Array.prototype.slice.call(input);
  };

  Q.is_plural = function( input ){
    //todo: check for nodeType (to avoid dom matching) (maybe done in type_of?)
    return Q.type_of(input, ['array', 'arguments']);
  };

  Q.pluralized = function( input ){
    return Q.is_plural(input) ? input : [input];
  };

  Q.reversed = function( array ){
    var result = [];
    Q.descend( array, function(which, element){ result.push(element); });
    return result;
  };

  // splice() removes a section from an array
  Q.splice = function(array, from, to) {
    var rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
  };

  Q.keys = function(collection){
    var keys = [];
    Q.traverse(collection, function(which, item){ keys.push(which); });
    return keys;
  };

  Q.is_empty = function( container, options ){
    if( Q.type_of(container, ['string','array','arguments']) ){ return container.length === 0; }
    return Q.reduce(container, function(which, element, reduction){
      return Q.type_of(element, 'undefined') ? true : Q.BREAK(false);
    }, true, options);
  };

  Q.size_of = function( container, matchers, options ){
    var size = Q.has_builtin(container, 'length') ? container.length : Q.reduce(container, function(which, element, reduction){
      if( ! Q.type_of(element, 'undefined') ){ return ++reduction; }
    }, 0, options);
    if( matchers === undefined ){ return size; }
    if( typeof matchers === 'number' ){ matchers = [matchers]; } // must use custom pluralization to avoid recursion
    for( var which in matchers ){
      if( size === matchers[which] ){
        return true;
      }
    }
    return false;
  };

  Q.concatenate = function(){
    return Q.reduce(arguments, function(which, argument, reduction){
      reduction.concat(Q.type_of(argument, 'array') ? argument : Q.to_array(argument));
    }, []);
  };

  // todo: make - like Q.each but stops and returns the first value that passes the function
  Q.find = function( container, action ){
  };

  Q.eliminate = function(needle, haystack, strict){
    var swap = [];
    if( Q.type_of(haystack, ['array', 'arguments']) ){
      Q.each(haystack, function(which, item){
        if( (strict && needle !== item) || (!strict && needle != item) ){
          swap.push(haystack.pop());
        }
      });
      Q.each(swap, function(which, item){
        haystack.push(swap.pop());
      });
    }else{
      Q.error('Q.eliminate isnt written for objects yet');
      Q.each(haystack, function(which, item){ // todo: whoathere - this just deletes everything
        delete haystack[which];
      });
    }
  };

  Q.index_of = function( item, list ){
    var matching_index;
    Q.each(list, function(which_item, each_item){
      if( each_item === item ){ matching_index = which_item; return Q.BREAK; }
    });
    return matching_index;
  };

  Q.extend = function(){
    var specified_depth = Q.type_of(arguments[0], 'boolean');
    var deeply = specified_depth ? arguments[0] : false;
    var target = arguments[specified_depth?1:0];
    var sources = Q.slice_arguments(arguments, specified_depth ? 2 : 1);
    Q.each(sources, function(which_source, source){
      if( Q.type_of(source, ['null', 'undefined']) ){ return; }
      Q.every(source, function(which_property, property) {
        var zaz = target;
        if( target === property ){ return; } // prevent invinite recursion
        if( deeply && Q.type_of(property, ['object', 'function', 'array', 'arguments']) && !property.nodeType ){
          var property_copy = Q.defaulted( target[which_property], Q.type_of(property, ['array','arguments'])?[]:{} );
          target[which_property] = Q.extend( deeply, property_copy, property );
        }else if( property !== undefined ){
          target[ which_property ] = property;
        }
      });
    });
    return target;
  };

  // accepts an object and a list of properties
  // returns a new object containing only the properties listed in the whitelist
  Q.subset = function( superset, white_list ){
    var result = {};
    Q.each(white_list, function(which, property){
      result[property] = superset[property];
    });
    return result;
  };


  //
  //
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// iteration

  Q.BREAK = function( payload ){ return {__proto__:Q.BREAK.indicator, 'payload':payload}; };
  Q.BREAK.indicator = {};
  Q.BREAK.__proto__ = Q.BREAK.indicator;

  // todo: write a single Q.iterate function that all the other iteraters rely upon

  Q.each_builtin = function( collection, callback ){
    var which_type, which_method, each_method, result; //todo: skip constructor and prototype (and __proto__)?
    Q.each(Q._builtins, function(which_type, each_type){
      Q.each(each_type, function(which_method, each_method){
        if( Q.has_builtin(collection, each_method) ){
          result = callback(each_method, collection[each_method]);
          if( result && result.__proto__ === Q.BREAK.indicator ){ return result.payload; } // todo: fix this __proto__ thing
        }
      });
    });
  };

  /*
   * @options may include:
   *   numeric: an indicator of what elements to cover and if they are numeric, in what order.  defaults to 'include'.  valid options are:
   *     'skip' (named only)
   *     'include' (named and numeric)
   *     'ascend' (numeric only ascending)
   *     'descend' (numeric only descending)
   * transform : if a pass_through variable is defined, it will be provided to each iteration as the third argument of the callback.  anything returned from the callback will become the new value of the transform variable.  useful for functions like 'reduce'
   */
  Q.iterate = function( collection, callback, options ){
    var collection_type = Q.type_of(collection);
    if( options === undefined ){ options = {}; }
    if( collection_type !== 'array' && collection_type !== 'arguments' && collection_type !== 'object' && collection_type !== 'function' ){
      Q.error('unsupported type "'+Q.type_of(collection)+'" for Q.iterate()');
    }
    if( options.numeric === undefined ){
      options.numeric = ( collection_type === 'array' || collection_type === 'arguments' ) ? 'ascend' : 'include';
    }
    var result, results = [];
    if( options.builtins ){
      var which_type, which_method, each_method, touched_methods = {}; //todo: skip constructor and prototype (and __proto__)?
      for( which_type in Q._builtins ){ // todo: make this check what type it is rather than iterate over all types.
        each_type = Q._builtins[which_type];
        for( which_method = 0; which_method < each_type.length; which_method++ ){
          each_method = each_type[which_method];
          if( !touched_methods[each_method] && Q.has_builtin(collection, each_method) ){
            touched_methods[each_method] = true; // this prevents us from touching the same method twice since we're iterating over all the lists of all the standard classes builtins

            result = callback(which_method, collection[which_method], options.transform);
            if( result && result.break_indicator === Q.BREAK.indicator ){ // todo: implement break_indicator
              if( result.payload !== Q.BREAK.no_payload ){ //todo: implement no_payload
                if( options.results ){ options.results[which_method] = result.payload; }
                if( options.hasOwnProperty('transform') ){ options.transform = result.payload; }
              }
              return options.transform;
            }else{
              if( options.results ){ options.results[which_method] = result; }
              if( options.hasOwnProperty('transform') ){ options.transform = result; }
            }

          }
        }
      }
    }
    var which;
    if( options.builtins !== 'only' ){
      if( numeric === 'include' || numeric === 'skip' ){
        for( which in collection ){

          if(options.ancestry || collection.hasOwnProperty(which)){
            if( numeric === 'skip' && String(Number(which)) === which ){ continue; } // todo: this is subject to floating point error for large indexes.  might also be inefficient
            result = callback(which, collection[which], options.transform);
            if( result && result.break_indicator === Q.BREAK.indicator ){ // todo: implement break_indicator
              if( result.payload !== Q.BREAK.no_payload ){ //todo: implement no_payload
                if( options.results ){ options.results[which] = result.payload; }
                if( options.hasOwnProperty('transform') ){ options.transform = result.payload; }
              }
              return options.transform;
            }else{
              if( options.results ){ options.results[which] = result; }
              if( options.hasOwnProperty('transform') ){ options.transform = result; }
            }
          }

        }
      }else if( numeric === 'ascend' || numeric === 'descend' ){
        ascending = (numeric === 'ascend');
        if( options.results && !Q.type_of(options.results, 'array') ){ Q.error('the results pointer for an ascending or desending iteration must be an array'); }
        for( (which = ascending ? 0 : collection.length-1); (ascending ? which < collection.length  : 0 <= which); (ascending ? which++ : which--) ){

          if(options.ancestry || collection.hasOwnProperty(which)){
            result = callback(which, collection[which], options.transform);
            if( result && result.break_indicator === Q.BREAK.indicator ){ // todo: implement break_indicator
              if( result.payload !== Q.BREAK.no_payload ){ //todo: implement no_payload
                if( options.results ){ options.results[which] = result.payload; }
                if( options.hasOwnProperty('transform') ){ options.transform = result.payload; }
              }
              return options.transform;
            }else{
              if( options.results ){ options.results[which] = result; }
              if( options.hasOwnProperty('transform') ){ options.transform = result; }
            }
          }

        }
      }else{
        throw options.numeric+' is not a valid setting for the numeric option of Q._iterate()';
      }
    }
    return undefined;
  };



  // each() iterates over all properties of an object passed in, or all indexes of an array/argumentset
  Q.each = function( collection, callback, options ){
    if( Q.type_of(collection, ['object','function' ]) ){
      return Q.every(collection, callback, options);
    }else if( Q.type_of(collection, ['array', 'arguments']) ){
      return options && options.reversed ? Q.descend( collection, callback, options) : Q.ascend( collection, callback, options);
    }
    Q.error('unsupported type "'+Q.type_of(collection)+'" for Q.each()');
  };

  // every() iterates over all the properties of the object given it, regardless of the objects datatype, regardless of the type
  Q.every = function( collection, callback, options ){
    options = Q.defaulted(options, {});
    var result;
    for( var which in collection ){
      if(options.ancestry || collection.hasOwnProperty(which)){
        result = callback(which, collection[which]);
        if( result && result.__proto__ === Q.BREAK.indicator ){ return result.payload; }
      }
    }
    if( options.builtins ){ Q.each_builtins( collection, callback ); }
  };

  // traverse iterates over all the elements of an object, but if the object is an array, it skipps the array elements
  Q.traverse = function( collection, callback, options ){
    options=Q.defaulted(options, {});
    var result;
    for( var which in collection ){
      if(options.ancestry || collection.hasOwnProperty(which)){
          if( ! Q.type_of(which, 'number') || 0 < which || which < collection.length ){ // todo: this wont work because even index array keys are strings
          result = callback(which, collection[which]);
        }
      }
    }
    if( options.builtins ){ Q.each_builtins( collection, callback ); }
  };

  // ascend reads all the elements of an array in order
  Q.ascend = function( collection, callback, options ){
    options = Q.defaulted(options, {});
    for( var which = 0; which < collection.length; which++ ){
      if(options.ancestry || collection.hasOwnProperty(which)){
        var result = callback(which, collection[which]);
        if( result && result.__proto__ === Q.BREAK.indicator ){ return result.payload; }
      }
    }
  };

  // descend operates on all elements of an array in reverse order
  Q.descend = function( collection, callback, options ){
    options = Q.defaulted(options, {});
    for( var which = collection.length-1; 0 <= which; which-- ){
      if(options.ancestry || collection.hasOwnProperty(which)){
        var result = callback(which, collection[which]);
        if( result && result.__proto__ === Q.BREAK.indicator ){ return result.payload; }
      }
    }
  };

  // results iterates over the elements of a collection, returning a similarly-typed object with all the results of the callback on those elements
  Q.results = function( collection, callback, options ){
    var results = Q.type_of(collection, ['object', 'function']) ? {} : [];
    Q.each(collection, function(which, each){ results[which] = callback(which,each); }, options);
    return results;
  };

  //todo: make reduce callback accept the reduction as argument 3 to reduce confusion when misused
  //todo: make reduce accept the reduction start state as argument 3 to avoid differences with each
  //todo: require 3 args for reduce, 2 for each

  // reduce applies a callback to every element of a collection and if there is a return value other than undefined, updates the state of its return value to eqal that result
  Q.reduce = function( collection, callback, reduction, options ){
    var result;
    Q.each(collection, function(which,item){
      result = callback(which, item, reduction);
      if( result && result.__proto__ === Q.BREAK.indicator ){ reduction = result.payload; return Q.BREAK(); }
      if( Q.type_of(result) !== 'undefined' ){ reduction = result; }
    }, options);
    return reduction;
  };

  // todo: reconsile the two versions of Q.map()
  Q.map = function( item_or_container, transformation, apply_test ){ return Q.map_deep(item_or_container, transformation, apply_test, false); };
  Q.map_deep = function( item_or_container, transformation, apply_test, regress_test ){
    apply_test = Q.defaulted(apply_test, function(){return true;});
    if( regress_test === false){
      first_level = true;
      regress_test = Q.defaulted(regress_test, function(){return false;});
    }else{
      regress_test = Q.defaulted(regress_test, function(){return true;});
    }
    if( Q.type_of(item_or_container, ['array', 'object', 'arguments']) && (first_level || regress_test(item_or_container)) ){ // regress
      Q.each( item_or_container, function( which_sub_item_or_container, each_sub_item_or_container ){
        item_or_container[which_sub_item_or_container] = Q.map_deep(each_sub_item_or_container, transformation, apply_test, regress_test);
      });
      return item_or_container;
    }else{ // stay shallow
      if( apply_test(item_or_container) ){
        return transformation( item_or_container );
      }else{
        return item_or_container;
      }
    }
  };

  Q.is_similar = function( apple, orange, options ){ return Boolean(Q.compare( apple, orange, options ).match); };

  // todo: rename this function to compare_deep and make a compare function that can do it shallowly
  // note!! this function cannot catch the inequivalency of functions that have acces to different variable scopes
  Q.compare = function( apple, orange, options ){
    Q.constrain('at_least', [arguments, 2]);
    Q.constrain('at_most', [arguments, 3]);
    options = Q.defaulted(options, {});
    Q.defaults(options, {apple_contexts : [], orange_contexts : []});
    if( apple === orange ){ return {'match' : 'identical'}; }

    var apple_type = Q.type_of(apple), orange_type = Q.type_of(orange), common_type;
    if( apple_type !== orange_type ){ return {'type discrepancy':[apple_type, orange_type]}; }
    common_type = apple_type; // the two objects are of the same type

    if( Q.is_among(common_type, ['number', 'boolean', 'string']) ){ return {'mismatch' : 'value discrepancy', 'values' : [apple, orange]}; }

    // if the values are functions, check that their source code is the same
    // note - they might have access to different scopes
    if( common_type === 'function' && apple.toString() !== orange.toString() ){ return {'mismatch' : 'function source discrepancy', 'function sources' : [apple.toString(), orange.toString()]}; }

    var which_context;
    // this iterates over the contexts within which the analysis was taking place, and if there is a circular nesting in apple, it checks for a symmetrical circular nesting in orange
    for( which_context = options.apple_contexts.length-1; 0 <= which_context; which_context-- ){
      if( apple === options.apple_contexts[which_context] ){
        if( orange === options.orange_contexts[which_context] ){
          return {'match' : 'equivalent'};
        }else{
          return {'mismatch' : 'unmatched recursion', 'side' : 'apple', 'degrees above' : options.apple_contexts.length - which_context};
        }
      }
    }
    for( which_context = options.orange_contexts.length-1; 0 <= which_context; which_context-- ){
      if( orange === options.orange_contexts[which_context] ){
        if( apple === options.apple_contexts[which_context] ){
          return {'match' : 'equivalent'};
        }else{
          return {'mismatch' : 'unmatched recursion', 'side' : 'orange', 'degrees above' : options.orange_contexts.length - which_context};
        }
      }
    }

    var examined_properties = {}, which_property, property_is_equivalent;
    for( which_property in apple ){
      options.apple_contexts.push(apple);
      options.orange_contexts.push(orange);
      property_comparison = Q.compare(apple[which_property], orange[which_property], options);
      options.apple_contexts.pop();
      options.orange_contexts.pop();
      // if any key from apple is inequivalent to one on orange, the two objects are inequivalent
      if( ! property_comparison.match ){
        return { 'mismatch' : 'property discrepancy', 'key' : which_property, 'difference' : property_comparison };
      }
      examined_properties[which_property] = true;
    }

    // if any keys exist in orange that were not already examined, the two objects are inequivalent
    for( which_property in orange ){
      if( ! examined_properties[which_property] ){
        return {'mismatch' : 'extra property', 'key' : which_property};
      }
    }

    // the two objects passed every equivalency test
    return {'match':'equivalent'};
  };
  /*last working version
  // note!! this function cannot catch the inequivalency of functions that have acces to different variable scopes
  Q.is_equivalent = function( apple, orange ){
    if( apple === orange ){ return true; }

    var apple_type = Q.type_of(apple), orange_type = Q.type_of(orange);
    if( apple_type !== orange_type ){ return false; }
    var common_type = apple_type; // the two objects are of the same type

    if( Q.is_among(common_type, ['number', 'boolean', 'string']) && apple !== orange ){ return false; }
    if( common_type === 'function' && apple.toString() !== orange.toString() ){ return false; }

    var examined_properties = {}, which;
    for( which in apple ){
      if( ! Q.is_equivalent(apple[which], orange[which]) ){ return false; } // if any key from apple is inequivalent to one on orange, the two objects are inequivalent
      examined_properties[which] = true;
    };
    for( which in orange ){
      if( examined_properties[which] ){ continue; }
      if( ! Q.is_equivalent(apple[which], orange[which]) ){ return false; } // if any key from orange is inequivalent to one on apple, the two objects are inequivalent
    }
    return true;
  };
   */

  //
  //
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// assertions and dependency

  Q.register = function( name, version ){ Q.reguster[name] = Q.defaulted(version, true); };
  Q.depend = function( name, version ){
    if( version === undefined ){ Q.error_if(          ! Q.reguster[name], 'reguster "'+name+' is not registered with QOMBAT'); }
    else                       { Q.error_if(version === Q.reguster[name], 'reguster "'+name+' is registered as version '+Q.reguster[name]+', not '+version+''); }
  };

  Q.exists = function( namespace, scope ){
    var current_depth = scope ? 'SUPPLIED_SCOPE' : 'window';
    scope = Q.defaulted(scope, window);
    Q.each( namespace, function( which, subscope ){
      current_depth += '[\''+subscope+'\']';
      Q.error_if( Q.type_of(scope=scope[subscope], 'undefined'), 'failed to find the subscope '+current_depth);
    });
    return true;
  };

  // constraint system for easy assertions
  // constrain() offers a simple syntax for making assertions about variables, and is designed specifically for the use case of constraining function arguments
  // use Q.constrain( input_1, 'is_string', 'input_1 must be a string' );
  Q.constrain = function( constraint, args, message ){
    if( Q.type_of(constraint, 'string') ){ constraint = Q.constrain.constraints[constraint]; }
    if( ! constraint.apply({},args) ){ Q.error( Q.defaulted(message, 'Constraint on line '+'unknown'+' failed') ); }
  };
  Q.constrain.constraints = {
    'size_of'   : function( item, limit ){ return Q.size_of(item) == limit; },
    'at_least'  : function( item, limit ){ return Q.size_of(item) >= limit; },
    'at_most'   : function( item, limit ){ return Q.size_of(item) <= limit; },
    'more_than' : function( item, limit ){ return Q.size_of(item) >  limit; },
    'less_than' : function( item, limit ){ return Q.size_of(item) <  limit; }
  };

  Q.unique = function(){ return 'QOMBAT_unique_key_'+(Q.unique._uniqueness++); };
  Q.unique._uniqueness = -1;

  Q.flag = function( name ){ return (Q.flag._flags[name] = Q.defaulted(Q.flag._flags[name], {'QOMBAT_FLAG':name})); };
  Q.flag._flags = {};

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// feedback

  Q.log = function(){ // output destined for developer only - a failsafe wrapper for console.log
    if( typeof console === "undefined" ){ return; } // bizarre - if i so much as mention the word 'console' without 'typeof' before it, everything blows up on firefox when firebug is not enabled
    Q.each(arguments, function(which_argument, each_argument){
      console.log(each_argument);
    });
  };

  Q.print = function( message ){ // output to browser
    var node = document.createElement('pre');
    node.innerHTML = message;
    document.body.appendChild(node);
  };

  Q.call_stack = function(){
    try {
      throw Error();
    } catch(ex) {
      return ex.stack;
    }
  };

  Q.error = function( message ){ // output error and stop page
    Q.log(Q.call_stack());
    message = 'Error: ' + message;
    alert(message);
    throw message;
  };

  Q.error_if = function( condition, message ){ if(condition){Q.error(message);} };

  Q.debugging = function( domain ){
    if( domain === undefined ){ return Q.debugging.default_domain;  }
    else                      { return Q.debugging.domains[domain]; }
  };

  Q.debugging.set = function( domain, state ){
    if( state  === undefined ){ state = true; }
    if( domain === undefined ){ Q.debugging.default_domain  = state; }
    else                      { Q.debugging.domains[domain] = state; }
  };

  Q.debugging.default_domain = Q._options.DEBUGGING;

  Q.debug = function( focus, label, domain ){
    if( typeof(label) === 'undefined' ){ label = '(UNLABELED)'; }
    if( Q.debugging[domain] ){
      Q.out('Debugging: ' + label);
      Q.out(focus);
    }
  };

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////







  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// constructors

  Q.indexed_array = function( options ){
    options = Q.defaults(options, {
      'keygen' : function( item ){ return item; } // in the simple case, each item inserted is assumed to be an indexable object - thus it is used as its own key in the index
    });
    if( Q.type_of(options.keygen, 'string') ){
      var subkey = options.keygen;
      options.keygen = function( item ){ // if a string is passed as the keygen, then use it as a lookup within the object for where to find the hashable property for indexing
        return item[subkey];
      }
    }
    var result = [];
    result.indexing = {};

    result.index_for_key = function( key ){
      return result.indexing[key];
    };
    result.item_for_key = function( key ){
      return result[ result.indexing[key] ];
    };
    result.index_for_item = function( item ){
      return result.indexing[ options.keygen(item) ];
    };
    result.has_key = function( key ){
      return result[ result.indexing[key] ] !== undefined;
    };

    result.push = function( element ){
      result.set(result.length, element);
    };
    result.set = function( key, value ){
      if( result[key] !== undefined ){
        delete result.indexing[options.keygen(result[key])];
      }
      result[key] = value;
      result.indexing[options.keygen(value)] = key;
    };

    result.remove_at_key = function( key ){
      result.splice(result.indexing[key]); // the elements will be deleted from the index within the splice() method
    };
    var old_splice = result.splice;
    result.splice = function( index, howmany ){
      howmany = Q.defaulted(howmany, 1);
      for( var which = index; which < index+howmany; which++ ){
        delete result.indexing[options.keygen(result[which])]; // delete the index for the elements to be spliced
      }
      old_splice.apply(result, arguments);
      for( var which = index; which < result.length; which++ ){
        result.indexing[ options.keygen(item) ] = which; // regenerate index for elements after the splice
      }
    };

    return result;
  };

  Q.circular_array = function(){
    var result = [];
    result.focal_index = 0;
    result.next = function(){
      var focus = result[result.focal_index];
      result.focal_index = result.focal_index + 1 % result.length;
      return focus;
    };
    result.focus_on = function(focus){
      result.focal_index = focus;
    };
    return result;
  };



  // returns an event notifier with
  //   @method subscribe: provided an event and a callback, registers interest in the specified event, and calls it when the event occurrs
  //   @method dispatch: indicates that the specified event has happened, and interested subscribers should be notified
  //     @option reversed: whether or not to notify subscribers in filo order.  defaults to false
  Q.dispatcher = function(){
    var result = {}, subscriptions = {}, hushes = Q.bank(), pending_announcements = Q.queue();
    result.subscribe = function( event, subscriber ){
      if( ! Q.type_of(event, 'string') ){ throw 'must include an event key for argument 1 of dispatcher.subscribe()'; }
      if( ! Q.type_of(subscriber, 'function') ){ throw 'must include a callback function for argument 2 of dispatcher.subscribe()'; }
      if( subscriptions[event] === undefined ){ subscriptions[event] = Q.bank([]); }
      return subscriptions[event].deposit(subscriber);
    };
    var dispatch = function(){
      if( hushes.is_empty() ){
        while( pending_announcements.length ){
          pending_announcement = pending_announcements.dequeue();
          pending_announcement();
        }
      }
    };
    result.publish = function( event, details, options ){
      if( ! Q.type_of(event, 'string') ){ throw 'must include an event key for argument 1 of dispatcher.publish()'; }
      options = Q.defaulted(options, {});
      if( subscriptions[event] ){
        Q.each( subscriptions[event].deposits, function( which, subscriber ){
          if( subscriber ){ // only execute unexpired subscriptions
            pending_announcements.enqueue(
              function(){
                subscriber( Q.extend( {}, {'event':event}, details ) ); // copy make sure that if the user edits the object they get, it does not effect future notifications
              }
            );
          }
        }, Q.subset(options, ['reversed']) );
      }
      dispatch();
    };
    result.hush = function(){
      var receipt = hushes.deposit(true);
      return function(){
        receipt(); // expire the deposit
        dispatch();
      };
    };
    return result;
  };


  // takes or creates an object, returns a proxy containing get set and run methods that will ensure notifications can fire
  Q.proxy = function( seed ){
    seed = Q.defaulted(seed, {});
    var result = function(key, value){
      if( arguments.length === 1 ){
        return commands.get(key);
      }else if( arguments.length === 2 ){
        return commands.set(key, value);
      }else{
        throw 'bad argument count for proxy() calling behavior';
      }
    };
    var dispatcher = Q.dispatcher();
    result.storage = seed;
    var commands = {
      'get'       : function( key        ){
        return seed['get_'+key] ? seed['get_'+key]() : seed[key]
      },
      'set'       : function( key_or_hash, value ){
        if( Q.type_of(key_or_hash, 'object') ){
          Q.each(key_or_hash, function(key, value){
            commands.set(key, value);
          });
        }else{
          var key = key_or_hash;
          var previous = commands.get(key);
          var result = seed['set_'+key] ? seed['set_'+key](value) : (seed[key] = value);
          if( previous !== value ){
            dispatcher.publish('did_change '+key, {'old_state':previous});
          }
          return result;
        }
      },
      'run'       : function( key, args  ){
        if(!Q.type_of(seed[key], 'function')){ Q.log('no such function as '+key); return; };
        return seed[key].apply(seed, Q.defaulted(args,[]));
      },
      'del'       : function( key        ){
        return (delete seed[key]);
      }
    };

    Q.each(commands, function(which, command){
      result[which] = function( key ){
        var details = {'previous':seed[key]};
        dispatcher.publish('will_'+which, details);
        dispatcher.publish('will_'+which+' '+key, details);
        var result = command.apply({}, arguments);
        dispatcher.publish('did_'+which+' '+key, details, {'reversed':true});
        dispatcher.publish('did_'+which, details, {'reversed':true});
        return result;
      };
    });

    result.method = function(method_name, callback){
      //todo: add support for pre-existing methods
      seed[method_name] = callback;
      result[method_name] = function(){
        //todo
      };
    };
    result.getter = function(key, callback){
      return function(){
        return commands.get(key);
      }
    }
    result.setter = function(key, val){
      if(arguments.length === 2){
        return function(){
          commands.set(key, val);
        }
      }else{
        return function(val){
          commands.set(key, val);
        }
      }
    }
    result.runner = function(key, args){
      return function(){
        commands.run(key, args);
      }
    }
    result.comparer = function(key, val){
      return function(){
        return commands.get(key) === val;
      }
    }

    result.publish = dispatcher.publish;
    result.subscribe = dispatcher.subscribe;
    result.hush = dispatcher.hush;

    return result;
  };


  // delegator creates a function that delegates its behavior to another behavior
  // delegate:
  //   if a string is supplied, the function will delegate to a method within its own namespace
  //   if a function is supplied, that function will be the delegate
  // <return>: the delegating function
  Q.delegator = function( delegate ){
    var result = (
      Q.type_of(delegate, 'function') ? function(){ return         delegate.apply(result, arguments); } :
      Q.type_of(delegate, 'string'  ) ? function(){ return result[delegate].apply(result, arguments); } :
      Q.error('bad argument for Q.delegator()')
    );
    return result;
  };

  // callable assigns all the members of a supplied object onto a supplied function
  // it is identical to manually extending a function, except that the value of 'this' within the behavior definition will be the supplied scope, or if none is supplied, then the callable object itself
  Q.callable = function( body, members, scope ){
    var callable = function(){return body.apply(Q.defaulted(scope, callable), arguments);};
    return Q.extend(callable, members);
  };

  // Q.notifier creates a function that has built in call-back functionality.  by calling my_notifer.before() and passing in a callback, you define a function that will be called before the original behavior
  Q.notifier = function( behavior, befores, afters ){
    var result = function(){
      result.do_befores();
      var effect = result.do_behavior.apply({}, arguments);
      result.do_afters();
      return effect;
    };
    Q.inherit(result, behavior);
    result.do_behavior = function(){ return behavior.apply({}, arguments); };
    Q.each(['before','after'], function(which,side){
      var seed = (side === 'before' ? befores : afters);
      result['_'+side+'s'] = Q.bank(Q.pluralized(Q.defaulted(seed,[])));
      result[side] = function( callback ){
        if( ! Q.type_of(callback, 'function') ){ Q.error('notifier.'+side+'() requires a function'); }
        return result['_'+side+'s'].deposit(callback);
      };
      result['do_'+side+'s'] = function(args){ // add do_befores() and do_afters() methods for manual execution
        return Q.ascend( result._befores, function(which, callback){
          callback.apply({}, Q.pluralized(args));
        });
      };
    });
    return result;
  };

  Q.executer = function( focus ){
    var result = Q.notifier(function(command){
      return focus[command].apply({}, Q.slice_arguments(arguments, 1));
    });
    focus = Q.defaulted(focus, result);
    return result;
  };

  // Q.bank is a one way door storage mechanism that manages keys for you.  upon providing an item, the bank offers you a function in return that, when called, will remove the item from the list and offer it as the return value
  // note: if retaining the list after passing it into the bank, you may not currently do anything to the list that would alter the indexes of the list
  Q.bank = function( container ){
    var result = {};
    result.deposits = Q.defaulted(container, {});
    result.is_empty = function(){
      return Q.is_empty(result.deposits);
    };
    result.deposit = function(element){
      var identity = Q.type_of(result.deposits, ['array', 'arguments']) ? result.deposits.length : Q.unique();
      result.deposits[identity] = element;
      return function(){
        var pass_back = result.deposits[identity];
        delete result.deposits[identity];
        return pass_back;
      };
    };
    return result;
  };

  // a delayed shift queue
  Q.queue = function(start_state){
    var result = {'length':0}, elements = Q.defaulted(start_state, []), dequeued_offset = 0; // todo: make start state get deep copied instead of nabbed
    result.is_empty = function(){ return (result.length === 0); };
    result.next     = function(){ return elements[dequeued_offset]; };
    result.enqueue  = function(element){ result.length+=1; elements.push(element); };
    result.dequeue  = function(){
      if( elements.length ){
        result.length -= 1;
        var element = result.next();
        if( (elements.length/2) < ++dequeued_offset ){ // only initiate an unshift when the number of dequeued elements exceeds the number of remaining elements
          elements = elements.slice(dequeued_offset);
          dequeued_offset = 0;
        }
        return element;
      }
    };
    result._elements = elements;
    result._dequeued_offset = dequeued_offset;
    return result;
  };

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////
  //// browser environment utilities


  ////////////////////////////////////////
  //
  // window

  Q.window_dimensions = function(){
    //todo: make sure dom is loaded first
    if     ( Q.type_of(window.innerWidth, 'number')                                                                      ){ return { 'x' : window.innerWidth,                    'y' : window.innerHeight                    }; } //Non-IE
    else if( document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight) ){ return { 'x' : document.documentElement.clientWidth, 'y' : document.documentElement.clientHeight }; } //IE 6+ in 'standards compliant mode'
    else if( document.body            && (document.body.clientWidth            || document.body.clientHeight)            ){ return { 'x' : document.body.clientWidth,            'y' : document.body.clientHeight            }; } //IE 4 compatible
    else                                                                                                                  { return { 'x' : 0,                                    'y' : 0                                     }; }
  };

  Q.scroll_offset = function(){
    if     ( Q.type_of(window.pageYOffset, 'number')                                                                 ){ return { 'x' : window.pageXOffset,                  'y' : window.pageYOffset                 }; } //Netscape compliant
    else if( document.body            && (document.body.scrollLeft            || document.body.scrollTop           ) ){ return { 'x' : document.body.scrollLeft,            'y' : document.body.scrollTop            }; } //DOM compliant
    else if( document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop) ){ return { 'x' : document.documentElement.scrollLeft, 'y' : document.documentElement.scrollTop }; } //IE6 standards compliant mode
    else                                                                                                              { return { 'x' : 0,                                   'y' : 0                                  }; }
  };


  ////////////////////////////////////////
  //
  // browser difference abstractions

  Q.event_target = function( event ){
    return event.target ? event.target : event.srcElement;
  };
  Q.target = Q.event_target; // todo: this is for backwards compatibility - remove

  Q.concatenate = function( strings ){
    return BROWSER_IS_IE_LIKE ? strings.join('') : Q.reduce('', strings, function(reduction, which, each){ // note: does this need \r's in it?
      return reduction+each;
    });
  };

  Q.text = function(){
    var strings = [];
    return {
      'append'    : strings.push,
      'prepend' : strings.unshift, // todo: for efficiency, make a separate array for prepended strings, then on render(), traverse it backwards and add it to the rest of the strings
      'render'  : function(){
        return Q.concatenate(strings);
      }
    };
  };



  ////////////////////////////////////////
  //
  // uris

  Q.redirect = function( destination, hide_history, top_frame ){
    window_to_change = Q.defaulted(top_frame, true) ? Q.bottom(window, 'parent') : window;
    window.location[ Q.defaulted(hide_history,false) ? 'replace' : 'assign' ](destination);
  };

  Q.nocache = function( uri ){
    return Q.update_query_string(uri, {'nocache' : ((new Date()).getTime())});
  };

  Q.update_query_string = function( uri, new_query_hash ){
    var new_query_string = "";
    var old_query_hash   = {};
    var split_uri = uri.split("?");
    var path      = split_uri[0];
    if( split_uri.length === 2 ){
      old_query_hash = this.parse_query_string(split_uri[1]);
    }
    var combined_query_hash   = q.extend(old_query_hash, new_query_hash);
    var combined_query_string = this.generate_query_string(combined_query_hash);
    if( combined_query_string.length ){
      combined_query_string = "?" + combined_query_string;
    }
    return path + combined_query_string;
  };

  Q.make_attribute_string = function( attributes ){
    return q.reduce( '', attributes, function( result, which_attribute, each_attribute ){ return result + ' ' + which_attribute + '="' + each_attribute + '"'; } );
  };


  // query string must be well formed (with no leading question mark and an equals sign for each variable)
  Q.parse_query_string = function( query_string ){
    var query_hash = {};
    var query_array = query_string.split("&");
    q.each(query_array, function(which_parameter, each_var){ // todo: rewrite as a call to q.index_by
      var split_var    = each_var.split("=");
      var name         = split_var[0];
      var value        = split_var[1];
      query_hash[name] = unescape(value);
    });
    return query_hash;
  };
  // note: this will urlencode values
  Q.generate_query_string = function( vars_hash ){
    return q.reduce([], vars_hash, function(result, which_var, each_var){
      result.push(which_var + "=" + escape(each_var));
    }).join("&");
  };



  ////////////////////////////////////////
  //
  // elements

  Q.add_hint = function(field, hint, options){
    options = q.default_to(options, {});
    options.hinted_style = q.default_to(options.hinted_style, 'qombat_hinted_active');
    var field_jq = $(field).addClass('qombat_hinted');
    var does_contain_hint         = false;
    var does_contain_user_content = function(){ return( ! does_contain_hint && field_jq.val() !== '' ); };
    var scrutenize = function( under_scrutiny ){ if( ! does_contain_user_content() ){ show_hint(!under_scrutiny); } };
    var show_hint = function( setting ){
      field_jq[     (setting ? 'addClass' : 'removeClass') ](q.hinted_style);
      field_jq.val( (setting ? hint       : ''           ) );
      does_contain_hint = setting;
    };
    field_jq.focus( function(){scrutenize(true );} );
    field_jq.blur(  function(){scrutenize(false);} );
    if( Q.does_support_onbeforeunload() ){ Q.append_to_onbeforeunload( function(){scrutenize(true );} ); } // todo: this onbeforeunload stuff is bunk
    else                                   { $(window).unload(             function(){scrutenize(true );} ); }
    scrutenize(false); //todo: check for focus state
    field.scrutenize = scrutenize;
    return field;
  };

  Q.hinted = function( type, attributes, hint, content, options ){
    var field;
    if( type === 'text' ){
      attributes.type = 'text';
      field = $('<input    '+Q.make_attribute_string(attributes)+'>')[0];
    }else if( type === 'textarea'){
      field = $('<textarea '+Q.make_attribute_string(attributes)+'>')[0];
    }
    if( 5 <= arguments.length ){ $(field).val(content); }
    return Q.add_hint(field, hint, options);
  };

  Q.limit_textarea = function( textarea, limit ){
    var update = function(){ if( textarea.value.length > limit ){ textarea.value = textarea.value.substring(0, limit); } };
    $(textarea).keydown( update ).keypress( update ).keyup( update );
    textarea.limit = function(){ return limit; };
  };








  // make_selectable turns a dom element into a widget with two states that change when it is clicked
  // inputs:
  //   element: a dom object to make selectable.  this will be modified
  //   on_select: a function that gets run when the item is selected or unselected.  it will be passed the new state of the selectable and the dom element that was toggled
  //   preselected: if a truthy value is passed, the item will automatically have selection applied to it upon creation
  // output:
  //   the dom object passed in as 'element' will be returned, but attached to it will be:
  //     selected: a boolean value indicating the items selection state
  //     toggle: a function that changes the state to its opposite and invokes the on_select function
  //     select: a function that accepts a new state, and if the item is not in that state, calls on_select and sets it to the new one
  Q.make_selectable = function(element, on_select, preselected){
    on_select   = lu.default_to(on_select,   function(){} );
    preselected = lu.default_to(preselected, false        );
    element.selected = false; // assumes input element is offered in unselected state
    element.toggle = function(){ element.select(!element.selected); };
    element.select = function(on){
      if(arguments.length < 1){ on = true; }
      if( on != element.selected ){ on_select(on, element); }
      element.selected = Boolean(on);
    };
    $(element).click(element.toggle);
    element.select(preselected);
    return element;
  };

  Q.selectables = function(items, on_select, element_template){
    return q.map(Q.elements(items,element_template), function(which_element, each_element){
      return Q.make_selectable( each_item, function(on, element){on_select(on, element, each_item);} );
    });
  };

  Q.elements = function(items, element_template){
    return q.map(items, function(which_item, each_item){
      var element = element_template(each_item);
      element.item = each_item;
      return element;
    });
  };

  // items: a list of objects to be iterated over and turned into selectable dom elements
  // on_select_item: is a function to be called when the user selects the element
  // element_template: is a function that transforms an object in the items list into a dom element.  it will be passed an individual item
  // container_template: is a function that creates a dom element to contain the selectable items.  it will be passed a list of rendered selectable dom elements
  Q.selector = function(items, on_select_item, element_template, container_template){
    var selectables = Q.selectables(items, on_select_item, element_template);
    var selector = container_template(selectables);
    selector.selecteds = function(items_only, selection_state){
      if( arguments.length < 1 ){ items_only      = true; }
      if( arguments.length < 2 ){ selection_state = true; }
      return q.map(selectables, function(which_selectable, each_selectable){ // todo: to prevent invalid addres lookups when the user manipulates the dom by other means, change this so that it iterates over the selectables in within the selector node rather than uses its own input list
        if( Boolean(each_selectable.selected) == Boolean(selection_state) ){ return (items_only? each_selectable.item : each_selectable); }
        else                                                               { return Q.CONTINUE;                                           } //todo: implement Q.CONTINUE
      });
    };
    return selector;
  };

  // todo: consider
  Q.escape_html = function( unescaped ){
    var node = document.createElement('div');
    div.appendChild(document.createTextNode(unescaped));
    return div.innerHTML;
  };
  Q.unescape_html = function( escaped ){
    var node = document.createElement("div");
    node.innerHTML = escaped;
    if( node.innerText !== undefined ){ return node.innerText;   } // Internet explorer
    else                              { return node.textContent; } // Firefox
  };

  Q.download = function(filename){
    $('body').append($('<iframe style="visibility:hidden;" src="'+filename+'" />'))
  };

  Q.framed = function(node, options){
    options = Q.defaults(options,{
    });
    var result = T.table({'class':'qombat_framed'},
      T.tbody(
        T.tr(
          T.td(/*{'align':'center'},*/ //todo: if this breaks in ie, put this back
            node
          )
        )
      )
    );
    return result;
  };

  Q.captioned = function(caption, node){
    return T.table({'class':'qombat_captioned'},
      T.tbody(
        T.tr(
          T.td(/*{'align':'center'},*/ //todo: if this breaks in ie, put this back
            T.div(node),
            caption
          )
        )
      )
    );
  };

  Q.portrait = function(url, options){
    options = Q.defaults(options, {});
    var result = T.img({'src' : url});
    if( options.caption ){ result = Q.captioned(options.caption, result); }
    if( options.framed ){ result = Q.framed(result); }
    if( options.onclick ){ $(result).css({'cursor':'pointer'}).click(options.onclick); }
    return result;
  };

  //
  //
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////








  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  //
  // constants

  Q._builtins = {
    'object'  : [ 'constructor', 'length', 'prototype' ],
    'boolean' : [ 'toSource', 'toString', 'valueOf' ],
    'number'  : [ 'constructor', 'MAX_VALUE', 'MIN_VALUE', 'NaN', 'NEGATIVE_INFINITY', 'POSITIVE_INFINITY', 'toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toString', 'valueOf' ],
    'regex'   : [ 'global', 'ignoreCase', 'input', 'lastIndex', 'lastMatch', 'lastParen', 'leftContext', 'multiline', 'rightContext', 'source', 'compile', 'exec', 'test' ],
    'array'   : [ 'concat', 'join', 'pop', 'push', 'reverse', 'shift', 'slice', 'sort', 'splice', 'toSource', 'toString', 'unshift', 'valueOf' ],
    'string'  : [ 'anchor', 'big', 'blink', 'bold', 'charAt', 'charCodeAt', 'concat', 'fixed', 'fontcolor', 'fontsize', 'fromCharCode', 'indexOf', 'italics', 'lastIndexOf', 'link', 'match', 'replace', 'search', 'slice', 'small', 'split', 'strike', 'sub', 'substr', 'substring', 'sup', 'toLowerCase', 'toUpperCase', 'toSource', 'valueOf' ],
    'math'    : [ 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2', 'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan', 'toSource', 'valueOf' ],
    'date'    : [ 'Date', 'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getTime', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay', 'getUTCMonth', 'getUTCFullYear', 'getUTCHours', 'getUTCMinutes', 'getUTCSeconds', 'getUTCMilliseconds', 'getYear', 'parse', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCMonth', 'setUTCFullYear', 'setUTCHours', 'setUTCMinutes', 'setUTCSeconds', 'setUTCMilliseconds', 'setYear', 'toDateString', 'toGMTString', 'toLocaleDateString', 'toLocaleTimeString', 'toLocaleString', 'toSource', 'toString', 'toTimeString', 'toUTCString', 'UTC', 'valueOf' ]
  };

  Q.keycodes = {
    'enter' : 13
  };

  //
  //
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////


})(); // end of QOMBAT definition

