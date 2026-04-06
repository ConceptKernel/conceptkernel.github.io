---
title: Streaming -- stream.{kernel} Topic and Claude Agent SDK
description: How per-token Claude output flows through NATS to the browser, enabling progressive rendering of LLM responses in the web shell.
---

# Streaming

## The Problem: Batch Responses Are Not Enough

Before v3.5.9, every LLM-backed action produced a single blob response. The kernel invoked `claude -p`, waited for completion, and published the full result to `result.{kernel}`. For a 30-second Claude response, the user saw nothing for 30 seconds, then everything at once.

This is architecturally correct (the result IS the sealed instance) but operationally frustrating. Users expect progressive rendering -- they want to see the response being constructed, not just the final output.

## Two Invocation Modes

v3.6 establishes two modes for invoking Claude from within a concept kernel:

### Mode A: Batch (`claude -p`, subprocess)

```python
result = subprocess.run(
    ["claude", "-p", prompt, "--tools", "", "--no-session-persistence"],
    cwd=ck_dir, capture_output=True, text=True, timeout=300
)
```

Output captured as a single blob. Sealed as instance. Published as one `result.{kernel}` message. Simple, no streaming. Appropriate for:
- Actions that produce structured data (compliance checks, status queries)
- Environments without NATS WSS (headless, CI pipelines)
- Short responses where streaming overhead is not worth it

### Mode B: Streaming (`claude_agent_sdk`, async generator)

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for event in query(
    prompt=prompt,
    options=ClaudeAgentOptions(model="sonnet", tools=[])
):
    await nc.publish(
        f"stream.{kernel}",
        json.dumps(event_to_nats(event)).encode()
    )
```

Each token/event published to `stream.{kernel}` in real-time. The browser subscribes and renders progressive chat bubbles. Appropriate for:
- Interactive conversation actions (`message`, `analyze`, `summarize`)
- Any action backed by EXTENDS to CK.Claude
- Long-running Claude responses where feedback matters

## The stream.{kernel} Topic

v3.5.9 adds a new NATS topic to the kernel topic convention:

| Topic | Direction | Content | Introduced |
|-------|-----------|---------|------------|
| `input.{kernel}` | Publish | User request (action + data) | v3.5 |
| `result.{kernel}` | Subscribe | Final sealed result | v3.5 |
| `event.{kernel}` | Subscribe | Lifecycle events | v3.5 |
| `stream.{kernel}` | Subscribe | Per-token streaming events | **v3.5.9** |

### Why a Separate Topic

The stream topic is separate from `result.{kernel}` because:

1. **Different subscribers.** The result topic carries sealed instances -- consumed by other kernels, stored in the DATA loop. The stream topic carries ephemeral tokens -- consumed by browser UIs for progressive rendering.
2. **Different lifetimes.** Result messages are durable (they become instances). Stream messages are fire-and-forget (they exist only during rendering).
3. **Different volumes.** A 2,000-token Claude response generates ~2,000 stream events but ONE result event. Mixing them on the same topic would bury results in stream noise.
4. **Optional subscription.** Kernels that do not need progressive rendering never subscribe to `stream.*`. The overhead is zero for non-interactive use cases.

## Event Type Mapping

Claude Agent SDK events map to NATS stream payloads:

| SDK Event | NATS `type` | Content | Browser Rendering |
|-----------|-------------|---------|-------------------|
| `content_block_delta` + `text_delta` | `content_block_delta` | Cumulative text + incremental delta | Growing text bubble |
| `content_block_start` + `tool_use` | `tool_use` | Tool name + input JSON | Collapsible tool block |
| `AssistantMessage` | `AssistantMessage` | Full text from content blocks | Final bubble (removes streaming indicator) |
| `ResultMessage` | `ResultMessage` | Final answer | Closes stream |
| `message_start`, `message_stop`, `ping` | (suppressed) | -- | Not rendered |

### Stream Event Payload

Every stream event carries:

```json
{
  "type": "content_block_delta",
  "trace_id": "tx-a8f3c1",
  "kernel_urn": "ckp://Kernel#Delvinator.Core:v1.0",
  "data": {
    "text": "The analysis shows three patterns...",
    "delta": "three patterns..."
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | MUST | Event type from the mapping table above |
| `trace_id` | MUST | Correlation ID linking all events from one action invocation |
| `kernel_urn` | MUST | Source kernel -- which kernel's stream this is |
| `data` | MUST | Event-specific payload |

The `trace_id` is critical for the web shell: it groups stream events into a single response bubble. Without it, events from concurrent actions on the same kernel would interleave in the UI.

## Handler Signature Change

v3.5.9 extends the `NatsKernelLoop` handler signature:

```python
# Before v3.5.9
async def handle_action(body, nc=None, trace_id=None):
    ...

# After v3.5.9
async def handle_action(body, nc=None, trace_id=None, stream=None):
    if stream:
        await stream("content_block_delta", {"text": "Processing..."})
    ...
```

The `stream` parameter is a callback: `async stream(event_type: str, data: dict)`. When present, the handler can emit streaming events. The callback handles NATS publishing, trace_id injection, and kernel_urn tagging.

**Backwards compatibility:** Handlers that do not accept `stream=` still work. The `NatsKernelLoop` inspects the handler's signature at registration time and only passes `stream` if the handler declares it.

## Structured Logging in NatsKernelLoop

v3.5.9 also replaces the `[rx]`/`[tx]` print statements in NatsKernelLoop with structured JSON logging:

```json
{"ts":"2026-04-05T16:37:25Z","level":"info","kernel":"Delvinator.Core","event":"rx","trace":"tx-a8f3c1","action":"analyze","user":"test26"}
{"ts":"2026-04-05T16:37:25Z","level":"info","kernel":"Delvinator.Core","event":"stream.start","trace":"tx-a8f3c1"}
{"ts":"2026-04-05T16:37:30Z","level":"info","kernel":"Delvinator.Core","event":"stream.end","trace":"tx-a8f3c1","tokens":1847}
{"ts":"2026-04-05T16:37:30Z","level":"info","kernel":"Delvinator.Core","event":"tx","trace":"tx-a8f3c1","topic":"result.Delvinator.Core"}
```

The `_log()` method ensures every line includes `ts`, `level`, `kernel`, and `event` -- matching the structured logging spec from v3.5.2.

## Architectural Bridge: Local and Cluster

The streaming architecture bridges LOCAL (developer machine) and CLUSTER (deployed kernel):

```
LOCAL (developer)                    CLUSTER (deployed)
-----------------                    ------------------
claude CLI                           Kernel processor
  |-- claude_agent_sdk                 |-- claude_agent_sdk
       |-- stream events                    |-- stream events
            |-- stdout                           |-- NATS stream.{kernel}
                                                      |-- Browser (WSS)
```

Same SDK, same event types, same rendering. A kernel running locally streams to stdout. The same kernel deployed to the cluster streams to NATS. The browser consumes both via the `stream.{kernel}` subscription. The developer sees the same progressive output in Claude Code CLI and in the web shell.

## Web Shell Integration

The web shell's **chat** view mode handles stream events:

1. On first `content_block_delta` for a new `trace_id` -- create a new bubble with streaming indicator
2. On subsequent `content_block_delta` -- append text to the bubble
3. On `tool_use` -- create a collapsible tool block within the bubble
4. On `AssistantMessage` -- finalize the bubble, remove streaming indicator
5. On `ResultMessage` -- close the stream, enable new action input

The **body** and **envelope** view modes ignore stream events -- they only render the final `result.{kernel}` message.

## Architectural Consistency Check

::: details Logical Analysis: Streaming Design

**Question:** Should stream events be stored in the DATA loop?

**Answer:** No. Stream events are ephemeral rendering artifacts. The sealed instance (published to `result.{kernel}`) IS the DATA loop artifact. Storing individual tokens would be like storing every keystroke of a document -- the document itself is the meaningful unit. If audit of the full token stream is needed, kernel logs (which are in the DATA loop at `storage/logs/`) already capture the stream events.

**Question:** What happens if the browser disconnects mid-stream?

**Answer:** The kernel continues streaming to NATS. The events are published regardless of subscriber presence. When the browser reconnects, it will not see the missed events -- NATS basic pub/sub does not replay. The user sees the final `result.{kernel}` message (which arrives after the stream completes) but misses the progressive rendering. This is acceptable: the result is never lost, only the rendering experience.

**Question:** Can two actions on the same kernel stream simultaneously?

**Answer:** Yes. Each action invocation gets a unique `trace_id`. Stream events are tagged with the trace_id. The web shell groups events by trace_id into separate bubbles. The NATS topic is shared (`stream.{kernel}`) but the trace_id provides logical isolation.

**Gap identified:** The stream topic currently has no backpressure mechanism. A kernel with a very fast Claude response (or a runaway streaming loop) could flood NATS. For the current deployment scale (7 kernels, single users), this is not a concern. For multi-user sessions (v3.5.14), a rate limit or NATS JetStream-backed stream may be needed.
:::

## SDK Dependencies

| SDK | Language | Minimum Version |
|-----|----------|----------------|
| `claude_agent_sdk` | Python | v0.1.50+ |
| `@anthropic-ai/claude-agent-sdk` | JavaScript (npm) | v0.2.84+ |

Version-locked to Claude Code compatibility. The SDK provides the async generator interface that maps Claude's internal event stream to typed events.

## Conformance Requirements

- Kernels with LLM capability SHOULD use `claude_agent_sdk` for streaming
- Stream events MUST be published to `stream.{kernel}` topic
- Each stream event MUST carry `trace_id` for correlation
- Each stream event MUST carry `kernel_urn` for source identification
- The web shell MUST subscribe to `stream.{kernel}` and render progressive content
- Batch mode (`claude -p`) remains valid for non-streaming actions
- Handlers that do not accept `stream=` MUST continue to work unchanged
