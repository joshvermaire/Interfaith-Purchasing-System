class CreatePos < ActiveRecord::Migration
  def self.up
    create_table :pos do |t|
      t.date :needed
      t.integer :vendor_id
      t.integer :user_id
      t.integer :approved
      t.integer :confirmed
      t.float :amount
      t.date :paid

      t.timestamps
    end
  end

  def self.down
    drop_table :pos
  end
end
