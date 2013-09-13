// ==========================================================================
// Project:   The M-Project - Mobile HTML5 Application Framework
// Copyright: (c) 2013 M-Way Solutions GmbH. All rights reserved.
//            (c) 2013 panacoda GmbH. All rights reserved.
// Creator:   Frank
// Date:      02.04.2013
// License:   Dual licensed under the MIT or GPL Version 2 licenses.
//            http://github.com/mwaylabs/The-M-Project/blob/master/MIT-LICENSE
//            http://github.com/mwaylabs/The-M-Project/blob/master/GPL-LICENSE
// ==========================================================================

M.Store = function() {
    this.initialize.apply(this, arguments);
};

M.Store.extend = Backbone.Model.extend;

M.Store.create = M.create;

// Attach all inheritable methods to the Connector prototype.
_.extend(M.Store.prototype, Backbone.Events, M.Object, {

    _type: 'M.Store',

    name: '',

    url: '',

    entities: null,

    typeMapping: function() {
        var map = {};
        map [M.CONST.TYPE.OBJECTID] = M.CONST.TYPE.STRING;
        map [M.CONST.TYPE.DATE]     = M.CONST.TYPE.STRING;
        map [M.CONST.TYPE.BINARY]   = M.CONST.TYPE.TEXT;
        return map;
    }(),

    initialize: function( config ) {
        config = config || {};
        this.name = config.name || this.name;
        this.url = config.url || this.url;
        this.typeMapping = config.typeMapping || this.typeMapping;

        var entities = config.entities || this.entities || {};
        this.entities = {};
        for( var name in entities ) {
            var entity = M.Entity.from(entities[name], {
                store: this,
                typeMapping: this.typeMapping
            });
            entity.name = entity.name || name;

            // connect collection and model to this store
            var collection = entity.collection || M.Collection.extend({ model: M.Model.extend({}) });
            var model      = collection.prototype.model;
            // keep old entity and store
            collection.prototype.lastEntity = model.prototype.lastEntity = collection.prototype.entity;
            collection.prototype.lastStore  = model.prototype.lastStore  = collection.prototype.store;
            // set new entity and name
            collection.prototype.entity = model.prototype.entity = name;
            collection.prototype.store  = model.prototype.store  = this;

            entity.idAttribute = entity.idAttribute || model.prototype.idAttribute;
            this.entities[name] = entity;
        }
    },

    getEntity: function(obj) {
        if (obj) {
            var entity = obj.entity || obj;
            var name   = _.isString(entity) ? entity : entity.name;
            if (name) {
                return this.entities[name] || (entity && entity.name ? entity : { name: name });
            }
        }
    },

    getCollection: function(entity) {
        if (_.isString(entity)) {
            entity = this.entities[entity];
        }
        if (entity && entity.collection) {
            if (M.Collection.prototype.isPrototypeOf(entity.collection)) {
                return entity.collection;
            } else {
                return new entity.collection();
            }
        }
    },

    createModel: function(entity, attrs) {
        if (_.isString(entity)) {
            entity = this.entities[entity];
        }
        if (entity && entity.collection) {
            var model = entity.collection.model || entity.collection.prototype.model;
            if (model) {
                return new model(attrs);
            }
        }
    },

    getArray: function( data ) {
        if (_.isArray(data)) {
            return data;
        } else if (M.isCollection(data)) {
            return data.models;
        }
        return _.isObject(data) ? [ data ] : []
    },

    getDataArray: function( data ) {
        var array = [];
        if( _.isArray(data) || Backbone.Collection.prototype.isPrototypeOf(data) ) {
            _.each(data, function( d ) {
                var attrs = this.getAttributes(d);
                if( attrs ) {
                    array.push(attrs);
                }
            });
        } else {
            var attrs = this.getAttributes(data);
            if( attrs ) {
                array.push(this.getAttributes(attrs));
            }
        }
        return array;
    },

    getAttributes: function( model ) {
        if( Backbone.Model.prototype.isPrototypeOf(model) ) {
            return model.attributes;
        }
        return _.isObject(model) ? model : null;
    },

    initModel: function( model ) {
    },

    initCollection: function( collection ) {
    },

    initEntity: function( entity ) {
    },

    sync: function( method, model, options ) {
    },

    /**
     *
     * @param collection usally a collection, but can also be a model
     * @param options
     */
    fetch: function( collection, options ) {
        if( collection && !collection.models && !collection.attributes && !options ) {
            options = collection;
        }
        if( (!collection || (!collection.models && !collection.attributes)) && options && options.entity ) {
            collection = this.getCollection(options.entity);
        }
        if( collection && collection.fetch ) {
            var opts = _.extend({}, options || {}, { store: this });
            collection.fetch(opts);
        }
    },

    create: function( collection, model, options ) {
        if( collection && !collection.models && !options ) {
            model = collection;
            options = model;
        }
        if( (!collection || !collection.models) && options && options.entity ) {
            collection = this.getCollection(options.entity);
        }
        if( collection && collection.create ) {
            var opts = _.extend({}, options || {}, { store: this });
            collection.create(model, opts);
        }
    },

    save: function( model, attr, options ) {
        if( model && !model.attributes && !options ) {
            attr = model;
            options = attr;
        }
        if( (!model || !model.attributes) && options && options.entity ) {
            model = this.createModel(options.entity);
        }
        if( model && model.save ) {
            var opts = _.extend({}, options || {}, { store: this });
            model.save(attr, opts);
        }
    },

    destroy: function( model, options ) {
        if( model && model.destroy ) {
            var opts = _.extend({}, options || {}, { store: this });
            model.destroy(opts);
        }
    },

    _checkEntity: function( obj, entity ) {
        if( !entity ) {
            var error = M.Error.create(M.CONST.ERROR.VALIDATION_PRESENCE, "No valid entity passed.");
            this.handleCallback(obj.error, error);
            this.handleCallback(obj.finish, error);
            return false;
        }
        return true;
    },

    _checkData: function( obj, data ) {
        if( (!_.isArray(data) || data.length == 0) && !_.isObject(data) ) {
            var error = M.Error.create(M.CONST.ERROR.VALIDATION_PRESENCE, "No data passed.");
            this.handleCallback(obj.error, error);
            this.handleCallback(obj.finish, error);
            return false;
        }
        return true;
    },

    handleSuccess: function( obj ) {
        var args = Array.prototype.slice.call(arguments, 1);
        if( obj.success ) {
            this.handleCallback.apply(this, [ obj.success ].concat(args));
        }
        if( obj.finish ) {
            this.handleCallback.apply(this, [ obj.finish ].concat(args));
        }
    },

    handleError: function( obj ) {
        var args = Array.prototype.slice.call(arguments, 1);
        if( obj.error ) {
            this.handleCallback.apply(this, [ obj.error ].concat(args));
        }
        if( obj.finish ) {
            this.handleCallback.apply(this, [ obj.finish ].concat(args));
        }
    }

});
