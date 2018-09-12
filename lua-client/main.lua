local GhostClient = require("./GhostClient")
local inspect = require("./inspect")

local ghostClient = GhostClient("http://localhost:1380/api")

local text = "Hello from ThinClient example"

function love:draw()
  love.graphics.print(inspect(text), 400, 300)
end

network.async(
  function()
    local suc, err =
      pcall(
      function()
        text = ghostClient:login("ccheever", "abcdefg")
        text = ghostClient:call("profile", 0)
      end
    )
    if not suc then
      text = "Error: " + err.message
    end
  end
)
