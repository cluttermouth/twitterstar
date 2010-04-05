/**
 * cookieJSON (a reduction of JSON Cookie)
 *
 * Sets and retreives native JavaScript objects as cookies.
 * Depends on the object serialization framework provided by JSON2.
 *
 * Dependencies: jQuery, jQuery Cookie, JSON2
 *
 * @project cookieJSON
 * @author Marcus Phillips
 * @version 0.1
 */
(function ($) {
  $.extend({
    cookieJSON: function (key, value, options) {
      return arguments.length === 1 ?
        JSON.parse($.cookie(key)) :
        $.cookie(key, JSON.stringify(value), options);
    }
  });
})(jQuery);
