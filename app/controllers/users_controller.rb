class UsersController < ApplicationController
	respond_to :json
  # GET /pos
  # GET /pos.xml
  def index
    @users = User.all
    #respond_with current_user.id
    respond_with @users
  end

end
