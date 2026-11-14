-- Actual plugin calls in a clean headless editor; compile fixtures only to assembly.
local plugin, root, receipt = arg[1], arg[2], arg[3]
assert(plugin and root and receipt, "Usage: nvim --headless --clean -u NONE -i NONE -l this.lua /plugin /fresh-fixtures /fresh-receipt")
assert(vim.fn.isdirectory(root) == 0 and vim.fn.filereadable(receipt) == 0)
vim.fn.mkdir(root .. "/include dir", "p")
vim.fn.writefile({ "#define BONUS 7" }, root .. "/include dir/bonus.h")
vim.opt.runtimepath:append(plugin)
local assembly = require("asm")
local notices, commands, results = {}, {}, {}
vim.notify = function(message) notices[#notices + 1] = message end
local system = vim.system
vim.system = function(argv, options, callback)
  commands[#commands + 1] = { argv = vim.deepcopy(argv), cwd = options and options.cwd }
  return system(argv, options, callback)
end
local function clean(value)
  return value:gsub(vim.pesc(root), "<fixture>")
end
for _, case in ipairs({ "arguments", "quoted-command", "unsaved-buffer" }) do
  local directory = root .. "/" .. case
  vim.fn.mkdir(directory, "p")
  local source = directory .. "/sample.c"
  local lines = { '#include "bonus.h"', 'int answer(int x) {', '  return x + BONUS;', '}' }
  vim.fn.writefile(lines, source)
  local entry = { directory = directory, file = source }
  if case == "quoted-command" then
    entry.command = 'cc -I"' .. root .. '/include dir" -c ' .. source .. ' -o sample.o'
  else
    entry.arguments = { "cc", "-I" .. root .. "/include dir", "-c", source, "-o", "sample.o" }
  end
  vim.fn.writefile({ vim.json.encode({ entry }) }, directory .. "/compile_commands.json")
  vim.cmd.edit(vim.fn.fnameescape(source))
  vim.bo.filetype = "c"
  if case == "unsaved-buffer" then
    vim.api.nvim_buf_set_lines(0, 2, 3, false, { '  return x + 99;' })
  end
  notices, commands = {}, {}
  assembly.show(2, 4)
  local buffer, window = vim.api.nvim_get_current_buf(), vim.api.nvim_get_current_win()
  local completed = vim.wait(10000, function()
    local title = vim.inspect(vim.api.nvim_win_get_config(window).title)
    return title:find("failed", 1, true) ~= nil or title:find("rerun", 1, true) ~= nil
  end, 10)
  local text = table.concat(vim.api.nvim_buf_get_lines(buffer, 0, -1, false), "\n")
  local normalized = {}
  for _, command in ipairs(commands) do
    normalized[#normalized + 1] = {
      argv = vim.tbl_map(clean, command.argv), cwd = command.cwd and clean(command.cwd),
    }
  end
  results[#results + 1] = { case = case, completed = completed,
    assemblyRendered = vim.bo[buffer].filetype == "asm", output = clean(text),
    notices = vim.deepcopy(notices), commands = normalized }
  vim.api.nvim_win_close(window, true)
  vim.bo.modified = false
end
local value = { pluginCommit = "58a471ec97fb5987eca2b955fd2cba8693a414f6",
  neovim = vim.version(), cases = results, fixtureExecutableRun = false,
  userEditorConfigurationChanged = false, scope = "Three authored compiler-context controls, not full editor usability or compiler performance." }
vim.fn.writefile({ vim.json.encode(value) }, receipt)
print(vim.json.encode({ cases = #results, completed = true }))
vim.cmd("qa!")
