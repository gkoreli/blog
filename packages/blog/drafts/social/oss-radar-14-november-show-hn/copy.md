# OSS Radar #14 — X copy

Status: sent on X; owner-timeline confirmation observed. [Post](https://x.com/GogaKoreli/status/2121458320255119404). One text post, 270 weighted characters including the URL at 23 characters. The composer showed ten characters remaining. Reopening the permalink reached an account security check; permalink and independent public visibility were not verified. Further X account work is canceled. See [publication record](metrics.md).

## Post

Waymark 0.30.1 repeated an action after an executor crash.
Spindle kept HTTP, OpenAPI and Zod in sync after a bound changed.
Stroq's engine blocked a harmless printf.

What we learned from reading the code and running November's Show HN projects:
https://gkoreli.com/oss-radar-14-november-show-hn

## Evidence

The [article](https://gkoreli.com/oss-radar-14-november-show-hn) returned HTTP 200 when checked November 13. The [mechanism experiments](../../research/oss-radar-14-november-show-hn/06-mechanism-experiments.md) support the three findings: actual Waymark 0.30.1 executor kills, one Spindle validation-bound change, and a synthetic source-attribution case in the released Stroq 0.32.0 engine. Waymark's later merged recovery change was not runtime-tested; the Stroq result is not a claim about a live installed host.
