# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_twitterstar_session',
  :secret      => '57d7f5452b12c4ed11554e9f2c663ded8f5d2cb98215e4556cb8c9c8a60a3781e77dd3a99601950f7bd308cb497d4e769f2342295a05265676146df356f7a41c'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
