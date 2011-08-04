$ ->
	server = "http://localhost:3000/"
	
	isLoggedIn = ->
		if typeof (window.interfaith) == "undefined"
			false
		else
			true

	interfaith = window.interfaith or {
		user_id: 1
	}
	
	msg = (msg) ->
		bubble = $("#app .msg").html(msg)
		bubble.fadeIn("slow").delay(2000).fadeOut "fast"
	
	Po = Backbone.Model.extend
		urlRoot: "/pos"
		template: "po"
	
	User = Backbone.Model.extend()
	
	Vendor = Backbone.Model.extend
		urlRoot: "/vendors"
		template: "vendor"
	
	PoList = Backbone.Collection.extend
		url: "/pos"
		model: Po
		initialize: ->
			_.bindAll @, "approval"
			@bind('reset', _.compose(@approval,@confirm))
		
		approval: ->
			num = @filter((model) ->
				model.get("approved") == null and model.get("confirmed") isnt interfaith.user_id and model.get("user_id") isnt interfaith.user_id
			)
			$('.po-approve-num').text(num.length)
			if num.length == 0
				$('.po-approve-num').css('display', 'none')
			num

		confirm: ->
			num = @filter((model) ->
				model.get("confirmed") == null and model.get("approved") isnt interfaith.user_id and model.get("user_id") isnt interfaith.user_id
			)
			$('.po-confirm-num').text(num.length)
			if num.length == 0
				$('.po-confirm-num').css('display', 'none')
			num
	
	UserList = Backbone.Collection.extend
		url: "/users"
		model: User
	
	VendorList = Backbone.Collection.extend
		url: "/vendors"
		model: Vendor

	window.Pos = new PoList
	window.Users = new UserList
	Users.fetch()
	
	window.Vendors = new VendorList
	Vendors.fetch()
	
	App.View.Resource = Backbone.View.extend
		initialize: ->
			_.bindAll @, "render"
			@JSON = @model.toJSON()
		
		tagName: "li"

		render: ->
			if @model.collection == Pos
				@metadata() if !@JSON.vendor or @JSON.user
				@JSON.approved = @approve()
				@JSON.confirmed = @confirm()
			$(@el).html JST[@options.template](@JSON)
			$(@el).addClass('po'+@JSON.id)
			@

		metadata: ->
			@JSON.vendor = @JSON.vendor or Vendors.get(@JSON.vendor_id).toJSON()
			@JSON.user = @JSON.user or Users.get(@JSON.user_id).toJSON()

		approve: ->
			if not @JSON.approved and interfaith.can_approve == 1 and @JSON.confirmed isnt interfaith.user_id and @JSON.user_id isnt interfaith.user_id
				"<a class=\"approved button\" href=\"/#" + @model.template + "/" + @JSON.id + "/approved\"><span class=\"check icon\"></span>Approve</a>"
			else
				"<a style=\"height:20px;width:81px; display:inline-block; \"></a>"
		
		confirm: ->
			if not @JSON.confirmed and interfaith.can_confirm == 1 and @JSON.approved isnt interfaith.user_id and @JSON.user_id isnt interfaith.user_id
				"<a class=\"confirmed button positive\" href=\"/#" + @model.template + "/" + @JSON.id + "/confirmed\"><span class=\"check icon\"></span>Confirm</a>"
			else
				"<a style=\"height:20px;width:81px; display:inline-block; \"></a>"

	App.View.NewResource = Backbone.View.extend(
		el: $("#middle #sub-right")
		events: 
			"click a#po-submit": "createPo"
			"click a#vendor-submit": "createVendor"
			"keypress input": "check"
		
		initialize: ->
			_.bindAll @, "render", "check"
			@render()
		
		render: ->
			$(@el).html JST[@options.template]
			@
		
		createVendor: ->
			@collection.create 
				name: $(".resource-vendor [name=name]").val(),
				success: (model, response) ->
					$("[name=name").val ""
					location.hash = ""
				error: (model, response) ->
					console.log 'error createVendor'

		createPo: ->
			vendor = Vendors.find((po) ->
				po.get("name") == $(".resource-po [name=name]").val()
			)
			unless vendor == "undefined"
				@collection.create 
					vendor_id: vendor.id
					needed: $(".resource-po [name=date-needed]").val()
					amount: $(".resource-po [name=amount]").val()
					user_id: interfaith.user_id
				, success: (model, response) ->
						msg('PO created')
						console.log(model)
						location.hash = ""
					error: (model, error) ->
						console.log model
						console.log error
		
		check: (event) ->
			$(".resource-results").html('')
			search = $("#search").val()
			search += String.fromCharCode(event.which)
			search = search.toLowerCase()
			return  if search == ""
			self = @
			vendorArray = []
			vendors = Vendors.each (model) ->
				lcname = model.attributes.name
				if lcname
					lcname = lcname.toLowerCase()
					chara = lcname.indexOf(search)
					vendorArray.push(model) if chara >=0
			_(vendorArray).chain()
				.sortBy((model) -> model.attributes.name)
				.each((model) -> self.addResult(model))
		
		addResult: (model) ->
			$(".resource-results").append "<div>" + model.get("name") + "</div>"
	)

	SimpleView = Backbone.View.extend(
		initialize: ->
			_.bindAll @, "render"
			@data = @model?.toJSON() or {}
			@render()
		
		render: ->
			$(@el).html JST[@options.template](@data)
			@
	)

	App.View.App = Backbone.View.extend(
		el: $("#app")
		events: 
			"click li#sign_in": "signInForm"
			"click #signinlogin": "login"
			"click #signout": "logout"
			"click #sign_in_form": "stopPropagation"
			"click #sign_in_over": "signInFormClose"
		
		initialize: ->
			_.bindAll @, "addOne", "addAll"
			bottomView = new SimpleView
				el: $("#bottom")
				template: "footer"
		
		stopPropagation: (event) ->
			event.stopPropagation()
		
		signInForm: ->
			App.Router.navigate "users/sign_in"
			$("#sign_in_over").fadeIn()
		
		signInFormClose: ->
			App.Router.navigate ""
			$("#sign_in_over").fadeOut()
		
		addOne: (resource) ->
			view = new App.View.Resource
				model: resource
				template: resource.template
			$("#resource-list").append view.render().el
		
		addAll: (collection) ->
			collection.each @addOne
		
		login: ->
			login = user: 
				email: $("#signinemail").val()
				password: $("#signinpw").val()
				remember_me: $("#sign_in_form [name=remember_me]").val()
			
			currentUser = new Backbone.Model()
			url = server + "users/sign_in.json"
			currentUser.url = url
			currentUser.save login, 
				success: (model, response) ->
					window.location = server
				
				error: (model, response) ->
					console.log model
					console.log response
		
		logout: ->
			App.Router.navigate "users/sign_out"
			currentUser = new Backbone.Model()
			url = server + "users/sign_out.json"
			currentUser.url = url
			currentUser.fetch success: (model, response) ->
				window.location = server
	)

	AppRouter = Backbone.Router.extend(
		initialize: ->
			@navigate ""
		
		routes: 
			"": "index"
			"po": "resourcePo"
			"po/new": "newPo"
			"po/approve": "approvePo"
			"po/confirm": "confirmPo"
			"po/:id/approved": "approvedPo"
			"po/:id/confirmed": "confirmedPo"
			"po/:id": "showPo"
			"vendor": "resourceVendor"
			"vendor/new": "newVendor"
			"vendor/:id": "showVendor"
			"users/sign_in": "sign_in"
			"users/sign_out": "sign_out"
			"*path": "fourohfour"
		
		index: ->
			if isLoggedIn()
				$("#sub-right").html "<h1>WELCOME, " + window.interfaith.email + "</h1><p>You have <span class='po-approve-num'></span> POs waiting to be approved.</p>"
			else
				$("#sub-right").html "<h1>Log in mothabrotha</h1>"
		
		resourcePo: ->
			$("#sub-right").html "<div class=\"header cf\"><div class=\"po-vendor\">Vendor Name</div><div class=\"po-date\">Date Needed</div><div class=\"po-user\">User Email</div><div class=\"po-amount\">Amount</div></div><ul id=\"resource-list\" class=\"resource-list\"></ul>"
			Pos.template = "po"
			MainView.addAll Pos
		
		newPo: ->
			new App.View.NewResource(
				model: new Po
				template: "newPo"
				collection: Pos
			)
		
		approvePo: ->
			Pos.template = "po"
			num = Pos.approval()
			if num.length
				html =  "<div class=\"header cf\"><div class=\"po-vendor\">Vendor Name</div><div class=\"po-date\">Date Needed</div><div class=\"po-user\">User Email</div><div class=\"po-amount\">Amount</div></div><ul id=\"resource-list\" class=\"resource-list\"></ul>"
				$('#sub-right').html html
				nums = _.each(num, (model) ->
					MainView.addOne model
				)
			else
				html = "You have no POs needing to be approved at this time"
				$("#sub-right").html html
		
		confirmPo: ->
			Pos.template = "po"
			num = Pos.confirm()
			if num.length
				html = "<div class=\"header cf\"><div class=\"po-vendor\">Vendor Name</div><div class=\"po-date\">Date Needed</div><div class=\"po-user\">User Email</div><div class=\"po-amount\">Amount</div></div><ul id=\"resource-list\" class=\"resource-list\"></ul>"
				$("#sub-right").html html
				nums = _.each(num, (model) ->
					MainView.addOne model
				)
			else
				html = "You have no POs needing to be confirmed at this time"
				$("#sub-right").html html
		
		approvedPo: (id) ->
			po = new Po(id: id)
			po.save approved: interfaith.user_id,
				success: (model, resp) ->
					listItem = $('.po'+id)
					if listItem.length
						listItem.fadeOut('500')
					else
						@navigate "po/"+id, true
					msg "PO #"+id+" approved"
				error: (model, resp) ->
					console.log "Error approvedPo"
					console.log model
					console.log resp
		
		confirmedPo: (id) ->
			po = new Po(id: id)
			po.save confirmed: interfaith.user_id,
				success: (model, resp) ->
					li = $('.po'+id)
					if li.length
						li.fadeOut('500')
					else
						@navigate "po/"+id, true
					msg "PO #"+id+" confirmed"
				error: (model, resp) ->
					console.log "Error confirmedPo"
					console.log model
					console.log resp
		
		showPo: (id) ->
			showingPo = new Po(id: id)
			showingPo.fetch
				success: (model, resp) ->
					console.log
					appNum = model.get("approved")
					confNum = model.get("confirmed")
					approve_name = Users.get(appNum).get("email") or null  if appNum
					confirm_name = Users.get(confNum).get("email") or null  if confNum
					if approve_name
						approve_name = "This PO approved by: " + approve_name
					else
						approve_name = "<div class=\"approved\">Approve</div>"
					if confirm_name
						confirm_name = "This PO confirmed by: " + confirm_name
					else
						confirm_name = "<div class=\"confirmed\">Confirm</div>"
					showingPo.set 
						aname: approve_name
						cname: confirm_name
					new SimpleView
						model: showingPo
						el: $("#sub-right")
						template: "viewPo"
				error: (model, resp) ->
					console.log "Error showPo"
					console.log model
					console.log resp	

		resourceVendor: ->
			$("#sub-right").html "<div class='header cf'><div class='po-vendor'>Vendor Name</div><div class='po-amount'>Approved</div></div><ul id='resource-list' class='resource-list'></ul>"
			Vendors.template = "vendor"
			MainView.addAll Vendors
		
		newVendor: ->
			new App.View.NewResource
				model: new Vendor
				template: "newVendor"
				collection: Vendors
		
		showVendor: (id) ->
			vendor = new Vendor(id: id)
			vendor.fetch 
				success: (model, resp) ->
					new SimpleView
						model: vendor
						el: $("#sub-right")
						template: "viewVendor"
				error: (model, resp) ->
					console.log "Error showResource"
					console.log model
		
		sign_in: ->
			MainView.signInForm()
		
		sign_out: ->
			MainView.logout()
		
		fourohfour: (path) ->
			alert path + " 404 baby"
	)
	#Users.fetch()
	#Vendors.fetch()
	#Pos.fetch()
	App.Router = new AppRouter()
	MainView = new App.View.App()