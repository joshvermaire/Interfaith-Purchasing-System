$(function() {

    // Set up current models
    Po = Backbone.Model.extend({
        template: "po"
    });
    User = Backbone.Model.extend();
    Vendor = Backbone.Model.extend({
        template: "vendor"
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

    CurrentUser = Backbone.Model.extend({
        url: '/users/sign_in.json'
    });

    newUser = Backbone.Model.extend({
        url: '/users/edit.json'
    });

    VendorList = Backbone.Collection.extend({
        model: Vendor,
        url: '/vendors'
    });

    // Create collections 
    var Pos = new PoList;
    var Users = new UserList;
    var Vendors = new VendorList;


    ResourceView = Backbone.View.extend({

        initialize: function() {
          _.bindAll(this, 'render');
        },

        tagName: "li",

        render: function() {
            var jmodel = this.model.toJSON();
            if(this.model.collection == Pos) {
                jmodel.vendor = jmodel.vendor || Vendors.get(jmodel.vendor_id).toJSON();
            }
            $(this.el).html(JST[this.options.template](jmodel));
            return this;    
        }

    });



    NewResourceView = Backbone.View.extend({
        el: $("#middle #sub-right"),

        //template: "newResource",

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
            //this.$('.side-header').html('Create ' + this.type);
            $(this.el).append(JST[this.options.template]({
                "attrib" : this.attrib,
                "collection" : this.collection,
                "type" : this.type
                
            }));
            $(".datepicker").datepicker();
            return this;   
        },

        create: function() {
            if (this.type == "vendor") {
                //console.log(this.collection);
                this.collection.create({
                name: $('.resource-vendor [name=name]').val()
            });
            $('[name=name]').val('');
            return false;
            } else if (this.type == "po") {
                //console.log(this.collection);
            
            
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
            return false;
            }
            return;
            }
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
            $(".resource-results").append("<div>" + model.attributes.name + "</div>");
        }


    });

    SimpleView = Backbone.View.extend({
       
       initialize: function() {
            this.template = this.options.template;
           $(this.el).html(JST[this.template]);
       }

    });

    /* Set up main app view */
    AppView = Backbone.View.extend({

        el: $("#app"),

        events: {
            "click #sign_in": "signInForm",
            "click #signinlogin": "login",
            "click #sign_in_form": "stopPropagation",
            "click #sign_in_over": "signInFormClose"
        },

        initialize: function() {
            _.bindAll(this, 'addOne', 'addAll');

            Pos.bind('add', this.addOne);
            //Pos.bind('refresh', this.addAll);
            
            bottomView = new SimpleView({el: $("#bottom"), template: "footer"});

        },

        stopPropagation: function(e) {
            e.stopPropagation();
        },

        signInForm: function() {
            //var testing = $("#sign_in_form, top, middle");
            //var testing += $("")
            $("#sign_in_over").fadeIn();
            $("#sign_in_form").show("slide", {direction: "right" }, 750);
            //testing.slideDown();
        },

        signInFormClose: function() {
            $("#sign_in_form").hide("slide", {direction: "right" }, 750);
            $("#sign_in_over").fadeOut();
        },

        addOne: function(res) {
            //console.log(res);
            //console.log(res.template);
            var view = new ResourceView({model: res, template: res.template});
            this.$("#" + res.collection.template +" #resource-list").append(view.render().el);
        },

        addAll: function(col) {
            if (col.show != "show") {
            col.each(this.addOne);
            col.show = "show";
            }
        },

        login: function() {
            var login = {
                user: {
                    email: $("#signinemail").val(),
                    password: $("#signinpw").val(),
                    remember_me: $("#sign_in_form [name=remember_me]").val()
                    }
            };
            currentUser = new CurrentUser;
            currentUser.save(login, { success: function(model, response) {
                            console.log(response.email);
                            location.reload(true);
                        }, error: function(model,  response) {
                            console.log(response);
                            console.log(model);
                        }});

        }


    });

    /* Main Controller */
    AppController = Backbone.Controller.extend({

        initialize: function() {
            Vendors.fetch();
            Pos.fetch();
            this.saveLocation('!/');
        },

        routes: {
            "!/" : "index",
            "!/:resource" : "resource",
            "!/:resource/new" : "newResource",
            "!/:resource/:id" : "showResource"
        }, 

        index: function() {
            this.sideHeader('Welcome');
            if (typeof MainView == "undefined") {
                MainView = new AppView();
            };
            $("#middle #sub-right > div").addClass('hidden');
            $("#welcome").removeClass('hidden');
        },

        resource: function(resource) {
            if (resource == "po") {
                $("#middle #sub-right > div").addClass('hidden');
                $("#po").removeClass('hidden');
                this.sideHeader('List POs');
                Pos.template = "po";
                MainView.addAll(Pos);
            } else if (resource == "vendor") {
                $("#middle #sub-right > div").addClass('hidden');
                $("#vendor").removeClass('hidden');
                this.sideHeader('List Vendors');
                Vendors.template = "vendor";
                MainView.addAll(Vendors);
            };
            
        },

        newResource: function(resource) {
            $("#middle #sub-right > div").addClass('hidden');
            if (resource == 'vendor') {
                this.sideHeader('Create Vendor');
                if(typeof vendorNewView == "undefined") {
                    vendorNewView = new NewResourceView({model: new Vendor(), collection: Vendors, template: "newVendor"});
                }
            } else if (resource == 'po') {
                this.sideHeader('Create PO');
                if(typeof poNewView == "undefined") {
                    poNewView = new NewResourceView({model: new Po(), type: "po", collection: Pos, template: "newPo", attrib: "vendor" });
                }
            }
            $('.resource-' + resource).removeClass('hidden');
        },

        sideHeader: function(display) {
            $("#middle .right .side-header").html(display);
        },

        showResource: function(resource, id) {
            
        }
    });

    
    App = new AppController();
    MainView = new AppView();
    Backbone.history.start();


    
});