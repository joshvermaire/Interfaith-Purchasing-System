class ChangeVendorIdToVendor < ActiveRecord::Migration
  def self.up
  	change_table(:pos) do |t|
	  	t.remove :vendor_id
	  	t.remove :user_id
	  	t.references :vendor
	  	t.references :user
  	end
  end

  def self.down
  	change_table(:pos) do |t|
  		t.add :vendor_id
	  	t.add :user_id
	  	t.remove :vendor
	  	t.remove :user
  	end
  end
end
