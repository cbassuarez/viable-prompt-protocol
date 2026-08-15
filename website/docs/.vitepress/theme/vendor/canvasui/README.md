# Canvas UI vendored components

This directory contains the Vue wrappers and deterministic vanilla
implementations of ASCII Object, Glass Object, and Decrypt Reveal from
[Canvas UI](https://canvasui.dev/).

Source commit: `2dd45d70394b890a8130740061cdcc957e89dc35`

The files are included as part of the Viable Prompt Protocol website under the
adjacent `LICENSE.md`. Do not publish or redistribute them as a standalone
component package.

The three Vue wrappers use explicit runtime prop declarations for VitePress
SSR compatibility. Local integration patches add Decrypt Reveal's static
canvas fallback, replace a deprecated Three.js SVG helper, and cap the Glass
Object environment blur for the installed Three.js release. The shaders,
scene construction, and public component options remain sourced from the
pinned commit.
