class VendorsController < ApplicationController
	respond_to :json
	def index
	    @vendors = Vendor.all
	    #respond_with current_user.id
	    respond_with @vendors
	 end

	 def show
		@vendor = Vendor.find(params[:id])
		respond_with @vendor
	end

	 def create
		@vendor = Vendor.create! params
		respond_with @vendor
	end
end
