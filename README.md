# Blocker Extension

A Firefox/Chrome browser extension designed to block unwanted components from YouTube.

## Features

- Master toggle plus independent feature toggles in the popup
- Key-based YouTube feature controls:
  - `YT_SHORTS`
  - `YT_VIDEO_SIDEBAR`
  - `YT_HOMESCREEN`
  - `YT_VIDEO_ENDCARD`
- Custom CSS selector rules with an enable switch and multiline editor

## Custom Rules

The popup includes a Custom rules section where you can enter one CSS selector per line and press Update to hide matching elements.

Example to hide the YouTube logo:

```css
ytd-topbar-logo-renderer[id="logo"]
```

## Planned

- Support for additional websites

## Installation

1. Clone the repository
2. Load the extension in your browser (on Firefox via `about:debugging#/runtime/firefox`)
3. Configure blocking preferences

## Contributing

Contributions are welcome. Please submit issues or pull requests with your improvements.
