local assign = require("./assign")
local Object = require("./classic")

local InMemoryStorage = Object:extend()

function InMemoryStorage:new(opts)
  self._opts = assign({}, opts)
  self._store = {}
end

function InMemoryStorage:set(key, value)
  self._store[key] = value
end

function InMemoryStorage:get(key)
  return self._store[key]
end

function InMemoryStorage:delete(key)
  self._store[key] = nil
end

return InMemoryStorage