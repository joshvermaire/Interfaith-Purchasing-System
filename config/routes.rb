Interfaith::Application.routes.draw do
  devise_for :users
  resources :users
  resources :vendors
  resources :pos
  root :to => "home#index"
end
