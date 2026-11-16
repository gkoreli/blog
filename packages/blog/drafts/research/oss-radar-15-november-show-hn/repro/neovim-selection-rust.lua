local plugin, root, receipt = arg[1], arg[2], arg[3]
assert(plugin and root and receipt)
assert(vim.fn.isdirectory(root) == 0 and vim.fn.filereadable(receipt) == 0)
vim.fn.mkdir(root, 'p')
vim.opt.runtimepath:append(plugin)
local asm = require('asm')
asm.setup()
local notices, commands, results = {}, {}, {}
vim.notify = function(s) notices[#notices + 1] = s end
local system = vim.system
vim.system = function(argv, options, callback)
  commands[#commands + 1] = { argv = vim.deepcopy(argv), cwd = options and options.cwd }
  return system(argv, options, callback)
end
local function clean(s) return s:gsub(vim.pesc(root), '<fixture>') end
local shortcut
for _, map in ipairs(vim.api.nvim_get_keymap('n')) do
  if map.desc == '[A]ssembly for the function under the cursor' then shortcut = map.callback end
end
assert(type(shortcut) == 'function')
local c = { '#include <stdint.h>', '', 'int answer(int x) {', '  int doubled = x * 2;', '  int plus = doubled + 7;', '  return plus;', '}' }
local rust = { '#[unsafe(no_mangle)]', 'pub extern "C" fn answer(x: i32) -> i32 {', '  #[cfg(feature = "fast")] { return x + 99; }', '  #[cfg(not(feature = "fast"))] { x + 7 }', '}' }
for _, case in ipairs({ 'c-unparsed', 'c-parsed', 'rust-standalone', 'cargo-library', 'cargo-multiple-targets' }) do
  local dir = root .. '/' .. case
  vim.fn.mkdir(dir .. '/src', 'p')
  local is_c = case:sub(1, 2) == 'c-'
  local lines = is_c and c or rust
  local path = dir .. (is_c and '/sample.c' or '/src/lib.rs')
  vim.fn.writefile(lines, path)
  if case:find('cargo', 1, true) then
    vim.fn.writefile({ '[package]', 'name="radar_fixture"', 'version="0.1.0"', 'edition="2024"', '[features]', 'fast=[]' }, dir .. '/Cargo.toml')
    if case == 'cargo-multiple-targets' then vim.fn.writefile({ 'fn main() { println!("fixture"); }' }, dir .. '/src/main.rs') end
  end
  vim.cmd.edit(vim.fn.fnameescape(path))
  vim.bo.filetype = is_c and 'c' or 'rust'
  if is_c then vim.api.nvim_win_set_cursor(0, { 5, 2 }) end
  notices, commands = {}, {}
  if case == 'c-parsed' then vim.treesitter.get_parser(0, 'c'):parse() end
  if is_c then shortcut() else asm.show(1, #lines) end
  local buf, win = vim.api.nvim_get_current_buf(), vim.api.nvim_get_current_win()
  assert(vim.wait(30000, function()
    local title = vim.inspect(vim.api.nvim_win_get_config(win).title)
    return title:find('failed', 1, true) or title:find('rerun', 1, true)
  end, 10), 'compilation timeout')
  local text = table.concat(vim.api.nvim_buf_get_lines(buf, 0, -1, false), '\n')
  local title = vim.inspect(vim.api.nvim_win_get_config(win).title)
  local cmds = {}
  for _, cmd in ipairs(commands) do cmds[#cmds + 1] = { argv = vim.tbl_map(clean, cmd.argv), cwd = cmd.cwd and clean(cmd.cwd) } end
  results[#results + 1] = { case = case, title = title, output = clean(text), commands = cmds, notices = vim.deepcopy(notices), assemblyRendered = vim.bo[buf].filetype == 'asm' }
  vim.api.nvim_win_close(win, true)
end
local dir = root .. '/cargo-library'
local out = dir .. '/explicit-fast.s'
local reference = system({ 'cargo', 'rustc', '--quiet', '--offline', '--features', 'fast', '--', '--emit', 'asm=' .. out, '-Copt-level=2' }, { cwd = dir, text = true }):wait()
assert(reference.code == 0, reference.stderr)
local ref = table.concat(vim.fn.readfile(out), '\n')
local multi_dir = root .. '/cargo-multiple-targets'
local multi_out = multi_dir .. '/explicit-lib.s'
local multi = system({ 'cargo', 'rustc', '--quiet', '--offline', '--lib', '--', '--emit', 'asm=' .. multi_out, '-Cdebuginfo=2', '-Ccodegen-units=1', '-Copt-level=2' }, { cwd = multi_dir, text = true }):wait()
assert(multi.code == 0, multi.stderr)
assert(table.concat(vim.fn.readfile(multi_out), '\n'):find('#7', 1, true))
assert(results[1].title:find('5%-5') and results[2].title:find('3%-7'))
assert(results[3].assemblyRendered and results[4].assemblyRendered)
assert(results[4].output:find('#7', 1, true) and ref:find('#99', 1, true))
vim.fn.writefile({ vim.json.encode({ pluginCommit = '58a471ec97fb5987eca2b955fd2cba8693a414f6', neovim = vim.version(), cases = results, explicitFeatureReference = { command = 'cargo rustc --offline --features fast -- --emit asm -Copt-level=2', containsAdd99 = ref:find('#99', 1, true) ~= nil }, explicitMultipleTargetControl = { command = 'cargo rustc --offline --lib -- --emit asm -Cdebuginfo=2 -Ccodegen-units=1 -Copt-level=2', exitCode = 0, containsAdd7 = true }, fixtureExecutableRun = false }) }, receipt)
print('Recorded normal-mode selection and actual Rust/Cargo assembly controls')
vim.cmd('qa!')
