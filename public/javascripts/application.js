App = {
	View: {},
	init: function() {
		App.Router = new AppRouter();
    	Backbone.history.start();
	}
};