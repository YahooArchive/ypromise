var __modules = {};

function define(name, deps, factory) {
    if (typeof deps === 'function') {
        factory = deps;
        deps = ['require', 'exports', 'module'];
    }
    __modules[name] = {
        deps: deps,
        factory: factory
    };
}

function require(name) {
    var definition = __modules[name],
        requires   = definition.deps,
        module     = {exports: {}},
        deps       = [],
        i;

    for (i = 0; i < requires.length; i++) {
        switch (requires[i]) {
            case 'require':
                deps[i] = require;
                break;
            case 'module':
                deps[i] = module;
                break;
            case 'exports':
                deps[i] = module.exports;
                break;
            default:
                deps[i] = require(requires[i]);
                break;
        }
    }
    
    definition.factory.apply(null, deps);
    return module.exports['default'] || module.exports;
}
