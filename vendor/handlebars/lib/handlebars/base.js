// BEGIN(BROWSER)

/*jshint eqnull:true*/
var Handlebars = {};

Handlebars.VERSION = "1.0.beta.5";

Handlebars.helpers  = {};
Handlebars.partials = {};

Handlebars.registerHelper = function(name, fn, inverse) {
  if(inverse) { fn.not = inverse; }
  this.helpers[name] = fn;
};

Handlebars.registerPartial = function(name, str) {
  this.partials[name] = str;
};

Handlebars.registerHelper('helperMissing', function(arg) {
  if(arguments.length === 2) {
    return undefined;
  } else {
    throw new Error("Could not find property '" + arg + "'");
  }
});

var toString = Object.prototype.toString, functionType = "[object Function]";

Handlebars.registerHelper('blockHelperMissing', function(context, options) {
  var inverse = options.inverse || function() {}, fn = options.fn;


  var ret = "";
  var type = toString.call(context);

  if(type === functionType) { context = context.call(this); }

  if(context === true) {
    return fn(this);
  } else if(context === false || context == null) {
    return inverse(this);
  } else if(type === "[object Array]") {
    if(context.length > 0) {
      for(var i=0, j=context.length; i<j; i++) {
        ret = ret + fn(context[i]);
      }
    } else {
      ret = inverse(this);
    }
    return ret;
  } else {
    return fn(context);
  }
});

Handlebars.registerHelper('each', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  var ret = "";

  if(context && context.length > 0) {
    for(var i=0, j=context.length; i<j; i++) {
      ret = ret + fn(context[i]);
    }
  } else {
    ret = inverse(this);
  }
  return ret;
});

Handlebars.registerHelper('if', function(context, options) {
  var type = toString.call(context);
  if(type === functionType) { context = context.call(this); }

  if(!context || Handlebars.Utils.isEmpty(context)) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

Handlebars.registerHelper('unless', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  options.fn = inverse;
  options.inverse = fn;

  return Handlebars.helpers['if'].call(this, context, options);
});

Handlebars.registerHelper('with', function(context, options) {
  return options.fn(context);
});

Handlebars.registerHelper('log', function(context) {
  Handlebars.log(context);
});

Handlebars.loadPartial = function loadPartial(name) {
    var partial = Handlebars.partials[name];
    if (typeof partial === "string") {
        partial = Handlebars.compile(partial);
        Handlebars.partials[name] = partial;
    }
    return partial;
};

var renderInherited = function renderInherited(context, name, saved, child, parent) {
    Handlebars.registerPartial(name, parent);
    var out = child(context);
    Handlebars.registerPartial(name, saved);
    return out;
};

Handlebars.registerHelper("override", function override(name, options) {

    /* Would be nice to extend Handlebars so that the blocks dictionary would reset at every top-level instantiation, or better yet, pass it around in the options (instead of using a module-level variable). To avoid such invasion, though, we check to initialize before every use, and clear after all uses finished. */
    var blocks = Handlebars.blocks = Handlebars.blocks || Object.create(null);

    var override = blocks[name];
    var parent = options.fn;

    if (override) {
        var wrapper = function wrapper(context) {
            var grandparent = Handlebars.loadPartial(name);
            var parentWrapper = function parentWrapper(subcontext) {
                return renderInherited(/*context=*/subcontext, name,
                                       /*saved=*/parentWrapper,
                                       /*child=*/parent,
                                       /*parent=*/grandparent);
            };
            return renderInherited(context, name,
                                   /*saved=*/grandparent,
                                   /*child=*/override,
                                   /*parent=*/parentWrapper);
        };
    } else {
        var wrapper = parent;
    }

    blocks[name] = wrapper;
});


Handlebars.registerHelper("block", function block(name, options) {
    var blocks = Handlebars.blocks = Handlebars.blocks || Object.create(null);

    var override = blocks[name];
    if (override) {
        /* We let templates include parent blocks with regular partials---e.g., `{{> parent}}`---but we cannot "store" the blocks as partials - we have to discriminate between blocks and partials so that we can clear the former but not the latter at the end of every top-level instantiation. */
        var out = renderInherited(/*context=*/this, name,
                                  /*saved=*/undefined,
                                  /*child=*/override,
                                  /*parent=*/options.fn);
    } else {
        var out = options.fn(this);
    }

    return out;
});

Handlebars.registerHelper("extend", function extend(name) {

    var base = Handlebars.loadPartial(name);
    var out = base(this);
    delete Handlebars.blocks;
    return new Handlebars.SafeString(out);

});

// END(BROWSER)

module.exports = Handlebars;

