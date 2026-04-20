# Blocker Extension

A Firefox/Chrome browser extension designed to block unwanted content.

## Features

- Master toggle plus independent feature toggles in the popup
- Key-based YouTube feature controls:
  - `YT_SHORTS`
  - `YT_VIDEO_SIDEBAR`
  - `YT_HOMESCREEN`
  - `YT_VIDEO_ENDCARD`
- Rule-to-key mapping with multi-key support (OR semantics)
- Hybrid blocking model:
  - Static scoped CSS rules in `styles.css`
  - Minimal JS runtime for dynamic edge cases

## Planned

- Support for additional websites

## Installation

1. Clone the repository
2. Load the extension in your browser (on Firefox via `about:debugging#/runtime/firefox`)
3. Configure blocking preferences

## Contributing

Contributions are welcome. Please submit issues or pull requests with your improvements.
