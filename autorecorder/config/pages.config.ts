/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 3
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per doc page, in the order the doc nav lists them.
 *
 * Everything here mirrors `frontend/src/app/lib/nav-config.ts`, the app's single
 * source of truth for route -> doc-page mapping.
 *
 * All prompts and test interactions are derived from each page's <ui-try-it> block.
 */

import { definePages } from '../core/types';

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: 'quickstart',
    ideFile: 'frontend/VERSIONS.md',
    startLine: 6,
    endLine: 20,
    extraTabs: [
      {
        filePath: 'frontend/package.json',
        startLine: 19,
        endLine: 37,
      },
      {
        filePath: 'frontend/src/app/features/quickstart/quickstart-chat.ts',
        startLine: 8,
        endLine: 20,
      },
      { filePath: 'frontend/server.ts', startLine: 21, endLine: 48 },
      { filePath: 'backend/main.py', startLine: 39, endLine: 57 },
    ],
    // Try it: "Open the demo and send Can you tell me a joke?"
    prompt: 'Can you tell me a joke?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'chat-ui',
    name: 'Guides - Chat UI and customization',
    videoName: 'ChatUi',
    docPath: 'guides/chat-ui',
    route: 'chat-ui',
    ideFile: 'frontend/src/app/features/chat-ui/chat-ui-demo.component.ts',
    startLine: 28,
    endLine: 56,
    extraTabs: [
      {
        filePath:
          'frontend/src/app/features/chat-ui/custom-assistant-message.component.ts',
        startLine: 13,
        endLine: 25,
      },
    ],
    // Try it: "Open the demo, send What is CopilotKit? on the Inline chat tab, then walk the other three."
    prompt: 'What is CopilotKit?',
    prompts: [
      'What is CopilotKit?',
      'Nice layout. What is different about how you are rendered here?',
    ],
    waitAfterPromptMs: 4000,
  },
  {
    id: 'frontend-tools-generative-ui',
    name: 'Guides - Frontend tools and generative UI',
    videoName: 'FrontendToolsGenerativeUi',
    docPath: 'guides/frontend-tools-generative-ui',
    route: 'frontend-tools-generative-ui',
    ideFile: 'frontend/src/app/features/tools/tools-chat.component.ts',
    startLine: 35,
    endLine: 65,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/tools/weather-card.component.ts',
        startLine: 10,
        endLine: 27,
      },
      {
        filePath: 'frontend/src/app/features/tools/incident-card.component.ts',
        startLine: 10,
        endLine: 27,
      },
    ],
    // Try it: "Send What's the weather in Tokyo?, then Change the background to violet, then Show me incident INC-4711 at sev1"
    prompt: "What's the weather in Tokyo?",
    prompts: [
      "What's the weather in Tokyo?",
      'Change the background to violet',
      'Show me incident INC-4711 at sev1',
    ],
    waitAfterPromptMs: 4000,
  },
  {
    id: 'a2ui',
    name: 'Guides - A2UI schemas, styling, and recovery',
    videoName: 'A2ui',
    docPath: 'guides/a2ui',
    route: 'a2ui',
    ideFile: 'frontend/src/app/features/a2ui/a2ui-chat.component.ts',
    startLine: 10,
    endLine: 22,
    extraTabs: [
      { filePath: 'frontend/server.ts', startLine: 36, endLine: 48 },
      { filePath: 'frontend/src/app/app.config.ts', startLine: 43, endLine: 65 },
    ],
    // Try it: "Open the demo and ask for something with structure, e.g. Show me a card comparing two flight options."
    prompt: 'Show me a card comparing two flight options.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'voice-multimodal',
    name: 'Guides - Voice and multimodal input',
    videoName: 'VoiceMultimodal',
    docPath: 'guides/voice-multimodal',
    route: 'voice-multimodal',
    ideFile: 'frontend/src/app/features/media/voice-chat.component.ts',
    startLine: 10,
    endLine: 27,
    // Try it: "Attach a PNG or a PDF with the paperclip, by dragging it onto the composer, or by pasting it. Then press the microphone."
    prompt: 'Have a look at the chart I attached. What is it titled, and what does Q4 come to?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'human-in-the-loop',
    name: 'Guides - Human-in-the-loop and interrupts',
    videoName: 'HumanInTheLoop',
    docPath: 'guides/human-in-the-loop',
    route: 'human-in-the-loop',
    ideFile: 'frontend/src/app/features/hitl/approval-tools.service.ts',
    startLine: 13,
    endLine: 26,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/hitl/approval-card.component.ts',
        startLine: 16,
        endLine: 39,
      },
    ],
    // Try it: "Open the demo and send Delete my account, but ask me to approve it first."
    prompt: 'Delete my account, but ask me to approve it first.',
    prompts: [
      'Delete my account, but ask me to approve it first.',
      'Yes, delete my account.',
      'Yes, go ahead.',
    ],
    waitAfterPromptMs: 4000,
  },
  {
    id: 'shared-state',
    name: 'Guides - Shared state and agent context',
    videoName: 'SharedState',
    docPath: 'guides/shared-state',
    route: 'shared-state',
    ideFile: 'frontend/src/app/features/shared-state/workspace.component.ts',
    startLine: 19,
    endLine: 48,
    extraTabs: [
      {
        filePath:
          'frontend/src/app/features/shared-state/account-context.component.ts',
        startLine: 9,
        endLine: 31,
      },
      {
        filePath:
          'frontend/src/app/features/shared-state/selection-context.component.ts',
        startLine: 9,
        endLine: 20,
      },
    ],
    // Try it: "Press Mark high priority, then ask What is my current priority and what notes do I have?, What is my name?, What is my timezone?, then Use London time and ask What timezone am I in, and which record am I looking at?"
    prompt: 'What is my current priority and what notes do I have?',
    prompts: [
      'What is my current priority and what notes do I have?',
      'What is my name?',
      'What is my timezone?',
      'What timezone am I in, and which record am I looking at?',
    ],
    waitAfterPromptMs: 4000,
  },
  {
    id: 'webmcp',
    name: 'WebMCP',
    videoName: 'Webmcp',
    docPath: 'webmcp',
    route: 'webmcp',
    ideFile: 'frontend/src/app/features/webmcp/order-search.component.ts',
    startLine: 1,
    endLine: 40,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/webmcp/search-orders.ts',
        startLine: 1,
        endLine: 28,
      },
      {
        filePath: 'frontend/src/app/features/webmcp/webmcp-chat.component.ts',
        startLine: 15,
        endLine: 41,
      },
    ],
    // Try it: "Open the demo and send Which of my orders are still open?"
    prompt: 'Which of my orders are still open?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'threads',
    name: 'Threads',
    videoName: 'Threads',
    docPath: 'guides/threads-memory-attachments-headless',
    route: 'threads',
    ideFile: 'frontend/src/app/features/threads/thread-list.component.ts',
    startLine: 8,
    endLine: 40,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/threads/threads-demo.component.ts',
        startLine: 10,
        endLine: 35,
      },
    ],
    // Try it: "Open the demo and look at both surfaces. Unlicensed: locked state..."
    prompt: 'In one line, what are threads for?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'memory',
    name: 'Memory',
    videoName: 'Memory',
    docPath: 'guides/threads-memory-attachments-headless',
    route: 'memory',
    ideFile: 'frontend/src/app/features/memory/memory-list.component.ts',
    startLine: 9,
    endLine: 39,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/memory/memory-demo.component.ts',
        startLine: 1,
        endLine: 29,
      },
    ],
    // Try it: "Open the demo and read the left panel. Pass (this runtime): Memory is not available for this runtime."
    prompt: 'What can you remember about me?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'attachments',
    name: 'Attachments',
    videoName: 'Attachments',
    docPath: 'guides/threads-memory-attachments-headless',
    route: 'attachments',
    ideFile: 'frontend/src/app/features/attachments/media-chat.component.ts',
    startLine: 9,
    endLine: 23,
    // Try it: "Open the demo and add a file three ways: picker, drag-and-drop, paste. Then send a message asking about it."
    prompt: 'Have a look at the attached file. What is it?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'headless',
    name: 'Headless UI',
    videoName: 'HeadlessUi',
    docPath: 'guides/threads-memory-attachments-headless',
    route: 'headless',
    ideFile: 'frontend/src/app/features/headless/headless-chat.component.ts',
    startLine: 10,
    endLine: 60,
    // Try it: "Open the demo, type into the bare textarea, and press Send."
    prompt: 'Tell me a short joke about Angular developers.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'auth',
    name: 'Authentication',
    videoName: 'Auth',
    docPath: 'auth',
    route: 'auth',
    ideFile: 'frontend/src/app/features/auth/auth-demo.component.ts',
    startLine: 17,
    endLine: 48,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/auth/auth-card.ts',
        startLine: 16,
        endLine: 60,
      },
      { filePath: 'frontend/server.ts', startLine: 78, endLine: 100 },
    ],
    // Try it: "Press Sign in, and send Hello."
    prompt: 'Hello',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'subagents',
    name: 'Sub-agents',
    videoName: 'Subagents',
    docPath: 'multi-agent/subagents',
    route: 'subagents',
    ideFile: 'frontend/src/app/features/subagents/subagents-chat.component.ts',
    startLine: 25,
    endLine: 50,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/subagents/subagent-cards.ts',
        startLine: 1,
        endLine: 50,
      },
      { filePath: 'backend/subagents/main.py', startLine: 1, endLine: 27 },
    ],
    // Try it: "send Research, write, and critique a short paragraph on solar panels."
    prompt: 'Research, write, and critique a short paragraph on solar panels.',
    waitAfterPromptMs: 4000,
  },
]);
