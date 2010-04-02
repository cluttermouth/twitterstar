////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//// Dominate - Marcus Phillips 2009
//// DOM generation language for javascript
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
  var T = QOMBAT._initialize_module({
    NAME : 'templates',
    SHORTCUT : 'T',
    DELEGATE : '_node'
  });

  ////
  ////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////









  T._node = function(node_type){
    var attributes = {};
    var contents = [];
    Q.each(arguments, function(which, argument){
      if( which !== 0 ){ // the first argument was the node_type
        T._collate(attributes, contents, argument);
      }
    });
    var node = document.createElement(node_type);
    Q.each(attributes, function(which, attribute){
      if( which === 'class' ){
        $(node).addClass(attribute);
      }else if( typeof(attribute) === 'function' ){
        $(node).bind(which.substr(2), attribute);
      }else if( 0 <= $.inArray(which, T._bindable_attributes) ){ // todo - move this inArray over to qombat
        node[which] = function(){
          return (new Function(attribute)).call(node); // todo: baaad - we want better stuff passed into our event handlers.  more standard way to do this? (http://www.javascriptkit.com/domref/windowmethods.shtml)
        };
      }else{
        $(node).attr(which, attribute);
      }
    });
    Q.each(contents, function(which, content){
      node.appendChild(content);
    });
    return node;
  };

  T._bindable_attributes = ['onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onkeypress', 'onkeydown', 'onkeyup', 'onchange'];

  T._collate = function(attributes, contents, item){
    if( item === null || item === undefined || item === false || item === true ){
      return;
    }else if( item.nodeType ){ // add all DOM elements to the contents array
      contents.push(item);
    }else if( Q.type_of(item, ['string', 'number'])  ){ // render strings and numbers into nodes and place them in the content array
      contents.push(document.createTextNode(Q.unescape_html(item)));
    }else if( item.jquery ){ // place all memebers of jquery objects into the contents array
      Q.ascend(item, function(which, node){
        contents.push(node);
      });
    }else if( Q.is_plural(item) ){ // iterate over arrays and operate on the contents
      Q.each(item, function(which, subitem){
        T._collate(attributes, contents, subitem);
      });
    }else if( Q.type_of(item, 'function') ){ // run any function and operate normally on its results
      T._collate(attributes, contents, item());
    }else if( Q.type_of(item, 'object') ){ // item is a dictionary - consider it a mapping of attribute keys to values
      Q.each(item, function(which, property){
        attributes[which.toLowerCase()] = Q.defaulted(attributes[which.toLowerCase()], item[which]);
      });
      Q.defaults(attributes, item, {});
    }else{ // something went wrong
      Q.error('Unexpected input to T._collate()');
    }
  };

  // make shortcuts for each of the basic dom types - T.div, T.span, etc
  T._node_shortcuts = ['a', 'big', 'blockquote', 'br', 'button', 'center', 'dd', 'div', 'dl', 'dt', 'em', 'embed', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'iframe', 'img', 'input', 'label', 'label', 'li', 'object', 'ol', 'p', 'param', 'q', 'small', 'span', 'strong', 'table', 'tbody', 'td', 'textarea', 'tr', 'ul'];
  Q.each(T._node_shortcuts, function(which, shortcut){
    T[shortcut] = function(){ return T.call({}, shortcut, arguments); };
  });
  T.clearfix = function(){ return T.div({'style':'clear:both;'}); };

}()); // end of module definition
