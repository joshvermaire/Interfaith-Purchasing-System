(function() {
  $(function() {
    var AppRouter, MainView, Po, PoList, SimpleView, User, UserList, Vendor, VendorList, interfaith, isLoggedIn, msg, server;
    server = "http://localhost:3000/";
    isLoggedIn = function() {
      if (typeof window.interfaith === "undefined") {
        return false;
      } else {
        return true;
      }
    };
    interfaith = window.interfaith || {
      user_id: 1
    };
    msg = function(msg) {
      var bubble;
      bubble = $("#app .msg").html(msg);
      return bubble.fadeIn("slow").delay(2000).fadeOut("fast");
    };
    Po = Backbone.Model.extend({
      urlRoot: "/pos",
      template: "po"
    });
    User = Backbone.Model.extend();
    Vendor = Backbone.Model.extend({
      urlRoot: "/vendors",
      template: "vendor"
    });
    PoList = Backbone.Collection.extend({
      url: "/pos",
      model: Po,
      initialize: function() {
        _.bindAll(this, "approval");
        return this.bind('reset', _.compose(this.approval, this.confirm));
      },
      approval: function() {
        var num;
        num = this.filter(function(model) {
          return model.get("approved") === null && model.get("confirmed") !== interfaith.user_id && model.get("user_id") !== interfaith.user_id;
        });
        $('.po-approve-num').text(num.length);
        if (num.length === 0) {
          $('.po-approve-num').css('display', 'none');
        }
        return num;
      },
      confirm: function() {
        var num;
        num = this.filter(function(model) {
          return model.get("confirmed") === null && model.get("approved") !== interfaith.user_id && model.get("user_id") !== interfaith.user_id;
        });
        $('.po-confirm-num').text(num.length);
        if (num.length === 0) {
          $('.po-confirm-num').css('display', 'none');
        }
        return num;
      }
    });
    UserList = Backbone.Collection.extend({
      url: "/users",
      model: User
    });
    VendorList = Backbone.Collection.extend({
      url: "/vendors",
      model: Vendor
    });
    window.Pos = new PoList;
    window.Users = new UserList;
    Users.fetch();
    window.Vendors = new VendorList;
    Vendors.fetch();
    App.View.Resource = Backbone.View.extend({
      initialize: function() {
        _.bindAll(this, "render");
        return this.JSON = this.model.toJSON();
      },
      tagName: "li",
      render: function() {
        if (this.model.collection === Pos) {
          if (!this.JSON.vendor || this.JSON.user) {
            this.metadata();
          }
          this.JSON.approved = this.approve();
          this.JSON.confirmed = this.confirm();
        }
        $(this.el).html(JST[this.options.template](this.JSON));
        $(this.el).addClass('po' + this.JSON.id);
        return this;
      },
      metadata: function() {
        this.JSON.vendor = this.JSON.vendor || Vendors.get(this.JSON.vendor_id).toJSON();
        return this.JSON.user = this.JSON.user || Users.get(this.JSON.user_id).toJSON();
      },
      approve: function() {
        if (!this.JSON.approved && interfaith.can_approve === 1 && this.JSON.confirmed !== interfaith.user_id && this.JSON.user_id !== interfaith.user_id) {
          return "<a class=\"approved button\" href=\"/#" + this.model.template + "/" + this.JSON.id + "/approved\"><span class=\"check icon\"></span>Approve</a>";
        } else {
          return "<a style=\"height:20px;width:81px; display:inline-block; \"></a>";
        }
      },
      confirm: function() {
        if (!this.JSON.confirmed && interfaith.can_confirm === 1 && this.JSON.approved !== interfaith.user_id && this.JSON.user_id !== interfaith.user_id) {
          return "<a class=\"confirmed button positive\" href=\"/#" + this.model.template + "/" + this.JSON.id + "/confirmed\"><span class=\"check icon\"></span>Confirm</a>";
        } else {
          return "<a style=\"height:20px;width:81px; display:inline-block; \"></a>";
        }
      }
    });
    App.View.NewResource = Backbone.View.extend({
      el: $("#middle #sub-right"),
      events: {
        "click a#po-submit": "createPo",
        "click a#vendor-submit": "createVendor",
        "keypress input": "check"
      },
      initialize: function() {
        _.bindAll(this, "render", "check");
        return this.render();
      },
      render: function() {
        $(this.el).html(JST[this.options.template]);
        return this;
      },
      createVendor: function() {
        return this.collection.create({
          name: $(".resource-vendor [name=name]").val(),
          success: function(model, response) {
            $("[name=name").val("");
            return location.hash = "";
          },
          error: function(model, response) {
            return console.log('error createVendor');
          }
        });
      },
      createPo: function() {
        var vendor;
        vendor = Vendors.find(function(po) {
          return po.get("name") === $(".resource-po [name=name]").val();
        });
        if (vendor !== "undefined") {
          return this.collection.create({
            vendor_id: vendor.id,
            needed: $(".resource-po [name=date-needed]").val(),
            amount: $(".resource-po [name=amount]").val(),
            user_id: interfaith.user_id
          }, {
            success: function(model, response) {
              msg('PO created');
              console.log(model);
              return location.hash = "";
            },
            error: function(model, error) {
              console.log(model);
              return console.log(error);
            }
          });
        }
      },
      check: function(event) {
        var search, self, vendorArray, vendors;
        $(".resource-results").html('');
        search = $("#search").val();
        search += String.fromCharCode(event.which);
        search = search.toLowerCase();
        if (search === "") {
          return;
        }
        self = this;
        vendorArray = [];
        vendors = Vendors.each(function(model) {
          var chara, lcname;
          lcname = model.attributes.name;
          if (lcname) {
            lcname = lcname.toLowerCase();
            chara = lcname.indexOf(search);
            if (chara >= 0) {
              return vendorArray.push(model);
            }
          }
        });
        return _(vendorArray).chain().sortBy(function(model) {
          return model.attributes.name;
        }).each(function(model) {
          return self.addResult(model);
        });
      },
      addResult: function(model) {
        return $(".resource-results").append("<div>" + model.get("name") + "</div>");
      }
    });
    SimpleView = Backbone.View.extend({
      initialize: function() {
        var _ref;
        _.bindAll(this, "render");
        this.data = ((_ref = this.model) != null ? _ref.toJSON() : void 0) || {};
        return this.render();
      },
      render: function() {
        $(this.el).html(JST[this.options.template](this.data));
        return this;
      }
    });
    App.View.App = Backbone.View.extend({
      el: $("#app"),
      events: {
        "click li#sign_in": "signInForm",
        "click #signinlogin": "login",
        "click #signout": "logout",
        "click #sign_in_form": "stopPropagation",
        "click #sign_in_over": "signInFormClose"
      },
      initialize: function() {
        var bottomView;
        _.bindAll(this, "addOne", "addAll");
        return bottomView = new SimpleView({
          el: $("#bottom"),
          template: "footer"
        });
      },
      stopPropagation: function(event) {
        return event.stopPropagation();
      },
      signInForm: function() {
        App.Router.navigate("users/sign_in");
        return $("#sign_in_over").fadeIn();
      },
      signInFormClose: function() {
        App.Router.navigate("");
        return $("#sign_in_over").fadeOut();
      },
      addOne: function(resource) {
        var view;
        view = new App.View.Resource({
          model: resource,
          template: resource.template
        });
        return $("#resource-list").append(view.render().el);
      },
      addAll: function(collection) {
        return collection.each(this.addOne);
      },
      login: function() {
        var currentUser, login, url;
        login = {
          user: {
            email: $("#signinemail").val(),
            password: $("#signinpw").val(),
            remember_me: $("#sign_in_form [name=remember_me]").val()
          }
        };
        currentUser = new Backbone.Model();
        url = server + "users/sign_in.json";
        currentUser.url = url;
        return currentUser.save(login, {
          success: function(model, response) {
            return window.location = server;
          },
          error: function(model, response) {
            console.log(model);
            return console.log(response);
          }
        });
      },
      logout: function() {
        var currentUser, url;
        App.Router.navigate("users/sign_out");
        currentUser = new Backbone.Model();
        url = server + "users/sign_out.json";
        currentUser.url = url;
        return currentUser.fetch({
          success: function(model, response) {
            return window.location = server;
          }
        });
      }
    });
    AppRouter = Backbone.Router.extend({
      initialize: function() {
        return this.navigate("");
      },
      routes: {
        "": "index",
        "po": "resourcePo",
        "po/new": "newPo",
        "po/approve": "approvePo",
        "po/confirm": "confirmPo",
        "po/:id/approved": "approvedPo",
        "po/:id/confirmed": "confirmedPo",
        "po/:id": "showPo",
        "vendor": "resourceVendor",
        "vendor/new": "newVendor",
        "vendor/:id": "showVendor",
        "users/sign_in": "sign_in",
        "users/sign_out": "sign_out",
        "*path": "fourohfour"
      },
      index: function() {
        if (isLoggedIn()) {
          return $("#sub-right").html("<h1>WELCOME, " + window.interfaith.email + "</h1><p>You have <span class='po-approve-num'></span> POs waiting to be approved.</p>");
        } else {
          return $("#sub-right").html("<h1>Log in mothabrotha</h1>");
        }
      },
      resourcePo: function() {
        $("#sub-right").html("<div class=\"header cf\"><div class=\"po-vendor\">Vendor Name</div><div class=\"po-date\">Date Needed</div><div class=\"po-user\">User Email</div><div class=\"po-amount\">Amount</div></div><ul id=\"resource-list\" class=\"resource-list\"></ul>");
        Pos.template = "po";
        return MainView.addAll(Pos);
      },
      newPo: function() {
        return new App.View.NewResource({
          model: new Po,
          template: "newPo",
          collection: Pos
        });
      },
      approvePo: function() {
        var html, num, nums;
        Pos.template = "po";
        num = Pos.approval();
        if (num.length) {
          html = "<div class=\"header cf\"><div class=\"po-vendor\">Vendor Name</div><div class=\"po-date\">Date Needed</div><div class=\"po-user\">User Email</div><div class=\"po-amount\">Amount</div></div><ul id=\"resource-list\" class=\"resource-list\"></ul>";
          $('#sub-right').html(html);
          return nums = _.each(num, function(model) {
            return MainView.addOne(model);
          });
        } else {
          html = "You have no POs needing to be approved at this time";
          return $("#sub-right").html(html);
        }
      },
      confirmPo: function() {
        var html, num, nums;
        Pos.template = "po";
        num = Pos.confirm();
        if (num.length) {
          html = "<div class=\"header cf\"><div class=\"po-vendor\">Vendor Name</div><div class=\"po-date\">Date Needed</div><div class=\"po-user\">User Email</div><div class=\"po-amount\">Amount</div></div><ul id=\"resource-list\" class=\"resource-list\"></ul>";
          $("#sub-right").html(html);
          return nums = _.each(num, function(model) {
            return MainView.addOne(model);
          });
        } else {
          html = "You have no POs needing to be confirmed at this time";
          return $("#sub-right").html(html);
        }
      },
      approvedPo: function(id) {
        var po;
        po = new Po({
          id: id
        });
        return po.save({
          approved: interfaith.user_id
        }, {
          success: function(model, resp) {
            var listItem;
            listItem = $('.po' + id);
            if (listItem.length) {
              listItem.fadeOut('500');
            } else {
              this.navigate("po/" + id, true);
            }
            return msg("PO #" + id + " approved");
          },
          error: function(model, resp) {
            console.log("Error approvedPo");
            console.log(model);
            return console.log(resp);
          }
        });
      },
      confirmedPo: function(id) {
        var po;
        po = new Po({
          id: id
        });
        return po.save({
          confirmed: interfaith.user_id
        }, {
          success: function(model, resp) {
            var li;
            li = $('.po' + id);
            if (li.length) {
              li.fadeOut('500');
            } else {
              this.navigate("po/" + id, true);
            }
            return msg("PO #" + id + " confirmed");
          },
          error: function(model, resp) {
            console.log("Error confirmedPo");
            console.log(model);
            return console.log(resp);
          }
        });
      },
      showPo: function(id) {
        var showingPo;
        showingPo = new Po({
          id: id
        });
        return showingPo.fetch({
          success: function(model, resp) {
            var appNum, approve_name, confNum, confirm_name;
            console.log;
            appNum = model.get("approved");
            confNum = model.get("confirmed");
            if (appNum) {
              approve_name = Users.get(appNum).get("email") || null;
            }
            if (confNum) {
              confirm_name = Users.get(confNum).get("email") || null;
            }
            if (approve_name) {
              approve_name = "This PO approved by: " + approve_name;
            } else {
              approve_name = "<div class=\"approved\">Approve</div>";
            }
            if (confirm_name) {
              confirm_name = "This PO confirmed by: " + confirm_name;
            } else {
              confirm_name = "<div class=\"confirmed\">Confirm</div>";
            }
            showingPo.set({
              aname: approve_name,
              cname: confirm_name
            });
            return new SimpleView({
              model: showingPo,
              el: $("#sub-right"),
              template: "viewPo"
            });
          },
          error: function(model, resp) {
            console.log("Error showPo");
            console.log(model);
            return console.log(resp);
          }
        });
      },
      resourceVendor: function() {
        $("#sub-right").html("<div class='header cf'><div class='po-vendor'>Vendor Name</div><div class='po-amount'>Approved</div></div><ul id='resource-list' class='resource-list'></ul>");
        Vendors.template = "vendor";
        return MainView.addAll(Vendors);
      },
      newVendor: function() {
        return new App.View.NewResource({
          model: new Vendor,
          template: "newVendor",
          collection: Vendors
        });
      },
      showVendor: function(id) {
        var vendor;
        vendor = new Vendor({
          id: id
        });
        return vendor.fetch({
          success: function(model, resp) {
            return new SimpleView({
              model: vendor,
              el: $("#sub-right"),
              template: "viewVendor"
            });
          },
          error: function(model, resp) {
            console.log("Error showResource");
            return console.log(model);
          }
        });
      },
      sign_in: function() {
        return MainView.signInForm();
      },
      sign_out: function() {
        return MainView.logout();
      },
      fourohfour: function(path) {
        return alert(path + " 404 baby");
      }
    });
    App.Router = new AppRouter();
    return MainView = new App.View.App();
  });
}).call(this);
