	.build_version macos, 27, 0	sdk_version 27, 0
	.section	__TEXT,__text,regular,pure_instructions
	.globl	_native16                       ; -- Begin function native16
	.p2align	2
_native16:                              ; @native16
	.cfi_startproc
; %bb.0:
	ldur	x8, [x0, #-1]
	ldp	x9, x11, [x0]
	ldur	x10, [x0, #7]
	ldrb	w12, [x0, #15]
	ldrb	w13, [x0, #16]
	cmp	x8, x9
	ccmp	x10, x11, #0, eq
	ccmp	x12, x13, #0, eq
	b.eq	LBB0_2
; %bb.1:
	mov	w0, #0                          ; =0x0
	ret
LBB0_2:
	sub	x8, x0, x1
	ldp	x9, x10, [x0]
	ldp	x11, x8, [x8]
	cmp	x9, x11
	ccmp	x10, x8, #0, eq
	b.eq	LBB0_4
; %bb.3:
	mov	w0, #0                          ; =0x0
	ret
LBB0_4:
	add	x8, x0, x1
	ldp	x9, x10, [x0]
	ldp	x11, x8, [x8]
	cmp	x9, x11
	ccmp	x10, x8, #0, eq
	cset	w0, eq
	ret
	.cfi_endproc
                                        ; -- End function
.subsections_via_symbols
