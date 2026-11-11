"""Synthetic workflows: all outside effects are appends in a temporary journal."""
import asyncio
import json
import os
from pathlib import Path
from waymark import RetryPolicy, Workflow, action, workflow

ROOT = Path(os.environ['RADAR_WAYMARK_TRIAL'])

def append(label: str, step: str) -> None:
    with (ROOT/'effects.jsonl').open('a') as file:
        file.write(json.dumps({'label':label,'step':step})+'\n')
        file.flush()
        os.fsync(file.fileno())

@action
async def record(label: str, step: str) -> str:
    append(label, step)
    return step

@action
async def blocked_effect(label: str) -> str:
    append(label, 'external-effect')
    while not (ROOT/(label+'-release')).exists():
        await asyncio.sleep(0.1)
    return 'complete'

@workflow
class SleepRecovery(Workflow):
    async def run(self, label: str) -> str:
        await record(label, 'before-sleep')
        await asyncio.sleep(12)
        return await record(label, 'after-sleep')

@workflow
class LostDefault(Workflow):
    async def run(self, label: str) -> str:
        return await blocked_effect(label)

@workflow
class LostRetry(Workflow):
    async def run(self, label: str) -> str:
        return await self.run_action(
            blocked_effect(label),
            retry=RetryPolicy(attempts=2, exception_types=['ActionExecutionLost']),
        )
