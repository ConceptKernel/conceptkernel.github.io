---
title: Claude Streaming via NATS
description: Real-time per-token Claude output via stream.{kernel} NATS topic.
---

# Claude Streaming via NATS

## Two Invocation Modes

CKP v3.6 supports two modes for invoking Claude from within a concept kernel:

### Mode A: Batch

```python
result = subprocess.run(["claude", "-p", prompt], cwd=ck_dir,
                        capture_output=True, text=True, timeout=300)
```

Output captured as a single blob, sealed as instance, published as one `result.{kernel}` message. Simple, no streaming.

### Mode B: Streaming

```python
from claude_agent_sdk import query, ClaudeAgentOptions
async for event in query(prompt=prompt, options=ClaudeAgentOptions(...)):
    await nc.publish(f"stream.{kernel}", json.dumps(event_payload).encode())
```

Each token/event published to `stream.{kernel}` in real-time. Browser renders progressive chat bubbles.

## Event Type Mapping

Claude Agent SDK events map to NATS stream messages:

| SDK Event | NATS `type` | Content | Browser Rendering |
|-----------|-------------|---------|-------------------|
| `content_block_delta` + `text_delta` | `content_block_delta` | Cumulative text + incremental delta | Growing text bubble |
| `content_block_start` + `tool_use` | `tool_use` | Tool name + input JSON | Collapsible tool block |
| `AssistantMessage` | `AssistantMessage` | Full text from content blocks | Final bubble (removes streaming dot) |
| `ResultMessage` | `ResultMessage` | Final answer | Closes stream |
| `message_start/stop`, `ping` | (suppressed) | -- | Not rendered |

## Topic Convention

| Topic | Direction | Content |
|-------|-----------|---------|
| `input.{kernel}` | pub | User request (action + data) |
| `result.{kernel}` | sub | Final sealed result |
| `event.{kernel}` | sub | Lifecycle events |
| `stream.{kernel}` | sub | Per-token streaming events (new in v3.6) |

## SDK Dependency

```
claude_agent_sdk (Python): v0.1.50+
@anthropic-ai/claude-agent-sdk (npm): v0.2.84+
```

Version-locked to Claude Code compatibility. The SDK provides the async generator interface that maps Claude's internal event stream to typed Python/JS events.

## Architectural Significance

This bridges LOCAL (developer machine) and CLUSTER (deployed kernel):

```
LOCAL (developer)                    CLUSTER (deployed)
-----------------                    ------------------
claude CLI                           Kernel processor
  +-- claude_agent_sdk                 +-- claude_agent_sdk
       +-- stream events                    +-- stream events
            +-- stdout                           +-- NATS stream.{kernel}
                                                      +-- Browser (WSS)
```

Same SDK, same event types, same rendering. A kernel running locally streams to stdout. The same kernel deployed to cluster streams to NATS. The browser consumes both via the same `stream.{kernel}` subscription.

## Conformance

- Kernels with LLM capability SHOULD use `claude_agent_sdk` for streaming
- Stream events MUST be published to `stream.{kernel}` topic
- Each stream event MUST carry `trace_id` for correlation
- The web shell MUST subscribe to `stream.{kernel}` and render progressive content
- Batch mode (`claude -p`) remains valid for non-streaming actions
