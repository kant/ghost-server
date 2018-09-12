local assign = require("./assign")
local Object = require("./classic")
local Storage = require("./Storage")
local ThinClient = require("./ThinClient")

local PRODUCTION_API_URL = "https://ghost-server.app.render.com/api"

local GhostClient = ThinClient:extend()

function GhostClient:new(url, context, opts)
  url = url or PRODUCTION_API_URL
  GhostClient.super.new(self, url, context, opts)
  self._storage = self._opts.storage or Storage()
  self:_setContext()
end

function GhostClient:_setContext()
  local sessionSecret = self._storage:get("sessionSecret")
  self._context = self._context or {}
  assign(self._context, {sessionSecret = sessionSecret})
end

function GhostClient:clientSimpleMethods()
  return {"add", "profile"}
end

function GhostClient:clientDidReceiveCommands(commands)
end

function GhostClient:clientDidReceiveData(data)
end

function GhostClient:login(username, password)
  local result = self:call("login", {username, password})
  if result and result.sessionSecret then
    self._storage:set("sessionSecret", result.sessionSecret)
    self:_setContext()
  else
    error {
      type = "SERVER_ERROR",
      code = "LOGIN_PROBLEM",
      message = "There was a problem logging in"
    }
  end
end

function GhostClient:logout(sessionSecret)
  sessionSecret = sessionSecret or self._storage:get("sessionSecret")
  local result = self:call("logout", sessionSecret)
  self._storage:delete("sessionSecret")
  self:_setContext()
  return result
end

return GhostClient
