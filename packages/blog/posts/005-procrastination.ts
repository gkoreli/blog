import { html } from 'nisli-static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import {
  Insight, PullQuote, SectionBreak, Footnotes,
  Callout, ResearchNote, EisenhowerMatrix, Steps, Closing, Postscript, ProcrastinationHero,
} from '../src/templates/components.js';

export const meta: PostMeta = {
  title: "Procrastination Is a Craft You've Been Mastering Your Entire Life",
  date: '2026-04-07',
  description: "Every article you've ever read told you procrastination is the enemy. A flaw to fix. A habit to break. I spent 30 years believing that. Turns out, I had it completely backwards.",
  tags: ['personal-essay', 'adhd', 'procrastination', 'eisenhower-matrix'],
  layout: 'immersive',
  slug: 'procrastination-is-a-craft-youve-been-mastering-your-entire-life',
};

export function preamble() {
  return ProcrastinationHero({
    kicker: `Personal Essay · ADHD · Procrastination · Eisenhower Matrix`,
    title: html`<h1>Procrastination is a <em>craft</em> you've been mastering your entire life — it's time to start harvesting it</h1>`,
    subtitle: html`Every article you've ever read told you procrastination is the enemy. A flaw to fix. A habit to break. I spent 30 years believing that. Turns out, I had it completely backwards.`,
    author: 'Goga Koreli',
    note: `Written at 7am the morning after a revelation that wouldn't let me sleep`,
  });
}

export function article() {
  return html`
<article class="post-content">
    <p>Every article you've ever read told you procrastination is the enemy. A
      flaw to fix. A habit to break. A symptom of something wrong with you. You
      read the same six reframes, tried the same four techniques, stuck with
      each of them for about two weeks, and quietly returned to zero. Then felt
      worse than before you started, because now there's one more thing you
      failed at sitting on the pile.</p>

    <p>You've been carrying that weight for a while. And the cruel part is that
      the more you read, the heavier it got. Because every book, every article,
      every productivity framework reinforced the same message: the
      procrastination is the problem. Fix it and everything else follows.</p>

    <p>You can't peel a pineapple with instructions written for an orange.
      You've been holding a pineapple the whole time.</p>

    <p>Yesterday morning I tried something different. Instead of asking myself
      what's important and urgent — a question that, for whatever reason, has
      never once produced a useful answer in my head — I asked what I was about
      to procrastinate. The list came instantly. I wrote it down. Then I
      actually did those things — crossed them off one by one, and every single
      one was high value, low effort. That night, before sleep, a thought hit
      me so hard I had to grab my phone and take a note. I knew I was going to
      forget if I didn't write it down. And then my brain turned on. I couldn't
      sleep. I had to write the full thought down, all of it, before the well
      of thoughts drained away. That note became this article. Wait a second —
      procrastination is a craft. It's a skill to master, not a skill to fight
      against. I am so stupid, I lived my life completely trying to eradicate
      it entirely. Why oh why. In all, it took 24 hours — from the morning
      experiment to the revelation that wouldn't let me sleep.</p>

    ${SectionBreak()}

    <h2>First, a tool you probably know but haven't really felt yet</h2>

    <p>You know the pattern. Hyperfocusing on genuinely interesting and important
      work while critical deliverables quietly rot on the side. Learning new
      technologies, diving deep into research papers, building things. All real,
      all valuable. But then there's a status report due at work. And you know
      you have to send it. And you don't feel like it. You're going to do it in
      5 minutes. Knowingly, you're going to forget in 2 and you're not going to
      do it today at all. Because you're going to remember at 4pm and it's
      going to be too late. So you effectively avoid it entirely. Well, at this
      point it doesn't matter if you send it at all or not. Then you completely
      invalidate the guilt by saying — if they really wanted me to send an email
      they would ping me. Where is the email we asked for? Then you will really
      send it. Looks like they really wanted it. But at that point it already
      cost you the reputation and you have to apologize for being late.</p>

    <p>And slowly you've become the person who always has a reason, always
      apologizes, always needs a second nudge. You know that person. You might
      be that person. You don't like this image you created — that you are
      always late, you have to really be asked several times to stress the
      importance of something. You need someone to really push, to add external
      pressure, to push you over your threshold of procrastination — and boy oh
      boy, that threshold is quite damn high. You need to be pushed really
      hard.</p>

    <p>At some point — maybe through a conversation about time blindness,
      maybe through someone who knows how your brain works — you came across
      something called the Eisenhower Matrix.
      You might have seen it. You might have even used it for two weeks before
      forgetting about it entirely. That's fine. Knowing this and organizing
      tasks the Eisenhower way is going to be helpful for a week or two, then
      the novelty fades and you're back to square zero. I know. But what I
      found is a version of this tool that actually works for the way our brains
      are wired, and it starts from the opposite direction than you'd expect.</p>

    ${ResearchNote({ summary: `Why the matrix breaks down immediately for ADHD brains`, body: html`Dr. Russell Barkley, one of the world's leading ADHD researchers,
        describes "time blindness" as a core feature — not a side effect. People
        with ADHD consistently underestimate how much time has passed, sometimes
        by 30–40%. Future deadlines don't feel real until they suddenly,
        viscerally do. For ADHD brains, there is now and not now. If
        something is due next Thursday, it's "not now" —
        neurologically invisible. Which is exactly why the instruction "look at
        your list and categorize by urgency and importance" breaks at Step 1.
        The instrument is miscalibrated. <a href="#footnotes">①</a>` })}

    ${EisenhowerMatrix({ quads: [
      { num: 'I', tag: `Urgent + Important`, title: `What you're procrastinating right now`, body: html`The status report. The conversation you've been
            avoiding. The thing with a deadline you keep telling yourself is
            "later." You know exactly what belongs here — it's whatever you're
            about to put off.`, cls: 'q1' },
      { num: 'II', tag: `Not Urgent + Important`, title: `What you're procrastinating the scheduling of`, body: html`The specialist referral. The IKEA trip. The thing
            that keeps gnawing but isn't on fire yet. You're not avoiding the
            event — you're avoiding making the plan.`, cls: 'q2' },
      { num: 'III', tag: `Urgent + Not Important`, title: `Not my pressing issue right now`, body: html`I was told the best approach here is a dedicated
            30-minute block every day — same slot, just get it off your mind.
            I might write about this quadrant at some point. The upper two
            squares are more pressing right now.`, cls: 'q3' },
      { num: 'IV', tag: `Not Urgent + Not Important`, title: `Nobody procrastinates these`, body: html`Nobody procrastinates opening TikTok before bed.
            Nobody logs it in a backlog. This quadrant matters — it's a real
            issue for a lot of people. I might write about the bottom two
            quadrants later down the line.`, cls: 'q4' }
    ] })}

    <p>Simple, right? Almost insultingly simple. And yet, for a certain type of
      person, for you possibly, this is genuinely not common sense. It's a blind
      spot. It sits right there in plain view and does nothing until you
      approach it from the right angle. I don't think it's an absolute solution
      for anything by itself. But it leads you to think about something new. It
      unlocks a missing puzzle piece that you had in a blind spot.</p>

    ${SectionBreak()}

    <h2>The crunch-time loop that "works" — until it doesn't</h2>

    <p>Here's the cycle you know by heart, from work and from life both. Before
      you think "oh, another office productivity thing that doesn't apply to me"
      — it doesn't matter if you're a software engineer, a freelancer, a
      student, or someone working from their living room on their own terms. The
      cycle is the same. The brain is the same.</p>

    <p>You put off the critical deliverable. You hyperfocus on something
      genuinely interesting. Let's be clear, it's not wasted time, it's real
      learning, real growth — it's the correct thing at the wrong moment. You
      are learning and growing, which you value highly, but you have to allocate
      a proper time for it. You can't be doing it during the time when you have
      a high-value urgent deliverable that someone is waiting on. And as long as it feels important and interesting, you feel
      fulfilled working on it. Doesn't matter if something else is more urgent
      — <em>I still executed on something important today.</em> That's the
      internal logic. That's the rationalization that keeps the whole machine
      running. In a vacuum, it's not even wrong. But in modern life, that's not
      good enough. You will stay behind. You will end up in trouble. The
      deadline creeps. Urgency builds. You finally hit the threshold where your
      brain goes — okay, <em>now</em> we work. Caffeine. Crunch. You pull it
      off.</p>

    <p>And here's the dark irony: you pull it off. Not just barely, sometimes
      brilliantly. Because you, the highly skilled person under high stress,
      perform. The deliverable lands. People are satisfied. And your brain
      registers: <em>that worked.</em> Procrastinate, increase the odds,
      increase the stressors, execute in crunch time, fuming on caffeine, but
      still pull it off. Reinforcement complete. Seems like a successful cycle
      model. Do it again next time.</p>

    <p>Boy oh boy, I feel like there must be something better. But as long as
      something works, why bother trying to change it? Let's do it another
      time — I have something interesting yet non-urgent to work on right now
      to get my dopamine levels excited.</p>

    ${Callout({ label: `The adrenaline substitution`, body: html`Research on the ADHD dopamine system <a href="#footnotes">②</a> helps explain why many ADHD people
      unconsciously self-medicate through deadline pressure — using panic and
      adrenaline to generate the focus other brains produce more readily. The
      focus produced by acute stress can temporarily mimic the effect
      of stimulant medication. It works. It is also quietly running your nervous
      system into the ground as a standard operating model.` })}

    <p>The thing is, this crunch-time execution model is real and it does work.
      But it takes a toll every cycle. Your sleep, your reputation, your
      nervous system. And there's a layer of beautiful rationalization on top of
      it all — not just one rationalization, multiple. You can generate them
      instantly, on demand, each one more convincing than the last: <em>I need
        the pressure. I can't do my best work without the urgency. That's just
        how I operate. Procrastination is the only way I know how to excel at
        my maximum performance — I need the additional stress levels to achieve
        peak focus.</em> The rationalizations come so fast and so polished that
      they don't even feel like excuses anymore. They feel like wisdom.
      Procrastination starts to feel like a reward, like a positive thing. What
      an irony. That's how good you've gotten at this over the past 30
      years.</p>

    <p>You're not entirely wrong. You just have no idea you're also running a
      sophisticated system — blindfolded — that could actually work <em>for</em>
      you instead of against you.</p>

    ${SectionBreak()}

    <h2>What every article got wrong — and why you stopped reading them</h2>

    <p>You tried the frameworks. The systems. The habit stacks and morning
      routines and color-coded time blocks. Two weeks, maybe three. Hopeful at
      first. Then falling off completely and feeling worse than before, because
      now there's another failure in the pile. You tried again. Experimented
      personally on yourself for months at a time. Tried for several weeks. Yet
      nothing worked. And eventually you stopped. You gave up on all of it.
      These days you can't stand most self-help content. You feel like people
      just wrote to game the system, make a profit. It worked for them but
      doesn't work for the rest of us. Don't push it on us. We are not the
      same. Different brain, different life conditioning, different everything.
      Don't give me your life advice if we are entirely unrelated.</p>

    <p>They handed you an orange manual and let you spend years feeling broken
      for not being able to apply it to your pineapple. You can't peel a
      pineapple with instructions written for an orange.</p>

    <p>Here's what they all missed. Every resource you ever read portrayed
      procrastination as evil. And that's what you did for 30 years of your
      life — you believed them. But procrastination, at its core, isn't the
      problem. It's not even really a symptom. For a lot of people, especially
      people like us, <mark>it's a signal. A highly trained, unconsciously
        calibrated signal that points directly at what matters most.</mark> It
      takes a mastery to be a great procrastinator. It is a feeling that tells
      you what is the most important, urgent, highest-impact, lowest-effort
      task to take care of. You just don't know this is the case. And you have
      been putting it off.</p>

    ${PullQuote({ content: html`<p>You are not the average Joe. You are not the others. Don't read the
        manual for how to peel an orange when they hand you a pineapple,
        okay?!</p>` })}

    <p>Think about it this way: do you procrastinate opening Instagram before
      bed? Does your brain feel guilty about not making a dedicated plan for
      each of your For You page feeds so the algorithm doesn't miss you? Of
      course not. Nobody writes that in a to-do list. Nobody gives it tender
      care and scheduling priority. And nobody agonizes over whether to visit
      their local Whole Foods for the hundredth time or finally make that trip
      to Costco to stock up on Spindrift and 60 packs of popcorn to eat for the
      rest of their life — who cares, you'll figure it out, nobody bats an eye.
      Nobody procrastinates the stuff that doesn't matter. Nobody builds
      elaborate systems of avoidance around tasks that carry no weight.</p>

    <p>You only procrastinate the things that are important. Always. Every single
      time. Which means your procrastination is a feeling, an uncannily
      accurate detector, for your highest-value work.</p>

    <p>Procrastination is like an excuse, it's not even a symptom at all, it's
      actually a positive thing. What an irony. Why did they have to portray
      procrastination as evil? All the resources you've ever read on the
      internet make it evil. Everyone did that. They spoiled it for you for 30
      years, to the point where you stopped reading any articles that have to
      do with ADHD, psychology, mental health, procrastination — nothing helped.
      They really reinforced your negative thinking about it. They were wrong.
      Or at minimum, they were writing for someone else — not for you.</p>

    ${SectionBreak()}

    <h2>The inversion</h2>

    <p>Here's what I realized. Instead of trying to assess importance and urgency
      directly (which, for whatever reason, seems hard to answer for me),
      I started asking myself a different question: <em>what am I about to
      procrastinate?</em> What's the thing I'm
      already writing a mental excuse for? What's the task with the slow
      creeping guilt? What am I going to say "I'll do in five minutes" about?</p>

    <p>That list comes instantly. Without effort. With total clarity. I slowly
      started to notice — eh, I'm gonna do it later. Yeah. One second, that
      actually belongs to Eisenhower's important and urgent. That right there
      needs to go to the main square. Let me log it in my personal backlog.
      Then I ask myself why am I procrastinating, and almost always the answer
      is that I don't feel like doing it — I wanna be doing something novel,
      more meaningful, which ends up being less urgent and more interesting to
      me. Novel, i.e. dopamine-inducing.</p>

    ${Insight({ label: `The inversion`, content: html`<p>Don't ask: "What is urgent and important?" Ask: "What am I
        procrastinating?" — then place it in the matrix. The answer to the
        second question is always available. The answer to the first one isn't.</p>` })}

    <p>The status report you keep dreading at work? Q1, urgent and important. The
      IKEA run you keep pushing because you're deep in a side project —
      returning the armchair, getting bar stools, the whole thing you tell
      yourself you should batch together first (a very compelling excuse, by the
      way — though you could spend 15 minutes and figure out the full list, and
      you know it) — that's Q2, not urgent but important enough that it keeps
      gnawing. The specialist referral you have to call about, the one you're
      procrastinating because you can't be bothered to figure out your schedule
      and navigate the logistics of a phone call? Also Q2. Schedule it. That's
      all. You're not procrastinating the event — you're procrastinating the
      scheduling of the event.</p>

    <p>And that distinction matters more than it looks. Think about it: for the
      non-urgent important stuff, you're not really procrastinating the action
      itself. You're procrastinating the scheduling part — the phone call to
      make the appointment, the five minutes to figure out when you're
      available, the logistics that don't sit right with you because there are
      much more dopamine-inducing alternatives at hand right now. The event
      itself? You'll show up. You'll do it. It's not going to ruin your life if
      you delay it a week. You'll figure out some alternative option down the
      line. But just admit it: you're procrastinating the scheduling part. And
      that belongs in Q2. Simply capture it: "make a schedule for X." That's
      the to-do item. Not the event — the scheduling of the event.</p>

    <p>So the two types differ. For Q1, you're procrastinating the deliverable
      itself. For Q2, you're procrastinating the act of scheduling the
      deliverable. Either way, ask yourself: what am I putting off? What am I
      about to say "I'll do it later" about? Feel free to safely allocate it in
      the matrix accordingly. If it needs scheduling — non-urgent square. If it
      needs to happen right now — urgent square. Trust me, either case, they are
      important. Otherwise you wouldn't feel guilty. Otherwise you wouldn't feel
      like you're procrastinating anything at all.</p>

    <p>Once it's in the matrix, it's out of the fog. You can see it. You can
      decide what to do with it intentionally instead of feeling vaguely guilty
      about it forever.</p>

    ${ResearchNote({ summary: `Research: why the dopamine system makes this hard`, body: html`Research from Brookhaven National Laboratory using PET scans found that
        ADHD brains have significantly lower dopamine markers in reward
        pathways than neurotypical brains. The internal motivational signal for
        most tasks is just quieter. Except in two situations: when something is
        novel and interesting, or when something is urgent and stressful. Both
        generate enough activation to engage. One feels great. The other is
        adrenaline. The inversion works because it bypasses the dopamine problem
        entirely — instead of requiring a motivational signal to start, it asks
        you to notice an avoidance signal you're already generating
        automatically. <a href="#footnotes">②</a>` })}

    ${SectionBreak()}

    <h2>Step 1 is acknowledgment. Step 2 is gold.</h2>

    <p>I made all these parallels and references so that you acknowledge one
      thing: you procrastinate important actions, deliverables, or the
      scheduling of important actions, events, and deliverables. That's it.
      That's the correlation. Simply inverse the question — instead of asking
      "what's important and urgent? I must be procrastinating them," ask
      yourself "what am I procrastinating?" and oh, trust me, safely feel free
      to allocate it in the Eisenhower matrix accordingly. Just acknowledging
      that this task is the highest-value ROI task — that alone will change
      your mental model.</p>

    <p>Acknowledgment and transparency is step 1. Because if something is in
      your blind spot, it's truly in your blind spot — you have no possible
      solutions, no possible actions to take on something you can't even see.
      Getting things out of the blind spot and into the matrix is already a
      huge unlock. But there's a step 2.</p>

    <p>Ask yourself: <em>why am I procrastinating this?</em> What specifically
      feels daunting about it?</p>

    <p>Not in a therapy-spiral way. Just practically: what's the one sub-task
      that feels bad? For the status report, it's not writing the email. It's
      sitting down to assess your own progress — how far am I, what have I
      achieved, what goals am I moving towards, what is left, what are the
      estimates, what is the ETA, what are the blockers, what are the measurable
      metrics. So much accounting and auditing, and in the meanwhile you could
      be writing code, researching issues in the infrastructure, iterating on
      the design. Some of these questions are genuinely hard to answer, they
      require real mental effort, and there's no easy way to automate them
      either — and as a software engineer, you hate the problems you can't
      automate. However, these days with AI reasoning tools in 2026 this mental
      model is flawed. You can automate your reasoning and thinking into
      instructions and achieve maybe 50% of the automation at least. Not fully
      automatable — don't fall into that trap on the other end — but the mental
      effort required is lower than you used to think. The old "this is
      unautomatable suffering" model is just an old habitual thinking model that
      you pretty much ingrained with reinforcement learning on yourself. That's
      a realization worth having.</p>

    <p>For the IKEA trip, it's not the trip. You have to return this armchair
      and buy bar stools, but you're working on a personal side project that
      feels cooler, more important. You know you can do both. It's just that
      you're not feeling like driving out 30 minutes and wasting that much time
      for a chair. Also then you have to spend all your mental effort on which
      new chair to buy. And also — what if you need more than bar stools? Maybe
      you should wait and figure out all the things you need so you can batch
      them all together instead of remembering one by one. This seems like a
      really good excuse. But you could spend 15 minutes and figure all of that
      out in one go. So it's a good excuse, after all — just not a real
      one.</p>

    <p>Once you identify that sub-task — the actual friction point — write it
      down as a to-do item. That's it. Don't act on it yet. Just name it.</p>

    <p>And this is the part that genuinely messed with my head: these
      sub-tasks are almost always embarrassingly easy. Like, so easy it's
      unbelievable. A five-minute phone call. A two-line email. Looking up one
      number. Making one list. I'm lazy to make a phone call. I can't be
      bothered to think about logistics. That's the friction. That's the whole
      thing. You've been inflating them into mountains of dread, and when you
      finally write them down and stare at them, you realize —
      <em>that's it?</em> That's what I've been avoiding for three weeks?</p>

    <p>And that's when it hit me. I'm procrastinating the most basic things.
      They are so easy that it's unbelievable. So now I am like a hunter,
      trying to maximize my profits. Whatever I'm procrastinating is the
      biggest, highest-value task — and it's the easiest at the same time. How
      bizarre is that? I crafted this perfect skill, like a feeling — I can
      feel the most impactful and easiest tasks at hand. I can basically feel
      it. However, for the past 30 years, I have been putting it off.</p>

    ${Insight({ label: `The ROI`, content: html`<p>Whatever you are procrastinating is the highest-value, lowest-effort
        task on your plate. You don't need a handbook to find it. You can
        feel it. You've always been able to feel it.</p>` })}

    ${SectionBreak()}

    <h2>You're a master procrastinator — own it</h2>

    <p>So after all of this, it seemed so simple yet impactful.</p>

    <p>You've spent 30 years perfecting the art of procrastination. Not years,
      not "a while" — three decades of daily, unconscious practice. You have a
      finely tuned internal signal for what carries real weight. You can feel,
      instantly and without analysis, which tasks have the highest stakes. You
      don't think about it or rationalize it — it just happens. But you are so
      good at it that you know what, when, and why, instantly. You can find
      multiple really good rationalizations for each one without breaking a
      sweat. But that's not the point. The point is very simple: whatever you
      are about to procrastinate, simply categorize it into Eisenhower's urgent
      and important square. That's it. That's all you have to do. Then you can
      intentionally make a decision — you can decide if you still want to put
      it off, or figure out why you're putting it off. The action will follow,
      or can follow intentionally. But first, you have to see it.</p>

    <p>Procrastination is a masterful skill people wish they could obtain. It's
      a feeling that tells you about the highest ROI. You just have been putting
      it off. All you need to do is acknowledge that these tasks belong to the
      important squares of Eisenhower. That's it. Then you can intentionally
      make a decision after you are transparent with yourself.</p>

    <p>If you think from this perspective, you are about to unlock your
      procrastination as a skill — and as an otherworldly skill at that. You
      can pretty much <em>feel</em> the highest-ROI tasks. People go through
      business school and burn \$300k in loans just to learn what ROI stands for
      and barely make 0.5% margins. On the other hand, you simply developed a
      feeling for all the highest-ROI tasks in your life. You didn't need no
      handbooks. You just didn't know they were important.</p>

    <p>What an irony. The most common-sense-looking concept is not common sense
      at all. It sits in your blind spot and I am right now uncovering it for
      you.</p>

    ${PullQuote({ content: html`<p>ADHD is not a disorder of attention per se. It arises as a
        developmental failure in the brain circuitry that underlies inhibition
        and self-control.</p>`, cite: `— Dr. Russell Barkley` })}

    <p>Dopamine is not the enemy here either. We all need it. There's nothing
      bad about chasing it — nothing at all. The problem isn't that you source
      dopamine from interesting, novel, meaningful work. The problem is
      <em>only</em> when you lose the steering wheel. If you're in charge of
      your own dopamine collection system, if you're the one deciding when to
      chase the novel thing and when to do the urgent thing, then all is well.
      Nobody wishes to lose the control. But if you're sourcing dopamine
      uncontrollably, the current will take you anywhere — and you might end up
      somewhere you never meant to end up. Once you're aware, once you're
      logging your procrastinations deliberately, you're back on the steering
      wheel. You can still choose to do the interesting thing right now — but
      this time you know exactly what you're deferring, and why. That's
      different. That's intentional.</p>

    ${SectionBreak()}

    <h2>Try it once, this morning</h2>

    <p>Sit down at work in the morning, or at the study session. Open a book,
      the laptop, whatever. Don't try to figure out your priorities from
      scratch. Just wait for the feelings. You are about to procrastinate lots
      of things — that's the gold you are looking for. Don't act on them yet.
      Just write them down.</p>

    ${Steps({ items: [
      { title: `Write down everything you're procrastinating`, body: html`Don't filter, don't judge, just let it surface. The list comes
            fast. You know this list already.` },
      { title: `Place each one in the matrix`, body: html`Urgent and needs to happen now → Q1. Important but needs scheduling
            → Q2. That's the whole decision.` },
      { title: `If you're feeling extravagant: name the friction`, body: html`For each item, write the one sub-task you're actually dreading. One
            line. Don't do it yet — just name it. That's your highest-value,
            lowest-effort to-do item right there. I bet each one will take 5
            minutes. And I bet you will have a lot of joy accomplishing it.` }
    ] })}

    <p>The Eisenhower Matrix is not a new idea. But there's a version of it that
      works for the way your brain is actually wired — and it starts from the
      completely opposite direction than every article you've ever read told you
      to start from.</p>

    <p>This was not common sense for me. And I don't expect it would be common
      sense for many others. The most common-sense-looking concept turned out to
      be the thing sitting in my blind spot for 30 years. After all, it seemed
      so simple yet so impactful — like how come it didn't hit me earlier? Like,
      procrastination is a powerful skill to wield. You can use it for your
      benefit. You've been crafting it your entire life.</p>

    <p>You don't need to fix your procrastination. You need to read it. Go
      harvest it. The tree is full of fruit, so much so that the branches are
      touching the ground. Harvest it. Otherwise the branches will break off
      and you will lose all the harvest.</p>

    ${Closing({ title: html`You weren't failing.<br />You were misreading the map.`, body: html`Your procrastination was never the problem. It was the map the whole
        time. You just needed someone to tell you how to read it. The thing
        you've been trying to kill is the same thing pointing you, every single
        day, toward your most important work. Acknowledge it. Categorize it.
        Then decide what to do with it — with your eyes open.` })}

    ${Postscript({ content: html`You can thank me later. Right now you have something urgent you've
      been putting off. Go log it.
      <br />— gkoreli.com · April 7, 2026` })}

    ${Footnotes({ items: [html`① <strong>Dr. Russell A. Barkley</strong> — Retired clinical neuropsychologist and one of the world's leading ADHD researchers. His executive function model places time blindness at the center of ADHD challenges. Official site and books: <a href="https://www.russellbarkley.org" target="_blank" rel="noopener">russellbarkley.org</a>. Book referenced: <em>Taking Charge of Adult ADHD</em> (2nd ed., Guilford Press, 2021) — <a href="https://www.guilford.com/books/Taking-Charge-of-Adult-ADHD/Russell-Barkley/9781462546855" target="_blank" rel="noopener">publisher page</a>. Quote source: "Behavioral inhibition, sustained attention, and executive functions: constructing a unifying theory of ADHD," <em>Psychological Bulletin</em>, 1997 — <a href="https://pubmed.ncbi.nlm.nih.gov/9000892/" target="_blank" rel="noopener">PubMed</a>.`, html`② <strong>Brookhaven National Laboratory / Dr. Nora Volkow & Dr. Gene-Jack Wang</strong> — PET scan research on dopamine reward pathway deficits in ADHD. Published in <em>JAMA</em>, September 9, 2009. Study: <a href="https://jamanetwork.com/journals/jama/fullarticle/184547" target="_blank" rel="noopener">JAMA</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/19738093" target="_blank" rel="noopener">PubMed</a>.`, html`③ <strong>Dwight D. Eisenhower</strong> — The urgency-importance principle was referenced in a 1954 address to the Second Assembly of the World Council of Churches, attributed by Eisenhower to Dr. J. Roscoe Miller, then President of Northwestern University. The modern "matrix" format was later popularized by Stephen Covey in <em>The 7 Habits of Highly Effective People</em> (Free Press, 1989) — <a href="https://www.simonandschuster.com/books/The-7-Habits-of-Highly-Effective-People/Stephen-R-Covey/9781982137274" target="_blank" rel="noopener">publisher page</a>.`] })}
</article>
`;
}
