# FocusFilter

[![Formatting passes](https://img.shields.io/github/actions/workflow/status/Asterohobit/focusfilter/format.yml?branch=main&label=Format)](https://github.com/Asterohobit/focusfilter/actions/workflows/format.yml)
[![Linting passes](https://img.shields.io/github/actions/workflow/status/Asterohobit/focusfilter/lint.yml?branch=main&label=Linting)](https://github.com/Asterohobit/focusfilter/actions/workflows/lint.yml)
[![Latest release](https://img.shields.io/github/v/release/Asterohobit/focusfilter?label=Latest%20release)](https://github.com/Asterohobit/focusfilter/releases/latest)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange?logo=firefox)](https://addons.mozilla.org/en-US/firefox/addon/focus_filter)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)](https://chromewebstore.google.com/detail/focusfilter/fkppkjpkjkfiadbkmfplgjgaiolgooei)

A Firefox/Chrome browser extension designed to block unwanted components from YouTube and Instagram.

## Features

- Master toggle plus independent key-based feature toggles in the popup
- Hide short video content
- Display website in grayscale for less dopamin
- Custom CSS selector rules with an enable switch and multiline editor

## Custom Rules

The popup includes a Custom rules section where you can enter one CSS selector per line and press Update to hide matching elements.

Example to hide the YouTube logo:

```css
ytd-topbar-logo-renderer[id="logo"]
```

## Installation

1. Clone the repository
2. Load the extension in your browser (on Firefox via `about:debugging#/runtime/firefox`) by adding a temporary Add-on and selecting `manifest.json`
3. Configure blocking preferences

## Contributing

Contributions are welcome. Please submit issues or pull requests with your improvement ideas or bug fixes.
