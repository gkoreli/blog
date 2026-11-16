// Copy into the pinned Yogurt app/test directory. Uses released native helpers and a verified local model.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { helperDecode } from '../src/main/asr/backfill'
import { hookTranscription, settleTranscription, stopTranscriptionServer, transcribeRecorded } from '../src/main/asr'
import { createWhisperServer } from '../src/main/asr/server'
import { openStore } from '../src/main/store'

it('saves recognized synthetic speech through the actual decoder, local server, pipeline and database', async () => {
  const binary = process.env.RADAR_WHISPER_BIN
  const decoder = process.env.RADAR_AUDIO_BIN
  const model = process.env.RADAR_WHISPER_MODEL
  const audio = process.env.RADAR_AUDIO_FILE
  const output = process.env.RADAR_RECOGNITION_RESULT
  if (!binary || !decoder || !model || !audio || !output) throw new Error('Supply the five RADAR fixture paths')
  const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
  expect(sha(model)).toBe('ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb')
  const root = mkdtempSync(join(tmpdir(), 'radar-yogurt-recognition-'))
  const store = openStore(join(root,'meeting.sqlite'))
  const server = createWhisperServer({ binary, model, threads: 4, startTimeoutMs: 120000 })
  const warnings: string[] = []
  const dispose = hookTranscription({ store, modelPath: () => model, server: () => server,
    send: () => {}, warn: code => warnings.push(code), onStart: () => () => {}, onStop: () => () => {} })
  let samples = 0
  async function* track() {
    for await (const part of helperDecode(decoder, audio)) { samples += part.length; yield part }
  }
  const started = performance.now()
  try {
    const meeting = store.createMeeting({ title:'Authored speech fixture', startedAt:1, endedAt:2, eventId:null, app:null, attendees:[], state:'stopped' })
    store.updateMeeting(meeting.id, { transcriptionPending:true })
    const done = await transcribeRecorded(meeting.id, { them:track() })
    await settleTranscription(10000)
    const segments = store.segments(meeting.id)
    const transcript = segments.map(x=>x.text).join(' ')
    const text = transcript.toLowerCase()
    const words = ['monday','alice','export','bob','browser','launch','tomorrow']
    const coverage = Object.fromEntries(words.map(word=>[word,text.includes(word)]))
    coverage['thirty-or-30'] = /\b(thirty|30)\b/.test(text)
    const result = { release:'0.3.24', source:'0f2e5bc5d9452e956dfc82b26b96ec1fd14f3a60', model:'whisper-small-q5_1', modelSha256:sha(model), audioSha256:sha(audio), decoderSha256:sha(decoder), serverSha256:sha(binary), decodedSamples:samples, decodedSeconds:samples/16000,
      done, pending:store.meeting(meeting.id)?.transcriptionPending===true, savedSegments:segments.length, wordCoverage:coverage,
      transcriptSha256:createHash('sha256').update(transcript).digest('hex'), warnings, elapsedSeconds:(performance.now()-started)/1000,
      scope:'Authored Samantha English speech in M4A, released Mac helpers and catalog-pinned small model through actual saved-recording pipeline/SQLite. No microphone capture, real meeting, summary, speaker-quality or general accuracy/performance claim.' }
    writeFileSync(output,JSON.stringify(result,null,2)+'\n')
    writeFileSync(join(root,'transcript.txt'),transcript+'\n')
    expect(done).toBe(true)
    expect(result.pending).toBe(false)
    expect(segments.length).toBeGreaterThan(0)
    expect(Object.values(coverage).every(Boolean)).toBe(true)
  } finally {
    dispose()
    stopTranscriptionServer()
    await server.stop()
    store.close()
  }
}, 180000)
