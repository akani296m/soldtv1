# AI Store Builder Agent - Technical Documentation

## Overview

The AI Store Builder is an internal demo tool that uses Claude Opus to help merchants build and customize their storefronts through natural language commands. This document describes the architecture, usage, and extension points.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Store Builder Agent                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   State      │    │   Prompt     │    │   Claude Opus    │  │
│  │   Manager    │◄───│   Builder    │◄───│   (LLM API)      │  │
│  └──────┬───────┘    └──────────────┘    └────────┬─────────┘  │
│         │                                          │            │
│         ▼                                          │            │
│  ┌──────────────┐                                  │            │
│  │  StoreState  │◄─────────────────────────────────┘            │
│  │    (JSON)    │         Actions[]                             │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Validator   │───►│   Executor   │───►│    Supabase      │  │
│  │              │    │              │    │    Database      │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Single Stateful LLM Orchestrator
The agent is one long-lived conversation that maintains an internal state object and emits structured commands.

### 2. Canonical StoreState Object
Claude only sees a JSON snapshot of the store, never the database directly:

```javascript
StoreState = {
  brand: {
    name: "Glow Skincare",
    category: "skincare",
    tone: "premium",
    tagline: "Radiance Redefined"
  },
  products: Product[],
  homepage: {
    hero: { headline, subheadline, cta_text, cta_link, image, layout },
    sections: Section[],
    template: string
  },
  assets: Image[],
  meta: { merchant_id, last_updated }
}
```

### 3. Fixed Action Schema
The agent can ONLY emit valid actions. If it emits anything else, it's rejected.

```javascript
Action =
  | CreateProduct
  | UpdateProduct
  | DeleteProduct
  | SetHeroHeadline
  | SetHeroSubheadline
  | SetHeroCTA
  | SetHeroImage
  | SetHeroLayout
  | AddSection
  | RemoveSection
  | UpdateSection
  | ReorderSections
  | SelectTemplate
  | SetBrandInfo
```

### 4. The Agent Loop
```javascript
while (user_input) {
  provide(StoreState + instruction)
  agent_outputs(Action[])
  validate(Action[])
  apply(Action[] → StoreState)
}
```

## File Structure

```
src/agent/
├── index.js           # Module exports
├── types.js           # Type definitions, schemas, constants
├── validator.js       # Action validation
├── stateManager.js    # State loading/serialization
├── executor.js        # Action execution
├── promptBuilder.js   # System prompt generation
└── agent.js           # Main agent class

src/hooks/
└── useAgent.js        # React hook for components

src/pages/ai-builder/
├── index.js           # Module exports
└── AIStoreBuilder.jsx # Demo UI
```

## Usage

### 1. Access the Demo
Navigate to `/ai-builder` in the admin dashboard (requires login and merchant account).

### 2. Send Instructions
Type natural language commands like:
- "Update the hero headline to something catchy for a skincare brand"
- "Add a newsletter section to the homepage"
- "Create a new product called 'Hydrating Serum' priced at R299"
- "Change the brand tone to premium"

### 3. View Results
- The chat shows Claude's thinking and explanation
- Actions are displayed with success/failure indicators
- The state inspector shows the current store state

## Configuration

### API Key
Add your Anthropic API key to `.env`:
```
VITE_ANTHROPIC_API_KEY=your-api-key-here
```

Without an API key, the agent will use mock responses for demo purposes.

### Model Configuration
The agent uses Claude Sonnet by default. For production demos, switch to Opus:

```javascript
const agent = new StoreBuilderAgent(merchantId, {
  model: 'claude-opus-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
});
```

## Action Reference

### Product Actions

| Action | Required Fields | Optional Fields |
|--------|-----------------|-----------------|
| `CreateProduct` | `title`, `price` | `description`, `category`, `inventory`, `images`, `tags`, `is_active` |
| `UpdateProduct` | `product_id` | `title`, `price`, `description`, `category`, `inventory`, `images`, `tags`, `is_active` |
| `DeleteProduct` | `product_id` | - |

### Hero Actions

| Action | Required Fields | Optional Fields |
|--------|-----------------|-----------------|
| `SetHeroHeadline` | `headline` | - |
| `SetHeroSubheadline` | `subheadline` | - |
| `SetHeroCTA` | `text` | `link` |
| `SetHeroImage` | `image_id` | - |
| `SetHeroLayout` | `layout` | - |

### Section Actions

| Action | Required Fields | Optional Fields |
|--------|-----------------|-----------------|
| `AddSection` | `section_type` | `position`, `settings` |
| `RemoveSection` | `section_id` | - |
| `UpdateSection` | `section_id`, `settings` | - |
| `ReorderSections` | `section_ids` | - |

### Brand Actions

| Action | Required Fields | Optional Fields |
|--------|-----------------|-----------------|
| `SetBrandInfo` | - | `name`, `category`, `tone`, `tagline` |

## Available Section Types

| Type | Description |
|------|-------------|
| `hero` | Full-width hero with headline, CTA, and background |
| `featured_products` | Grid of highlighted products |
| `newsletter` | Email capture section |
| `trust_badges` | Social proof indicators |
| `rich_text` | Custom text content |
| `image_banner` | Promotional image |
| `faq` | FAQ accordion |
| `announcement_bar` | Top banner for promotions |

## Brand Tones

| Tone | Description |
|------|-------------|
| `premium` | Sophisticated, luxurious, exclusive |
| `playful` | Fun, energetic, youthful |
| `minimal` | Clean, simple, focused |
| `bold` | Confident, impactful, striking |
| `warm` | Friendly, caring, personal |
| `professional` | Trustworthy, expert, reliable |

## Extending the Agent

### Adding a New Action Type

1. Add to `types.js`:
```javascript
export const ACTION_TYPES = {
  // ... existing
  NEW_ACTION: 'NewAction',
};

export const ACTION_SCHEMAS = {
  // ... existing
  [ACTION_TYPES.NEW_ACTION]: {
    type: 'object',
    required: ['field1'],
    properties: {
      field1: { type: 'string' },
    },
  },
};
```

2. Add handler to `executor.js`:
```javascript
case ACTION_TYPES.NEW_ACTION: {
  // Implementation
  mutation.success = true;
  break;
}
```

3. Add documentation to `promptBuilder.js`:
```javascript
[ACTION_TYPES.NEW_ACTION]: {
  description: 'What this action does',
  required: ['field1'],
  example: { type: 'NewAction', payload: { field1: 'value' } },
},
```

### Customizing the System Prompt

Edit `promptBuilder.js` to modify Claude's behavior, guidelines, or available context.

## Debugging

### View Raw State
In the demo UI, click "Store State" in the sidebar to see the current JSON.

### Enable Logging
The agent logs to console with `[Agent]` prefix:
- `[Agent] Initialized with state`
- `[Agent] LLM call failed`
- `[Agent] Error processing instruction`

### Validate Actions Manually
```javascript
import { validateAction } from './agent/validator';

const result = validateAction({
  type: 'SetHeroHeadline',
  payload: { headline: 'New Headline' }
});

console.log(result);
// { valid: true, errors: [], sanitized: {...} }
```

## Security Considerations

1. **API Key**: Never expose `VITE_ANTHROPIC_API_KEY` in client code in production
2. **Internal Only**: This demo is for internal use only
3. **Validation**: All actions are validated before execution
4. **Merchant Scope**: All database operations are scoped to the current merchant

## Future Enhancements

- [ ] Image generation integration
- [ ] Multi-turn conversation context
- [ ] Undo/redo action history
- [ ] Batch operations
- [ ] Template suggestion based on brand category
- [ ] A/B testing integration
