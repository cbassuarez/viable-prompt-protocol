# Adoption — OpenAI (ChatGPT & Assistants)

- **Custom Instructions (ChatGPT):** Paste the Header Snippet. Only line 1 is parsed; later bangs are content.
- **Assistants API mapping:** *Locus* ≈ **Thread**; *Cycle step* ≈ **Run**. Use the Header Snippet as `instructions`.
- **Browsing:** enable tools; VPP requires browse & cite for external facts.
- **Footer:** append machine-readable compliance line to each assistant reply payload/log.

Quick test: send `!<g>` (line 1 only) → assistant must reply `<g>` and footer.
