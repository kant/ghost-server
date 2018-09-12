local __VERSION__ = "0.0.0"

-- local http = require("socket.http")
local cjson = require("cjson")
local ltn12 = require("ltn12")

local assign = require("./assign")
local inspect = require("./inspect")
local Object = require("./classic")

local ThinClient = Object:extend()

function ThinClient:clientSimpleMethods()
  return {}
end

function ThinClient:clientAgentString()
  return "ThinClient;ThinClient-lua/" .. __VERSION__
end

function ThinClient:new(url, context, opts)
  self._url = url or "http://localhost:8080"
  self._context = context or {agent = self:clientAgentString()}
  self._opts = assign({}, opts)

  -- Install simple methods
  -- TODO later
end

function ThinClient:clientDidReceiveData(data)
end

function ThinClient:clientDidReceiveCommands(commands)
end

function ThinClient:call(method, ...)
  args = {...}

  local body =
    cjson.encode(
    {
      context = self._context,
      method = method,
      args = args
    }
  )

  local headers = {
    ["Content-Type"] = "application/json",
    ["content-length"] = #body
  }

  local responseBody = {}
  local source = ltn12.source.string(body)
  local sink = ltn12.sink.table(responseBody)

  local result, responseCode, responseHeaders, responseStatus =
    network.request {
    url = self._url,
    method = "POST",
    headers = headers,
    source = source,
    sink = sink
  }

  -- TODO: Check error codes, etc.

  local responseText = table.concat(responseBody)

  local ok, response =
    pcall(
    function()
      return cjson.decode(responseText)
    end
  )
  if ok then
    if response.error then
      if self._opts.logErrors then
        print("API Server Error: " .. response.error.code .. " / " .. response.error.message)
      end
      if self._opts.errorOnServerError then
        error {
          isError = true,
          error = response.error,
          type = "SERVER_ERROR",
          code = "API_SERVER_ERROR",
          response = response,
          message = response.error.message
        }
      end
    end
    if response.clientError then
      if self._opts.errorOnClientError then
        error {
          isError = true,
          type = "CLIENT_ERROR",
          code = response.clientError.code,
          response = response,
          message = response.clientError.message
        }
      end
    end
    return response
  else
    error {
      isError = true,
      type = "SERVER_ERROR",
      code = "JSON_PARSE_ERROR",
      responseText = responseText,
      message = "JSON parse error"
    }
    error(err)
  end
end

return ThinClient
