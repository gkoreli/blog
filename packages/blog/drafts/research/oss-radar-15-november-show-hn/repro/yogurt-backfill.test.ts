// Copy into the pinned Yogurt app/test directory; run with that project's Vitest runtime.
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { hookTranscription, settleTranscription, stopTranscriptionServer, transcribeRecorded } from '../src/main/asr'
import { openStore } from '../src/main/store'

const RATE = 16000
async function* phrases() {
  for (let n = 0; n < 4; n++) {
    yield Float32Array.from({ length: RATE }, (_, i) => 0.3 * Math.sin(i / 10))
    yield new Float32Array(RATE)
  }
}

it('distinguishes complete, unavailable-model and partially saved recovery in the actual file-backed store', async () => {
  const root = mkdtempSync(join(tmpdir(), 'radar-yogurt-backfill-'))
  const cases = []
  for (const mode of ['complete', 'no-model', 'pause-after-first-transcription']) {
    const file = join(root, `${mode}.sqlite`)
    let store = openStore(file)
    let paused = false
    const dispose = hookTranscription({
      store,
      modelPath: () => mode === 'no-model' ? undefined : '/synthetic-model.bin',
      transcriber: async c => {
        if (mode === 'pause-after-first-transcription') paused = true
        return [{ track: c.track, startMs: c.startMs, endMs: c.startMs + 1000, text: `Authored phrase at ${c.startMs}` }]
      },
      send: () => {}, warn: () => {},
      onStart: () => () => {}, onStop: () => () => {},
    })
    try {
      const m = store.createMeeting({ title: mode, startedAt: 1, endedAt: 2, eventId: null, app: null, attendees: [], state: 'stopped' })
      store.updateMeeting(m.id, { transcriptionPending: true })
      expect(store.untranscribedMeetings().map(x => x.id)).toEqual([m.id])
      const done = await transcribeRecorded(m.id, { them: phrases() }, () => paused)
      await settleTranscription(3000)
      const before = {
        done,
        pending: store.meeting(m.id)?.transcriptionPending === true,
        segments: store.segments(m.id).length,
        eligible: store.untranscribedMeetings().some(x => x.id === m.id),
      }
      store.close()
      store = openStore(file)
      const after = {
        pending: store.meeting(m.id)?.transcriptionPending === true,
        segments: store.segments(m.id).length,
        eligible: store.untranscribedMeetings().some(x => x.id === m.id),
      }
      expect(after).toEqual({ pending: before.pending, segments: before.segments, eligible: before.eligible })
      if (mode === 'complete') {
        expect(done).toBe(true)
        expect(before.segments).toBeGreaterThan(0)
        expect(before.pending).toBe(false)
        expect(before.eligible).toBe(false)
      } else if (mode === 'no-model') {
        expect(before).toEqual({ done: false, pending: true, segments: 0, eligible: true })
      } else {
        expect(done).toBe(false)
        expect(before.segments).toBeGreaterThan(0)
        expect(before.pending).toBe(true)
        expect(before.eligible).toBe(false)
      }
      cases.push({ mode, before, after })
    } finally {
      dispose()
      stopTranscriptionServer()
      store.close()
    }
  }
  const output = process.env.RADAR_YOGURT_BACKFILL_RESULT
  if (output) writeFileSync(output, `${JSON.stringify({ cases }, null, 2)}\n`)
})
