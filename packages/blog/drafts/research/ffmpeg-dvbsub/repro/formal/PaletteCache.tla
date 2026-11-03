------------------------ MODULE PaletteCache ------------------------
EXTENDS Integers, TLC
CONSTANTS Mode, Broken
VARIABLES revision, cachedRevision, cached, present, phase, output, outputRevision
vars == <<revision,cachedRevision,cached,present,phase,output,outputRevision>>
MinusTwo == -2
MinusOne == -1
NeedsComputed == Mode = 1 \/ (Mode < 0 /\ ~present)
Init == /\ revision = 0 /\ cachedRevision = 0 /\ cached = FALSE
        /\ present = FALSE /\ phase = "idle" /\ output = "none" /\ outputRevision = 0
ChangePixels == /\ phase = "idle" /\ revision < 2
                /\ revision' = revision + 1
                /\ cached' = IF Mode = -2 THEN cached ELSE FALSE
                /\ output' = "none"
                /\ UNCHANGED <<cachedRevision,present,phase,outputRevision>>
ChangeCLUT == /\ phase = "idle" /\ present' = ~present /\ output' = "none"
              /\ UNCHANGED <<revision,cachedRevision,cached,phase,outputRevision>>
Begin == /\ phase = "idle" /\ phase' = "build" /\ output' = "none"
         /\ UNCHANGED <<revision,cachedRevision,cached,present,outputRevision>>
Finish == /\ phase = "build" /\ phase' = "idle"
          /\ output' = IF NeedsComputed THEN "computed" ELSE "transmitted"
          /\ outputRevision' = IF NeedsComputed THEN
                 (IF cached THEN cachedRevision ELSE revision) ELSE revision
          /\ cached' = IF NeedsComputed THEN TRUE ELSE cached
          /\ cachedRevision' = IF NeedsComputed /\ ~cached THEN revision ELSE cachedRevision
          /\ UNCHANGED <<revision,present>>
Fail == /\ phase = "build" /\ phase' = "idle"
        /\ output' = IF Broken THEN "partial" ELSE "none"
        /\ UNCHANGED <<revision,cachedRevision,cached,present,outputRevision>>
Reset == /\ phase = "idle" /\ revision' = 0 /\ cachedRevision' = 0
         /\ cached' = FALSE /\ present' = FALSE /\ phase' = "idle"
         /\ output' = "none" /\ outputRevision' = 0
Next == ChangePixels \/ ChangeCLUT \/ Begin \/ Finish \/ Fail \/ Reset
Spec == Init /\ [][Next]_vars
TypeOK == /\ revision \in 0..2 /\ cachedRevision \in 0..2 /\ cached \in BOOLEAN
          /\ present \in BOOLEAN /\ phase \in {"idle","build"}
          /\ output \in {"none","computed","transmitted","partial"}
          /\ outputRevision \in 0..2
NoPartial == output # "partial"
FreshUnlessOnce == (output = "computed" /\ Mode # -2) => outputRevision = revision
Policy == (output = "computed" => NeedsComputed) /\ (output = "transmitted" => ~NeedsComputed)
AlwaysFresh == output = "computed" => outputRevision = revision
CacheOrder == cached => cachedRevision <= revision
=============================================================================
