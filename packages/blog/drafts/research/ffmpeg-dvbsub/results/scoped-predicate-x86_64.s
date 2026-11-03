	.build_version macos, 13, 0	sdk_version 27, 0
	.section	__TEXT,__text,regular,pure_instructions
	.globl	_native16                       ## -- Begin function native16
	.p2align	4
_native16:                              ## @native16
	.cfi_startproc
## %bb.0:
	pushq	%rbp
	.cfi_def_cfa_offset 16
	.cfi_offset %rbp, -16
	movq	%rsp, %rbp
	.cfi_def_cfa_register %rbp
	movdqu	-1(%rdi), %xmm0
	movdqu	(%rdi), %xmm1
	pxor	%xmm0, %xmm1
	movzbl	15(%rdi), %eax
	movzbl	16(%rdi), %ecx
	movd	%eax, %xmm0
	movd	%ecx, %xmm2
	pxor	%xmm0, %xmm2
	por	%xmm1, %xmm2
	xorl	%eax, %eax
	ptest	%xmm2, %xmm2
	je	LBB0_1
LBB0_3:
	popq	%rbp
	retq
LBB0_1:
	movq	%rdi, %rcx
	subq	%rsi, %rcx
	movdqu	(%rdi), %xmm0
	movdqu	(%rcx), %xmm1
	pxor	%xmm0, %xmm1
	ptest	%xmm1, %xmm1
	jne	LBB0_3
## %bb.2:
	movdqu	(%rdi), %xmm0
	movdqu	(%rdi,%rsi), %xmm1
	pxor	%xmm0, %xmm1
	xorl	%eax, %eax
	ptest	%xmm1, %xmm1
	sete	%al
	popq	%rbp
	retq
	.cfi_endproc
                                        ## -- End function
.subsections_via_symbols
