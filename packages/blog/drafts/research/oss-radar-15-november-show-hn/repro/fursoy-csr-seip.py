"""Directed RTL control plus one explicitly mutated write operand. Logs stay outside Git."""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

checkout, output = (Path(p).resolve() for p in sys.argv[1:])
output.mkdir()
fixture = Path(__file__).with_suffix('.cpp')
original = (checkout / 'rtl/core/fursoy_s1_csr.sv').read_text()
assert hashlib.sha256(original.encode()).hexdigest() == '9b19600eaa35c2b632dc40b339cff168f8326c6d16aa5a8c1a84636ead3d5699'
assert hashlib.sha256((checkout / 'rtl/core/fursoy_s1_pkg.sv').read_bytes()).hexdigest() == 'c2c1bfc386cb7bcbebc7baee7f3b51eeb3b3feafbfcc9402bcf1ebd835cabc0b'
old = """    wire [63:0] rmw_csr_val = (p0_sys_csr_addr_i == 12'h344)
                            ? {mip_val[63:10], mip_q[9], mip_val[8:0]}
                            : old_csr_val;"""
assert original.count(old) == 1
assert "SYS_CSRRC     = 8'd98" in (checkout / 'rtl/core/fursoy_s1_pkg.sv').read_text()
results = []
for name, source, expected in [
    ('original', original, 0),
    ('combined-read-value-mutation', original.replace(old, '    wire [63:0] rmw_csr_val = old_csr_val;'), 1),
]:
    root = output / name
    root.mkdir()
    (root / 'fursoy_s1_csr.sv').write_text(source)
    shutil.copyfile(checkout / 'rtl/core/fursoy_s1_pkg.sv', root / 'fursoy_s1_pkg.sv')
    build = root / 'build'
    command = ['verilator', '--cc', '--exe', '--build', '--assert', '-Wno-fatal',
               '--top-module', 'fursoy_s1_csr', '-I' + str(root), '--Mdir', str(build),
               str(root / 'fursoy_s1_csr.sv'), str(fixture), '-o', 'csr-seip']
    with (root / 'build.log').open('w') as log:
        subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True)
    run = subprocess.run([str(build / 'csr-seip')], text=True, capture_output=True)
    (root / 'run.log').write_text(run.stdout + run.stderr)
    run.check_returncode()
    actual = json.loads(run.stdout)
    assert actual == {'external_high_during_csrrc_then_low': expected, 'no_external_pin': 0,
                      'software_seip_preserved': 1, 'pin_pulse_without_csr': 0}, (name, actual)
    results.append({'condition': name, 'csrSourceSha256': hashlib.sha256(source.encode()).hexdigest(),
                    'pendingSeipAfterPinClears': actual})
result = {
    'sourceCommit': '377ae9563ab1b88ee0a037f2223ab49822968396',
    'verilator': subprocess.check_output(['verilator', '--version'], text=True).strip(),
    'results': results,
    'scope': 'One actual CSR module, CSRRC issue/retire handshake and three controls; mutation matches the reported old operand, not a checked historical checkout. No Linux boot, timing or hardware result.',
}
(output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
