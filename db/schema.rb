# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20110706015353) do

  create_table "po_lines", :force => true do |t|
    t.integer  "gl"
    t.float    "amount"
    t.integer  "po_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "pos", :force => true do |t|
    t.date     "needed"
    t.integer  "approved"
    t.integer  "confirmed"
    t.float    "amount"
    t.date     "paid"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "vendor_id"
    t.integer  "user_id"
  end

  create_table "pos_vendors", :id => false, :force => true do |t|
    t.integer "po_id"
    t.integer "vendor_id"
  end

  create_table "roles", :force => true do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "roles_users", :id => false, :force => true do |t|
    t.integer "role_id"
    t.integer "user_id"
  end

  create_table "users", :force => true do |t|
    t.string   "email",                                 :default => "", :null => false
    t.string   "encrypted_password",     :limit => 128, :default => "", :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",                         :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

  create_table "vendors", :force => true do |t|
    t.string   "name"
    t.integer  "approved"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
