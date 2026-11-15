// Directed check of Fursoy's actual CSR module at the pinned source.
// Build with Verilator --cc --exe --build --top-module fursoy_s1_csr.
#include "Vfursoy_s1_csr.h"
#include "verilated.h"
#include <cassert>
#include <cstdint>
#include <iostream>

static void tick(Vfursoy_s1_csr& dut) {
  dut.clk_i = 0; dut.eval();
  dut.clk_i = 1; dut.eval();
  dut.clk_i = 0; dut.eval();
}

static uint64_t condition(bool pin, bool software_seip, bool csr_operation) {
  // Deterministic two-state initialization; unrelated inputs stay zero.
  Vfursoy_s1_csr dut;
  dut.priv_mode_i = 3; // M-mode; reset samples this input.
  dut.rst_i = 1; tick(dut); dut.rst_i = 0; tick(dut);
  // Seed mip through the architectural instruction path. The test injection
  // switch deliberately has no 0x344 case.
  const uint64_t initial = (1ULL << 5) | (software_seip ? 1ULL << 9 : 0);
  dut.p0_sys_csr_addr_i = 0x344;
  dut.p0_sys_subop_i = 96; // SYS_CSRRW in the pinned package.
  dut.p0_sys_rs1_field_i = 1;
  dut.p0_sys_rs1_val_i = initial;
  dut.p0_sys_rob_idx_i = 0;
  dut.p0_sys_valid_i = 1; tick(dut);
  dut.p0_sys_valid_i = 0;
  dut.retire_valid_i = 1; dut.retire_rob_idx_i[0] = 0; tick(dut);
  dut.retire_valid_i = 0; dut.eval();
  assert(dut.csr_mip_o == initial);
  dut.irq_seip_i = pin; dut.eval();
  if (csr_operation) {
    dut.p0_sys_csr_addr_i = 0x344;
    dut.p0_sys_subop_i = 98; // SYS_CSRRC = 8'd98 in the pinned package.
    dut.p0_sys_rs1_field_i = 1;
    dut.p0_sys_rs1_val_i = 1ULL << 5; // Clear only software STIP.
    dut.p0_sys_rob_idx_i = 0;
    dut.p0_sys_valid_i = 1; dut.eval();
    assert(!dut.p0_sys_illegal_o);
    assert((dut.p0_sys_rdata_o & (1ULL << 9)) == ((pin || software_seip) ? 1ULL << 9 : 0));
    tick(dut);
    dut.p0_sys_valid_i = 0;
    assert(dut.sys_pending_valid_o);
    dut.retire_valid_i = 1; dut.retire_rob_idx_i[0] = 0;
    tick(dut); dut.retire_valid_i = 0;
    assert(!dut.sys_pending_valid_o);
    assert(!(dut.csr_mip_o & (1ULL << 5)));
  }
  dut.irq_seip_i = 0; tick(dut);
  return (dut.csr_mip_o >> 9) & 1;
}

int main(int argc, char** argv) {
  Verilated::commandArgs(argc, argv);
  Verilated::randReset(0);
  const auto asserted = condition(true, false, true);
  const auto no_pin = condition(false, false, true);
  const auto software = condition(true, true, true);
  const auto pulse = condition(true, false, false);
  assert(no_pin == 0 && software == 1 && pulse == 0);
  std::cout << "{\"external_high_during_csrrc_then_low\":" << asserted
    << ",\"no_external_pin\":" << no_pin
    << ",\"software_seip_preserved\":" << software
    << ",\"pin_pulse_without_csr\":" << pulse << "}\n";
}
