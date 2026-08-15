<template>
  <main class="vpp-home">
    <section class="vpp-home-hero" aria-labelledby="vpp-home-title">
      <p class="vpp-home-eyebrow">VPP v1.5 · Skill + deterministic MCP</p>
      <h1 id="vpp-home-title">A conversation protocol agents can actually keep.</h1>
      <p class="vpp-home-lede">
        Install one portable skill. Let the deterministic MCP runtime carry tags,
        counters, cycles, loci, and validation across every turn.
      </p>
      <div class="vpp-home-actions" aria-label="Get started with VPP">
        <a class="vpp-button vpp-button--primary vpp-glass" href="/install/">
          <span>Install VPP</span>
        </a>
        <a
          class="vpp-button vpp-button--secondary vpp-glass"
          href="/install/#connect-the-remote-mcp-server"
        >
          <span>Connect MCP</span>
        </a>
        <a class="vpp-home-spec-link" href="/spec/">
          Read the v1.5 spec <span aria-hidden="true">→</span>
        </a>
      </div>
      <div class="vpp-home-hero-media" data-hero-media-slot>
        <VppAsciiIcon
          src="/canvas/vpp-mark.svg"
          alt="VPP exclamation and angle-bracket mark"
          :size="560"
          :cell-size="9"
          :charset="heroCharset"
          :fallback-ascii="heroFallback"
          :scale="4.8"
          :float-intensity="0.48"
          :rotation-intensity="0.9"
          :auto-rotate="false"
        />
      </div>
      <p class="vpp-home-hero-caption">
        One auditable state object. The same structure in local agents and cloud LLMs.
      </p>
    </section>

    <section class="vpp-home-section vpp-home-layers" aria-labelledby="vpp-layers-title">
      <p class="vpp-section-kicker">The enforced path</p>
      <h2 id="vpp-layers-title">One install. Two cooperating layers. One validated response.</h2>
      <div class="vpp-feature-grid">
        <article class="vpp-feature-card">
          <div class="vpp-feature-model vpp-feature-model--alarm">
            <VppAsciiIcon
              src="/models/alarm-clock.glb"
              alt="Rotating dithered alarm clock"
              :size="226"
              :cell-size="4"
              :cell-aspect="0.56"
              :scale="3.55"
              :roughness="0.48"
              :contrast="1.52"
              :edge-contrast="2.8"
              :exposure="1.16"
              :environment-intensity="1.25"
              :float-intensity="0.12"
              :rotation-intensity="0.22"
              :orbit="true"
              :auto-rotate="true"
              :auto-rotate-speed="0.72"
              :charset="pathModelCharset"
              :show-fallback="false"
            />
          </div>
          <p class="vpp-feature-index">01 / Skill</p>
          <h3>Portable workflow</h3>
          <p>
            The Agent Skill activates on a line-one VPP command and tells the host
            exactly when to prepare, generate, format, and validate.
          </p>
        </article>
        <article class="vpp-feature-card">
          <div class="vpp-feature-model vpp-feature-model--circuit">
            <VppAsciiIcon
              src="/models/circuit-board.glb"
              alt="Rotating dithered circuit board"
              :size="226"
              :cell-size="4"
              :cell-aspect="0.56"
              :scale="3.5"
              :roughness="0.54"
              :contrast="1.58"
              :edge-contrast="2.9"
              :exposure="1.18"
              :environment-intensity="1.28"
              :float-intensity="0.1"
              :rotation-intensity="0.18"
              :orbit="true"
              :auto-rotate="true"
              :auto-rotate-speed="-0.62"
              :charset="pathModelCharset"
              :show-fallback="false"
            />
          </div>
          <p class="vpp-feature-index">02 / Runtime</p>
          <h3>Deterministic state</h3>
          <p>
            MCP carries transparent state while pure operations advance global tag
            counters, cycles, loci, wrappers, and recovery.
          </p>
        </article>
        <article class="vpp-feature-card">
          <div class="vpp-feature-model vpp-feature-model--magnifier">
            <VppAsciiIcon
              src="/models/magnifying-glass.glb"
              alt="Rotating dithered magnifying glass"
              :size="226"
              :cell-size="4"
              :cell-aspect="0.56"
              :scale="3.45"
              :roughness="0.38"
              :contrast="1.5"
              :edge-contrast="2.75"
              :exposure="1.2"
              :environment-intensity="1.3"
              :float-intensity="0.11"
              :rotation-intensity="0.2"
              :orbit="true"
              :auto-rotate="true"
              :auto-rotate-speed="0.66"
              :charset="pathModelCharset"
              :show-fallback="false"
            />
          </div>
          <p class="vpp-feature-index">03 / Guardrail</p>
          <h3>Validation before return</h3>
          <p>
            Structural drift is reported or repaired before the response reaches
            the conversation. The model stays focused on the body.
          </p>
        </article>
      </div>
    </section>

    <section class="vpp-home-section vpp-protocol-preview" aria-labelledby="vpp-loop-title">
      <div class="vpp-protocol-preview__copy">
        <p class="vpp-section-kicker">A visible protocol loop</p>
        <h2 id="vpp-loop-title">The model writes content. The runtime commits structure.</h2>
        <p>
          Move across the panel to reveal the exchange. On browsers without the
          experimental canvas API, the same content stays crisp and fully usable.
        </p>
      </div>
      <VppDecryptPanel>
        <div class="vpp-pipeline-card">
          <div class="vpp-pipeline-card__bar">
            <span>TURN / 04</span>
            <span class="vpp-status-dot">validated</span>
          </div>
          <ol class="vpp-pipeline" aria-label="VPP response pipeline">
            <li><code>!&lt;g&gt;</code><span>User command</span></li>
            <li><code>vpp_prepare_turn</code><span>Contract + state</span></li>
            <li><code>model body</code><span>Content only</span></li>
            <li><code>vpp_format_response</code><span>Exact wrapper</span></li>
            <li><code>vpp_validate_exchange</code><span>Return safely</span></li>
          </ol>
        </div>
      </VppDecryptPanel>
    </section>

    <section class="vpp-home-section vpp-install-panel" aria-labelledby="vpp-install-title">
      <div>
        <p class="vpp-section-kicker">Install today</p>
        <h2 id="vpp-install-title">Start with the complete skill + MCP path.</h2>
        <p>
          The plugin keeps the portable skill, production MCP connection, generated
          v1.5 references, and offline fallback together as one versioned install.
        </p>
      </div>
      <div class="vpp-install-options">
        <article class="vpp-install-option vpp-install-option--recommended">
          <span class="vpp-install-badge">Recommended</span>
          <h3>Install the VPP plugin</h3>
          <p>Best for Codex, ChatGPT desktop, and plugin-compatible agent hosts.</p>
          <a class="vpp-button vpp-button--primary vpp-glass" href="/install/">
            <span>Open install guide</span>
          </a>
        </article>
        <article class="vpp-install-option">
          <span class="vpp-install-badge">Remote</span>
          <h3>Connect the MCP directly</h3>
          <p>Best when your host already supports public Streamable HTTP MCP.</p>
          <a
            class="vpp-button vpp-button--secondary vpp-glass"
            href="/install/#connect-the-remote-mcp-server"
          >
            <span>Open MCP setup</span>
          </a>
        </article>
      </div>
    </section>

    <section class="vpp-home-section vpp-home-spec">
      <p>Building a host adapter or reviewing the protocol?</p>
      <a href="/spec/">Read the normative VPP v1.5 specification <span aria-hidden="true">→</span></a>
    </section>
  </main>
</template>

<script setup lang="ts">
import VppAsciiIcon from './VppAsciiIcon.vue';
import VppDecryptPanel from './VppDecryptPanel.vue';

const heroCharset = ' .,:;irsXA253hMHGS#9B&@';
const pathModelCharset = ' .,:;+=xX#@';
const heroFallback = `!!!!!             <<<<<
!!!!!         <<<<<
!!!!!     <<<<<
!!!!!         <<<<<
!!!!!             <<<<<

!!!!!`;
</script>
