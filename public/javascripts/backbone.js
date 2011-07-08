$(function() {

    server = "http://localhost:3000/";
    loggedIn = function() {
        if (interfaith.user_id) {
            return true;
        } else {
            return false;
        }
    };

    // Set up current models
    Po = Backbone.Model.extend({
        template: "po",
        url: function() {
            var base = 'pos';
            if (this.isNew()) return base;
            return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id;
        }
    });
    User = Backbone.Model.extend();
    Vendor = Backbone.Model.extend({
        template: "vendor",
        url: function() {
            var base = 'vendors';
            if (this.isNew()) return base;
            return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id;
        }
    });

    // Set up collections
    PoList = Backbone.Collection.extend({

        model: Po,
        url: '/pos'

    });

    UserList = Backbone.Collection.extend({
        model: User,
        url: '/users'
    });

    CurrentUser = Backbone.Model.extend();

    newUser = Backbone.Model.extend({
        url: '/users/edit.json'
    });

    VendorList = Backbone.Collection.extend({
        model: Vendor,
        url: '/vendors'
    });

    // Create collections 
    Pos = new PoList;
    Users = new UserList;
    Vendors = new VendorList;


    ResourceView = Backbone.View.extend({

        initialize: function() {
          _.bindAll(this, 'render', 'vendor', 'approved', 'navigate');
          //this.model.bind("change:approved", console.log(this.model));
        },

        events: {
            "click .po-vendor"   : "vendor",
            "click .approved"    : "approved",
            "click"              : "navigate"
        },

        tagName: "li",

        render: function() {
            if (!this.model.get('user_id')) { this.model.set({user_id: "1"})}; 
            var jmodel = this.model.toJSON();

            if(this.model.collection == Pos) {
                jmodel.vendor = jmodel.vendor || Vendors.get(jmodel.vendor_id).toJSON();
                jmodel.user = jmodel.user || Users.get(jmodel.user_id).toJSON();
                var interfaith = interfaith || {};
                interfaith.user_id = interfaith.user_id || 1;
                if (!jmodel.approved && interfaith.user_id == 1) {
                    jmodel.approved = '<div class="approved">Approve me</div>';
                } else {
                    jmodel.approved = null;
                };
            }
            $(this.el).html(JST[this.options.template](jmodel));
            return this;    
        },

        vendor: function() {
        },

        approved: function() {
            var interfaith = interfaith || {};
            interfaith.user_id = interfaith.user_id || 1;
            this.model.unset("vendors");
            this.model.save({approved: interfaith.user_id});
            var hash = window.location.hash;
            if (hash == '#po/approve') {
                this.$('.approved').fadeOut();
            } else {
            var self = this;
            $(this.el).fadeOut(750, function() { self.remove()});
            };

        },

        navigate: function(e) {
            if (e.target.className == "approved") return;
            var hash = window.location.hash;
            if (hash == "#po" || hash == "#vendor") {
                App.navigate(hash + '/' + this.model.id, true);
            } else {
                App.navigate("#po/" + this.model.id, true);
            }
        }

    });



    NewResourceView = Backbone.View.extend({
        el: $("#middle #sub-right"),

        events: {
            "click div#po-submit"  : "create",
            "click div#vendor-submit" :"create",
            "keypress input": "check"
        },

        initialize: function(o) {
            o || (o = {});
            this.type = o.type || "vendor";
            this.collection = this.options.collection;
            this.attrib = o.attrib || "name";
            _.bindAll(this, 'render', 'check');
            this.render();
            
        },

        render: function() {
            $(this.el).html(JST[this.options.template]({
                "attrib" : this.attrib,
                "collection" : this.collection,
                "type" : this.type
                
            }));
            $(".datepicker").datepicker();
            return this;   
        },

        create: function() {
            if (this.type == "vendor") {
                this.collection.create({
                name: $('.resource-vendor [name=name]').val()
                });

                $('[name=name]').val('');

            } else if (this.type == "po") {
            
                var name = $('.resource-po [name=name]').val();
                var vendor_id = Vendors.find(function(po) {
                        return po.get("name") === name;
                });
                vendor_id = vendor_id.id;
                var amount = $('.resource-po [name=amount]').val();
                var date_needed = $('.resource-po [name=date-needed]').val();
                
                if (vendor_id != "undefined"){
                    this.collection.create({
                        vendor_id: vendor_id,
                        needed: date_needed,
                        amount: amount,
                        user_id: interfaith.user_id
                    }, {error: function(model, error) {
                        console.log(model);
                        console.log(error);
                        }
                    });
                }
            }
            location.hash = "/"
        },

        check: function(event) {
            var self = this;
            $(".resource-results").children().remove();
            var search = $("#search").val();
            search += String.fromCharCode(event.which);
            search = search.toLowerCase();

            if (search === '') return;

            Vendors.chain()
                .sortBy(function(model){ return model.attributes.name; })
                .each(function(model) {
                    var string = model.attributes.name.toLowerCase();

                    var chara = string.indexOf(search);
                    if (chara >= 0) {
                        self.addResult(model);
                    }
                });
        },

        addResult: function(model) {
            $(".resource-results").append("<div>" + model.get('name') + "</div>");
        }


    });

    SimpleView = Backbone.View.extend({
       
       initialize: function() {
            _.bindAll(this, "render");
            this.data = this.model || {};
            if ($.isEmptyObject(this.data) == false ) {this.data = this.data.toJSON()};
            //this.template = this.options.template;
            if (this.model && !this.model.get('user_id')) { 
                this.model.set({user_id: "1"}) 
                this.data = this.model.toJSON();
                if (this.model.template == "po") {
                    this.data.vendor = this.data.vendor || Vendors.get(this.data.vendor_id).toJSON();
                    this.data.user = this.data.user || Users.get(this.data.user_id).toJSON();
                }
            }
            this.render();
       },

       render: function() {
           $(this.el).html(JST[this.options.template](this.data));
       }

    });

    /* Set up main app view */
    AppView = Backbone.View.extend({

        el: $("#app"),

        events: {
            "click li#sign_in": "signInForm",
            "click #signinlogin": "login",
            "click #signout": "logout",
            "click #sign_in_form": "stopPropagation",
            "click #sign_in_over": "signInFormClose",
            "click a": "click"
        },

        initialize: function() {
            _.bindAll(this, 'addOne', 'addAll');

            Pos.bind('add', this.addOne);
            //Pos.bind('reset', this.addAll);
            //Vendors.bind('add', this.addOne);
            //Vendors.bind('reset', this.addAll);
            
            bottomView = new SimpleView({el: $("#bottom"), template: "footer"});

        },

        click: function(e) {
            //console.log(e);
            //var jhref = e.target.href.substr(22);
            //App.navigate( e.target.href.substr(22), true);
            //console.log(this);
            //return false;
        },

        stopPropagation: function(e) {
            e.stopPropagation();
        },

        signInForm: function() {
            //e.stopPropogation();
            App.navigate('users/sign_in');
            $("#sign_in_over").fadeIn();
            //$("#sign_in_over").show("slide", {direction: "right" }, 750);  //Changed from #sign_in_form
        },

        signInFormClose: function() {
            //$("#sign_in_form").hide("slide", {direction: "right" }, 500);
            App.navigate('');
            $("#sign_in_over").fadeOut();
        },

        addOne: function(res) {
            var view = new ResourceView({model: res, template: res.template});
            this.$("#sub-right #resource-list").append(view.render().el);
        },

        addAll: function(col) {
            col.each(this.addOne);
        },

        login: function() {
            var login = {
                user: {
                    email: $("#signinemail").val(),
                    password: $("#signinpw").val(),
                    remember_me: $("#sign_in_form [name=remember_me]").val()
                    }
            };
            var url = server + "users/sign_in.json";
            currentUser = new CurrentUser();
            currentUser.url = url;
            currentUser.save(login, { success: function(model, response) {
                            window.location = server;
                        }, error: function(model,  response) {
                            console.log(model);
                            console.log(response);
                        }});

        },

        logout: function() {
            App.navigate('users/sign_out');
            var url = server + "users/sign_out.json";
            currentUser = new Backbone.Model;
            currentUser.url = url;
            currentUser.fetch({
                success: function(model, response) {
                    window.location = server; 
                }
            });
        }


    });

    /* Main Router */
    AppRouter = Backbone.Router.extend({

        initialize: function() {
            //MainView = new AppView();
            //_.extend(, this.routes)
            this.navigate('');
        },

        routes: {
            ""               : "index",

            /* PO Routes */
            "po"             : "resourcePo",
            "po/new"         : "newPo",
            "po/approve"     : "approvePo",
            "po/:id"         : "showPo",

            /* Vendor Routes */
            "vendor"         : "resourceVendor",
            "vendor/new"     : "newVendor",
            "vendor/:id"     : "showVendor",

            /* User Routes */
            "users/sign_in"  : "sign_in",
            "users/sign_out" : "sign_out",

            /* 404 */
            "*path"          : "fourohfour"
        }, 

        index: function() {
            var num = Pos.filter(function(model) { return model.get('approved') == null});
            $('#sub-right').html('<h1>WELCOME, friend</h1><p>You have ' + num.length + ' POs waiting to be approved.</p>');
        },

        resourcePo: function() {
            $('#sub-right').html('<div class="header cf"><div class="po-vendor">Vendor Name</div><div class="po-date">Date Needed</div><div class="po-user">User Email</div><div class="po-amount">Amount</div></div><ul id="resource-list" class="resource-list"></ul>');
            Pos.template = "po";
            MainView.addAll(Pos);
        },

        newPo: function() {
            new NewResourceView({model: new Po(), type: "po", collection: Pos, template: "newPo", attrib: "vendor" });
        },

        approvePo: function() {
            $('#sub-right').html('<div class="header cf"><div class="po-vendor">Vendor Name</div><div class="po-date">Date Needed</div><div class="po-user">User Email</div><div class="po-amount">Amount</div></div><ul id="resource-list" class="resource-list"></ul>');
            Pos.template = "po";
            var num = Pos.filter(function(model) { return model.get('approved') == null});
            var nums = _.each(num, function(n) { MainView.addOne(n); });

        },

        showPo: function(id) {
            var po = new Po({id: id});
            po.fetch({
                success: function(model, resp) {
                    new SimpleView({model: po, el: $("#sub-right"), template: "viewPo"});
                    //view.el.html(view.render());
                },
                error: function(model, resp) {
                    console.log('Error showResource');
                    console.log(model);
                }
            });

        },
        
        resourceVendor: function() {
            $('#sub-right').html('<div class="header cf"><div class="po-vendor">Vendor Name</div><div class="po-amount">Approved</div></div><ul id="resource-list" class="resource-list"></ul>');
            Vendors.template = "vendor";
            MainView.addAll(Vendors);
            
        },

        newVendor: function() {
            new NewResourceView({model: new Vendor(), collection: Vendors, template: "newVendor"});
        },

        showVendor: function(id) {
            var vendor = new Vendor({id: id});
            vendor.fetch({
                success: function(model, resp) {
                    new SimpleView({model: vendor, el: $("#sub-right"), template: "viewVendor"});
                    //view.el.html(view.render());
                },
                error: function(model, resp) {
                    console.log('Error showResource');
                    console.log(model);
                }
            });

        },

        sign_in: function() {
            MainView.signInForm();
        },

        sign_out: function() {
            MainView.logout();
        },

        fourohfour: function(path) {
            alert(path + ' 404 baby');
        }

    });
    Pos.fetch();
    Vendors.fetch();
    Users.fetch();
    MainView = new AppView();
    _.defer(function() {
        App = new AppRouter();
        Backbone.history.start();
    });
    //MainView = new AppView();
    //Backbone.history.start({pushState: true});
    
});