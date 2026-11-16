#include "runtime/gfx/dxbc_to_msl.cpp"
#include "tokens.h"
#include <cassert>
#include <iostream>

static uint32_t tag(const char* s) {
    return uint32_t(s[0]) | uint32_t(s[1]) << 8 | uint32_t(s[2]) << 16 | uint32_t(s[3]) << 24;
}
static void text_words(std::vector<uint32_t>& out, const char* text) {
    const size_t bytes = strlen(text) + 1;
    const size_t start = out.size();
    out.resize(start + (bytes + 3) / 4, 0);
    memcpy(out.data() + start, text, bytes);
}
static std::vector<uint32_t> vertex_shader() {
    // SM4: declare SV_Position, move authored (0,0,0,1) to it, return.
    const uint32_t output = 2 | (15 << 4) | (OPERAND_TYPE_OUTPUT << 12) | (1 << 20);
    const uint32_t imm4 = 2 | (OPERAND_TYPE_IMMEDIATE32 << 12);
    std::vector<uint32_t> code = { 0x00010040, 15,
        (4 << 24) | OPCODE_DCL_OUTPUT_SIV, output, 0, 1,
        (8 << 24) | OPCODE_MOV, output, 0, imm4, 0, 0, 0, 0x3f800000,
        (1 << 24) | OPCODE_RET };
    std::vector<uint32_t> sig = { 1, 8, 32, 0, 1, 3, 0, 15 };
    text_words(sig, "SV_Position");
    std::vector<uint32_t> out = { tag("DXBC"), 0, 0, 0, 0, 1, 0, 2, 40, 0 };
    out.push_back(tag("OSGN")); out.push_back(uint32_t(sig.size() * 4));
    out.insert(out.end(), sig.begin(), sig.end());
    out[9] = uint32_t(out.size() * 4);
    out.push_back(tag("SHDR")); out.push_back(uint32_t(code.size() * 4));
    out.insert(out.end(), code.begin(), code.end());
    out[6] = uint32_t(out.size() * 4);
    return out;
}
static ShaderInfo layout(uint32_t pair_offset) {
    ShaderInfo info;
    ConstantBuffer cb{}; cb.name = "$Globals"; cb.ui32TotalSizeInBytes = 32;
    ShaderVar a{}; a.name = "Scalar"; a.ui32StartOffset = 0; a.ui32Size = 4;
    ShaderVar b{}; b.name = "Pair"; b.ui32StartOffset = pair_offset; b.ui32Size = 8;
    cb.asVars = {a, b}; info.psConstantBuffers.push_back(cb);
    return info;
}
int main() {
    auto dxbc = vertex_shader();
    char *msl = nullptr, *textures = nullptr, *buffers = nullptr, *dimensions = nullptr, *samplers = nullptr;
    const int translated = bo2_dxbc_translate2(dxbc.data(), uint32_t(dxbc.size() * 4), &msl, &textures, &buffers, &dimensions, &samplers);
    assert(translated == 1 && msl);
    const std::string shader(msl);
    assert(shader.find("position, invariant") != std::string::npos);
    std::cout << "--- authored shader MSL ---\n" << shader << "\n";
    for (char* p : {msl, textures, buffers, dimensions, samplers}) bo2_msl_free(p);
    const std::string initial = "struct VGlobals_Type\n{\n    float Scalar;\n    float2 Pair;\n};\n";
    auto packed = initial; match_d3d_offsets(packed, layout(4));
    assert(packed.find("packed_float2 Pair") != std::string::npos);
    auto aligned = initial; match_d3d_offsets(aligned, layout(8));
    assert(aligned == initial);
    auto padding = initial; match_d3d_offsets(padding, layout(16));
    assert(padding.find("_d3d_pad4[3]") != std::string::npos);
    ShaderInfo array_info;
    ConstantBuffer array_cb{}; array_cb.name = "$Globals"; array_cb.ui32TotalSizeInBytes = 48;
    ShaderVar v{}; v.name = "Values"; v.ui32StartOffset = 0; v.ui32Size = 48;
    array_cb.asVars.push_back(v); array_info.psConstantBuffers.push_back(array_cb);
    const std::string array_initial = "struct VGlobals_Type\n{\n    float Values[3];\n};\n";
    auto array = array_initial; match_d3d_offsets(array, array_info);
    assert(array == array_initial);
    ShaderInfo bindings;
    ResourceBinding b0{}; b0.name = "$Globals"; b0.eType = RTYPE_CBUFFER; b0.ui32BindPoint = 0;
    ResourceBinding b2{}; b2.name = "World"; b2.eType = RTYPE_CBUFFER; b2.ui32BindPoint = 2;
    bindings.psResourceBindings = {b0, b2};
    char* map = nullptr;
    assert(emit_slot_map({{"VGlobals", 0}, {"World", 1}}, bindings, RTYPE_CBUFFER, &map) == 1);
    assert(std::string(map) == "0=0,1=2");
    bo2_msl_free(map);
    std::cout << "RADAR_RESULT {\"minimalVertexTranslated\":true,\"invariantPosition\":true,\"misalignedFloat2Packed\":true,\"alignedUnchanged\":true,\"paddingGapInserted\":true,\"unsupportedScalarArrayUnchanged\":true,\"bindingMap\":\"0=0,1=2\"}\n";
}
