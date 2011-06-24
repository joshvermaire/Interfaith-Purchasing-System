class Vendor < ActiveRecord::Base
	attr_accessible :name
	has_many :pos

	#accepts_nested_attributes_for :pos



end
