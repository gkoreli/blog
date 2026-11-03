------------------------ MODULE OutputFailure ------------------------
EXTENDS Integers, TLC
CONSTANTS Fixed, Route
VARIABLES phase, allocated, failed, got, saveRet, callerRet, decoderRet, versionCommitted
vars == <<phase,allocated,failed,got,saveRet,callerRet,decoderRet,versionCommitted>>
Init == /\ phase="idle" /\ allocated=0 /\ failed=FALSE /\ got=FALSE
        /\ saveRet=0 /\ callerRet=0 /\ decoderRet=0 /\ versionCommitted=FALSE
Begin == /\ phase="idle" /\ phase'="allocate" /\ got'=TRUE
         /\ UNCHANGED <<allocated,failed,saveRet,callerRet,decoderRet,versionCommitted>>
Allocate == /\ phase="allocate" /\ allocated<4 /\ allocated'=allocated+1
            /\ UNCHANGED <<phase,failed,got,saveRet,callerRet,decoderRet,versionCommitted>>
Fail == /\ phase="allocate" /\ allocated<4
        /\ phase'="caller" /\ allocated'=0 /\ failed'=TRUE /\ saveRet'=-1
        /\ got'=IF Fixed THEN FALSE ELSE got
        /\ UNCHANGED <<callerRet,decoderRet,versionCommitted>>
Complete == /\ phase="allocate" /\ allocated=4 /\ phase'="caller"
            /\ UNCHANGED <<allocated,failed,got,saveRet,callerRet,decoderRet,versionCommitted>>
Caller == /\ phase="caller" /\ phase'="decode"
          /\ callerRet'=IF Fixed THEN saveRet ELSE 0
          /\ versionCommitted'=IF Route="page" THEN (~failed \/ ~Fixed) ELSE versionCommitted
          /\ UNCHANGED <<allocated,failed,got,saveRet,decoderRet>>
Decode == /\ phase="decode" /\ phase'="returned"
          /\ decoderRet'=IF Fixed THEN callerRet ELSE 0
          /\ UNCHANGED <<allocated,failed,got,saveRet,callerRet,versionCommitted>>
Stay == /\ phase="returned" /\ UNCHANGED vars
Next == Begin \/ Allocate \/ Fail \/ Complete \/ Caller \/ Decode \/ Stay
Spec == Init /\ [][Next]_vars
TypeOK == /\ Route \in {"end","page","fallback"}
          /\ phase \in {"idle","allocate","caller","decode","returned"}
          /\ allocated \in 0..4 /\ failed \in BOOLEAN /\ got \in BOOLEAN
          /\ saveRet \in {-1,0} /\ callerRet \in {-1,0} /\ decoderRet \in {-1,0}
          /\ versionCommitted \in BOOLEAN
FailureReported == (failed /\ phase="returned") =>
                    (decoderRet=-1 /\ ~got /\ allocated=0 /\ ~versionCommitted)
=============================================================================
