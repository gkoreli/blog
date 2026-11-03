------------------------ MODULE LoopCoverage ------------------------
EXTENDS Integers, Sequences, TLC
CONSTANTS Width, Broken
VARIABLES x, covered
vars == <<x,covered>>
Init == /\ x = 0 /\ covered = <<>>
Scalar == /\ x < Width /\ x' = x + 1 /\ covered' = Append(covered,x)
Batch == /\ x > 0 /\ Width - x > 16 /\ (x - 1) % 16 = 0
         /\ x' = x + IF Broken THEN 17 ELSE 16
         /\ covered' = covered \o [i \in 1..16 |-> x + i - 1]
Stay == /\ x >= Width /\ UNCHANGED vars
Next == Scalar \/ Batch \/ Stay
Spec == Init /\ [][Next]_vars
TypeOK == /\ x \in 0..Width /\ covered \in Seq(0..(Width-1))
Prefix == covered = [i \in 1..x |-> i - 1]
=============================================================================
