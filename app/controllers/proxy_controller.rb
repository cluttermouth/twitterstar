require 'net/http'

class ProxyController < ActionController::Base
  skip_before_filter :verify_authenticity_token

  def index
    @username = params[:username]
    @password = params[:password]
    @command = params[:command]

    params.delete(:username)
    params.delete(:password)
    params.delete(:command)

    Net::HTTP.start('api.twitter.com') {|http|
      req = request.get? ? Net::HTTP::Get.new(@command) : Net::HTTP::Post.new(@command)
      req.basic_auth(@username, @password)
      if request.get?
        req.set_form_data(params)
      end
      response = http.request(req)
      @response_code =  response.code
      render :text => response.body , :status=> @response_code
    }
  end

end
