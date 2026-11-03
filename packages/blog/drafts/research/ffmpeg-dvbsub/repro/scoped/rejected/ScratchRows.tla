------------------------- MODULE ScratchRows -------------------------
EXTENDS Integers, FiniteSets, TLC
CONSTANT Broken
Colours == 0..1
Neighbours == 0..2
Zero == [d \in Neighbours |-> 0]
VARIABLES scratch, reference, initialized, n
vars == <<scratch,reference,initialized,n>>
Init == /\ scratch = [c \in Colours |-> [d \in Neighbours |-> 1]]
        /\ reference = [c \in Colours |-> Zero]
        /\ initialized = {} /\ n = 0
Touch(c,d) == /\ n < 2
              /\ reference' = [reference EXCEPT ![c][d] = @ + 1]
              /\ LET row == IF c \in initialized \/ Broken THEN scratch[c] ELSE Zero
                 IN scratch' = [scratch EXCEPT ![c] = [row EXCEPT ![d] = @ + 1]]
              /\ initialized' = initialized \cup {c} /\ n' = n + 1
Restart == /\ reference' = [c \in Colours |-> Zero]
           /\ initialized' = {} /\ n' = 0 /\ UNCHANGED scratch
Next == (\E c \in Colours, d \in Neighbours : Touch(c,d)) \/ Restart
Spec == Init /\ [][Next]_vars
TypeOK == /\ scratch \in [Colours -> [Neighbours -> 0..3]]
          /\ reference \in [Colours -> [Neighbours -> 0..2]]
          /\ initialized \subseteq Colours /\ n \in 0..2
LogicalRowsAgree == \A c \in Colours :
                    (IF c \in initialized THEN scratch[c] ELSE Zero) = reference[c]
=============================================================================
