class ApplicationController < ActionController::Base
  protect_from_forgery

  rescue_from CanCan::AccessDenied do |exception|
    flash[:error] = exception.message
  end
helper_method :pos
    def pos
      Po.find(:all, :limit => 20)
    end
end
