class PosController < ApplicationController
  before_filter :authenticate_user!, :except => [:show, :index, :create, :destroy]
  load_and_authorize_resource
  respond_to :json
  # GET /pos
  # GET /pos.xml
  def index

    #respond_with current_user.id
    if current_user.role? :admin
      @pos = Po.find(:all, :limit => 1, :select => "confirmed, paid, needed, amount, id, approved, vendor_id, user_id", :include => [:user, :vendor])
      respond_with @pos.to_json(:include => [:user, :vendor])
    else
      @pos = :error
      respond_with @pos
    end
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

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @po }
    end
  end

  # GET /pos/1/edit
  def edit
    @po = Po.find(params[:id])
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

    respond_to do |format|
      if @po.update_attributes(params[:po])
        format.html { redirect_to(@po, :notice => 'Po was successfully updated.') }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @po.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /pos/1
  # DELETE /pos/1.xml
  def destroy
    @po = Po.find(params[:id])
    @po.destroy
    respond_with @po
  end
end
