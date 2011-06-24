$(function() {

    // Set up current models
    Po = Backbone.Model.extend();
    User = Backbone.Model.extend();
    Vendor = Backbone.Model.extend();

    // Set up collections
    PoList = Backbone.Collection.extend({

        model: Po,
        url: '/pos'

    });

    UserList = Backbone.Collection.extend({
        model: User,
        url: '/users'
    });

    VendorList = Backbone.Collection.extend({
        model: Vendor,
        url: '/vendors'
    })

    // Create collections 
    var Pos = new PoList;
    var Users = new UserList;
    var Vendors = new VendorList;


    NewVendorView = Backbone.View.extend({
        el: $(".content"),

        template: "newVendor",

        //events: {
          //  "submit form": "save"
       // },

        initialize: function() {
            this.render();
        },

        render: function() {
            this.el.append(JST[this.template](this.model));
        },

        save: function() {
            //console.log(this.$('[name=name]').val());
            Vendors.create({
                name: this.$('[name=name]').val()
            }, { success: function(model, resp) {
              alert('yes')}  
            } , { error: function() {
                alert('no')
            }
        });

            //  window.location.hash = "";
            return false;
        }

    });


    PoView = Backbone.View.extend({

        initialize: function() {
          _.bindAll(this, 'render', 'attributes');  
        },

        tagName: "li",

        template: "po",

        render: function() {
            var attr = this.attributes();
            //console.log(this.model);
            //console.log(attr);
            $(this.el).html(JST[this.template](attr));
            return this;

        },

        attributes: function() {
            var attr = this.model.toJSON();
            var vendor = Vendors.find(function(vendor) {
                return vendor.get("id") == attr.vendor_id; 
            });

            return attr;
        }

    });

    NewResourceView = Backbone.View.extend({
        tagName: "div",

        template: "newResource",

        events: {
            "click .cancel" : "show",
            "click button"  : "create",
            "keypress input": "check"
        },

        autocomplete: {
            "attr"       : "name",
            "collection" : "Vendors"
        },

        initialize: function() {
            _.bindAll(this, 'render', 'check');
            this.render;
            
        },

        render: function() {
            var attr;
            $(this.el).append(JST[this.template](attr));
            return this;   
        },

        show: function() {
            footerView.show();
            $(this.el).remove();
        },

        create: function() {
            Vendors.create({
                name: $('[name=name]').val()
            });
            return false;
        },

        check: function(event) {
            var self = this;
            var search = $("#search").val();
            $(".resource-results").children().remove();
            search += String.fromCharCode(event.which);
            search = search.toLowerCase();
            if (search === '') return;
            var attr = this.autocomplete.attr;
            
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

        addResult: function(info) {
            var name = info.attributes.name;
            $(".resource-results").append("<div>" + name + "</div>");
        }


    });

    FooterView = Backbone.View.extend({
       el : $(".footer"),

       template: "footer",

       events: {
           "click" : "showNewVendor"
       },
       
       initialize: function() {
            var view = $(this.el).html(JST[this.template]);
            this.newresource = $(".new-resource");
       },

       showNewVendor: function() {
           this.newresource.hide();
           MainView.showNewVendor();
       },

       show: function() {
           this.newresource.show();
       }

    });

    AppView = Backbone.View.extend({

        el: $("#app"),

        initialize: function() {
            _.bindAll(this, 'addOne', 'addAll');

            Pos.bind('add', this.addOne);
            Pos.bind('refresh', this.addAll);
            
            footerView = new FooterView;
            Vendors.fetch();
            Pos.fetch();
        },

        addOne: function(po) {
            var view = new PoView({model: po});
            this.$("#po-list").append(view.render().el);
        },

        addAll: function() {
            Pos.each(this.addOne);

        },

        showNewVendor: function() {
            var sidebar = new NewResourceView;
            this.el.append(sidebar.render().el);
        }


    });

    AppController = Backbone.Controller.extend({
       routes: {
           "" : "index",
           "!/new/:resource" : "new"
       }, 

       index: function() {
           
       },
       new: function(resource) {
        if (resource === 'vendor') {
            new NewVendorView({model: new Vendor()});
        }
           
       }
    });

    MainView = new AppView();
    App = new AppController();

    Backbone.history.start();

    
});