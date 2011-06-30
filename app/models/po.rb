class Po < ActiveRecord::Base
#has_many :po_lines
	belongs_to :vendor
attr_accessible :amount, :approved, :confirmed, :needed, :paid, :user_id, :vendor_id 
end
