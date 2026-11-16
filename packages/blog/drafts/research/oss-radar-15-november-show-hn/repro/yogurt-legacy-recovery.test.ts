// Copy into app/test of either declared source. Actual persisted-store migration; no audio/model service.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { expect, it } from 'vitest'
import { openStore } from '../src/main/store'

it('distinguishes legacy empty meetings from a partial transcript and does not retry handled empty meetings on reopen', () => {
  const release = process.env.RADAR_YOGURT_RELEASE
  const output = process.env.RADAR_LEGACY_RESULT
  if ((release !== '0.3.24' && release !== '0.3.34') || !output) throw new Error('Supply a declared release and fresh result path')
  const root = mkdtempSync(join(tmpdir(), 'radar-yogurt-legacy-'))
  const file = join(root, 'meetings.sqlite')
  let store = openStore(file)
  try {
    const create = (title: string, state: 'stopped' | 'done', startedAt: number) => store.createMeeting({
      title, state, startedAt, endedAt: startedAt + 1, eventId: null, app: null, attendees: [],
    })
    const stopped = create('legacy-stopped-empty', 'stopped', 1)
    const done = create('legacy-done-empty', 'done', 3)
    const partial = create('partial-transcript', 'stopped', 5)
    store.addSegments([{ meetingId: partial.id, track: 'them', startMs: 0, endMs: 1000, text: 'Authored partial sentence.', speaker: null }])
    store.close()
    // Construct what an older store left: no tracking flag on the empty meetings, one pending partial recording.
    const old = new DatabaseSync(file)
    old.prepare('UPDATE meetings SET transcription_pending = CASE WHEN id = ? THEN 1 ELSE 0 END').run(partial.id)
    old.exec('PRAGMA user_version = 0')
    old.close()
    store = openStore(file)
    const candidateNames = () => store.untranscribedMeetings().map(meeting => meeting.title)
    const candidatesAfterUpgrade = candidateNames()
    const expected = release === '0.3.34' ? ['legacy-stopped-empty', 'legacy-done-empty'] : []
    expect(candidatesAfterUpgrade).toEqual(expected)
    expect(store.meeting(partial.id)?.transcriptionPending).toBe(true)
    expect(candidatesAfterUpgrade).not.toContain('partial-transcript')
    store.updateMeeting(stopped.id, { transcriptionPending: false })
    store.updateMeeting(done.id, { transcriptionPending: false })
    store.close()
    store = openStore(file)
    const candidatesAfterHandledReopen = candidateNames()
    expect(candidatesAfterHandledReopen).toEqual([])
    expect(store.meeting(partial.id)?.transcriptionPending).toBe(true)
    const result = {
      release,
      source: release === '0.3.34' ? '2004c7fc3d77538a648bf28632e49d484349a057' : '0f2e5bc5d9452e956dfc82b26b96ec1fd14f3a60',
      candidatesAfterUpgrade, candidatesAfterHandledReopen,
      partialStillPendingButIneligible: true,
      scope: 'Actual file-backed store candidate selection and one-time migration, with fresh and reopened SQLite. No transcription, summary, model or full application trial.',
    }
    writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  } finally {
    store.close()
    rmSync(root, { recursive: true, force: true })
  }
})
