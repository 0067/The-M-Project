// ==========================================================================
// Project:   The M-Project - Mobile HTML5 Application Framework
// Copyright: (c) 2010 M-Way Solutions GmbH. All rights reserved.
// Creator:   Sebastian
// Date:      02.11.2010
// License:   Dual licensed under the MIT or GPL Version 2 licenses.
//            http://github.com/mwaylabs/The-M-Project/blob/master/MIT-LICENSE
//            http://github.com/mwaylabs/The-M-Project/blob/master/GPL-LICENSE
// ==========================================================================

/**
 * @class
 *
 * M.PageView is the prototype of any page. It is the seconds 'highest' view, right after
 * M.Application. A page is the container view for all other views.
 *
 * @extends M.View
 */
M.PageView = M.View.extend(
/** @scope M.PageView.prototype */ {

    /**
     * The type of this object.
     *
     * @type String
     */
    type: 'M.PageView',

    /**
     * States whether a page is loaded the first time or not. It is automatically set to NO
     * once the page was first loaded.
     *
     * @type Boolean
     */
    isFirstLoad: YES,

    /**
     * This property can be used to set the page's beforeLoad action.
     *
     * @type Object
     */
    beforeLoad: null,

    /**
     * This property can be used to set the page's onLoad action.
     *
     * @type Object
     */
    onLoad: null,

    /**
     * This property can be used to set the page's beforeHide action.
     *
     * @type Object
     */
    beforeHide: null,

    /**
     * This property can be used to set the page's onHide action.
     *
     * @type Object
     */
    onHide: null,

    /**
     * This property can be used to set the page's onOrientationChange action.
     *
     * @type Object
     */
    onOrientationChange: null,

    /**
     * Indicates whether the page has a tab bar or not.
     *
     * @type Boolean
     */
    hasTabBarView: NO,

    /**
     * The page's tab bar.
     *
     * @type M.TabBarView
     */
    tabBarView: null,

    /**
     * This property specifies the recommended events for this type of view.
     *
     * @type Array
     */
    recommendedEvents: ['pagebeforeshow', 'pageshow', 'pagebeforehide', 'pagehide'],

    /**
     * This property is used to specify a view's internal events and their corresponding actions. If
     * there are external handlers specified for the same event, the internal handler is called first.
     *
     * @type Object
     */
    internalEvents: null,

    /**
     * Renders in three steps:
     * 1. Rendering Opening div tag with corresponding data-role
     * 2. Triggering render process of child views
     * 3. Rendering closing tag
     *
     * @private
     * @returns {String} The page view's html representation.
     */
    render: function() {
        this.html += '<div id="' + this.id + '" data-role="page"' + this.style() + '>';

        this.renderChildViews();

        this.html += '</div>';

        this.writeToDOM();
        this.theme();
        this.registerEvents();
    },

    /**
     * This method is responsible for registering events for view elements and its child views. It
     * basically passes the view's event-property to M.EventDispatcher to bind the appropriate
     * events.
     *
     * It extend M.View's registerEvents method with some special stuff for page views and its
     * internal events.
     */
    registerEvents: function() {
        this.internalEvents = {
            pagebeforeshow: {
                target: this,
                action: 'pageWillLoad'
            },
            pageshow: {
                target: this,
                action: 'pageDidLoad'
            },
            pagebeforehide: {
                target: this,
                action: 'pageWillHide'
            },
            pagehide: {
                target: this,
                action: 'pageDidHide'
            }
        }
        this.bindToCaller(this, M.View.registerEvents)();
    },

    /**
     * This method writes the view's html string into the DOM. M.Page is the only view that does
     * that. All other views just deliver their html representation to a page view.
     */
    writeToDOM: function() {
        document.write(this.html);
    },

    /**
     * This method is called right before the page is loaded. If a beforeLoad-action is defined
     * for the page, it is now called.
     */
    pageWillLoad: function(id, event, nextEvent) {
        /* if this is the first page to be loaded, check if there is a tab bar and an active tab
           specified and switch to this tab. also reload this page to have a stable location hash. */
        // TODO: check if realy needed! if so: improve! otherwise: kill!
        if(M.Application.isFirstLoad) {
            M.Application.isFirstLoad = NO;
            var currentPage = M.ViewManager.getCurrentPage();
            if(currentPage && currentPage.hasTabBarView) {
                var tabBarView = currentPage.tabBarView;
                var activePage = M.ViewManager.getPage(tabBarView.activeTab.page);
                if(activePage !== currentPage) {
                    M.Controller.switchToPage(tabBarView.activeTab.page, M.TRANSITION.NONE, NO, YES);
                }
            }
        }

        /* initialize the loader for later use (if not already done) */
        if(M.LoaderView) {
            M.LoaderView.initialize();
        }
        
        /* delegate event to external handler, if specified */
        if(nextEvent) {
            M.EventDispatcher.callHandler(nextEvent, event, NO, [this.isFirstLoad]);
        }
    },

    /**
     * This method is called right after the page was loaded. If a onLoad-action is defined
     * for the page, it is now called.
     */
    pageDidLoad: function(id, event, nextEvent) {
        /* if there is a list on the page, reset it: deactivate possible active list items */
        // TODO: check if realy needed! if so: improve! otherwise: kill!
        $('#' + this.id).find('.ui-btn-active').each(function() {
            if(M.ViewManager.getViewById($(this).attr('id')) && M.ViewManager.getViewById($(this).attr('id')).type === 'M.ListItemView') {
                var listItem = M.ViewManager.getViewById($(this).attr('id'));
                listItem.removeCssClass('ui-btn-active');
            }
        });

        /* delegate event to external handler, if specified */
        if(nextEvent) {
            M.EventDispatcher.callHandler(nextEvent, event, NO, [this.isFirstLoad]);
        }

        this.isFirstLoad = NO;
    },

    /**
     * This method is called right before the page is hidden. If a beforeHide-action is defined
     * for the page, it is now called.
     */
    pageWillHide: function(id, event, nextEvent) {
        /* delegate event to external handler, if specified */
        if(nextEvent) {
            M.EventDispatcher.callHandler(nextEvent, event, NO, [this.isFirstLoad]);
        }
    },

    /**
     * This method is called right after the page was hidden. If a onHide-action is defined
     * for the page, it is now called.
     */
    pageDidHide: function(id, event, nextEvent) {
        /* delegate event to external handler, if specified */
        if(nextEvent) {
            M.EventDispatcher.callHandler(nextEvent, event, NO, [this.isFirstLoad]);
        }
    },

    /**
     * Triggers the rendering engine, jQuery mobile, to style the page and call the theme() of
     * its child views.
     *
     * @private
     */
    theme: function() {
        $('#' + this.id).page();
        this.themeChildViews();
    },

    /**
     * Applies some style-attributes to the page.
     *
     * @private
     * @returns {String} The page's styling as html representation.
     */
    style: function() {
        var html = '';
        if(this.cssClass) {
            if(!html) {
                html += ' class="';
            }
            html += this.cssClass;
        }
        if(html) {
            html += '"';
        }
        return html;
    }
    
});