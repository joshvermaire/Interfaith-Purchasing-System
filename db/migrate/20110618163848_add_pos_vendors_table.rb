class AddPosVendorsTable < ActiveRecord::Migration
  def self.up
  	create_table :pos_vendors, :id => false do |t|
  		t.integer :po_id
  		t.integer :vendor_id
  	end
  end

  def self.down
  	drop_table :pos_vendors
  end
end
