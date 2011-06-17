$(function() {


    Po = Backbone.Model.extend();



    PoList = Backbone.Collection.extend({

        model: Po,
        url: '/pos'

    });

    Pos = new PoList;


    PoView = Backbone.View.extend({

        tagName: "li",

        template: "po",

        render: function() {
            console.log(this.model);
            //$(this.el).html(JST[this.template](this.model.toJSON()));
            return this;

        },

    });


    AppView = Backbone.View.extend({

        el: $(".content"),

        initialize: function() {
            _.bindAll(this, 'addOne', 'addAll');

            Pos.bind('add', this.addOne);
            Pos.bind('refresh', this.addAll);

            Pos.fetch();
        },

        addOne: function(po) {
            var view = new PoView({model: po});
            this.$("#po-list").append(view.render().el);
        },

        addAll: function() {
            Pos.each(this.addOne);

        }


    });


    window.App = new AppView();

});