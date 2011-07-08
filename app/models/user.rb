class User < ActiveRecord::Base
	has_and_belongs_to_many :roles
	has_many :pos
  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me, :id

  ROLES = %w["admin"]

  def role?(role)
    	return !!self.roles.find_by_name(role.to_s.camelize)
	end

	def has_role?(role_sym)
  roles.any? { |r| r.name.underscore.to_sym == role_sym }
	end

	def is?(role)
  		roles.include?(role.to_s)
	end

end
