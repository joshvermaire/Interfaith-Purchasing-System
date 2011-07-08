class PosController < ApplicationController
  #before_filter :authenticate_user!, :except => [:show, :index, :create, :destroy, :update]
  #load_and_authorize_resource
  respond_to :json
  # GET /pos
  # GET /pos.xml
  def index

    #respond_with current_user.id
    #if current_user.role? :admin
      @pos = Po.find(:all, :limit => 10, :select => "confirmed, paid, needed, amount, id, approved, vendor_id, user_id", :include => [:user, :vendor])
      respond_with @pos.to_json(:include => [:user, :vendor])
    #end
  end

  # GET /pos/1
  # GET /pos/1.xml
  def show
    @po = Po.find(params[:id])

    respond_with @po.to_json(:include => [:user, :vendor])
  end

  # GET /pos/new
  # GET /pos/new.xml
  def new
    @po = Po.new

    respond_with @po
  end

  # GET /pos/1/edit
  def edit
    @po = Po.find(params[:id])
    @po.update_attributes pick(params, :approved)
    respond_with @po
  end

  # POST /pos
  # POST /pos.xml
  def create
    @po = Po.create! params
    respond_with @po
  end

  # PUT /pos/1
  # PUT /pos/1.xml
  def update
    @po = Po.find(params[:id])

    @po.update_attributes pick(params, :approved)
    respond_with @po
  end

  # DELETE /pos/1
  # DELETE /pos/1.xml
  def destroy
    @po = Po.find(params[:id])
    @po.destroy
    respond_with @po
  end

  def pick(hash, *keys)
    filtered = {}
    hash.each do |key, value| 
      filtered[key.to_sym] = value if keys.include?(key.to_sym) 
    end
    filtered
  end

end
