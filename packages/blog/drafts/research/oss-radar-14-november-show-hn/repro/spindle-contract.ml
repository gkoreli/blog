(* Copy to a radar_contract executable in the pinned temporary checkout.
   Replace the bound 10 with 2 for the changed contract. *)
open Spindle.Syntax

type claim = { units : int; [@min 1] [@max 10] } [@@deriving wiretype]

let routes =
  [ Spindle.post Spindle.Path.(s "claim")
      (Spindle.Returns.json claim_json)
      (let+ body = Spindle.json claim_json in Ok body) ]

let () =
  if Array.length Sys.argv > 1 && Sys.argv.(1) = "serve" then
    let port = int_of_string Sys.argv.(2) in
    Eio_main.run (fun env -> Spindle.serve ~host:"127.0.0.1" ~port env routes)
  else
    Spindle_cli.run ~name:"radar-contract" ~title:"Radar contract"
      ~app:(Spindle.App.make routes) ()
