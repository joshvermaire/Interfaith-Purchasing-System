class CreatePoLines < ActiveRecord::Migration
  def self.up
    create_table :po_lines do |t|
      t.integer :gl
      t.float :amount
      t.references :po

      t.timestamps
    end
  end

  def self.down
    drop_table :po_lines
  end
end
