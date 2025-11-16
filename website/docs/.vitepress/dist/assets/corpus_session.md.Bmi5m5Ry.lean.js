import{_ as S,c as B,o as M,j as g}from"./chunks/framework.FAYkJyE3.js";(async function(){if(typeof window>"u")return;const r=new URLSearchParams(window.location.search).get("id"),f=document.getElementById("session-viewer-meta"),h=document.getElementById("session-viewer-error"),a=document.getElementById("session-viewer-turns");function l(e){h?h.textContent=e:alert(e)}if(!r){l("Missing ?id=… query parameter.");return}const w="{{ '/corpus/v1.4/sessions' | relative_url }}".replace(/\/$/,"")+"/"+encodeURIComponent(r)+".json";try{const e=await fetch(w,{cache:"no-store"});if(!e.ok){l("Session not found ("+e.status+"): "+w);return}const n=await e.json();_(n),x(n)}catch(e){console.error(e),l("Failed to load session: "+(e.message||String(e)))}function _(e){if(!f)return;const n=e.meta||{},i=e.label||"unknown",o=n.challenge_type||"unknown",p=n.condition||"unknown",d=n.created_at||"n/a",u=n.model||"unknown",m=n.provider||"unknown",$=i==="good"?"session-badge-good":"session-badge-bad";f.innerHTML=`
        <div class="session-meta-header">
          <div>
            <div class="session-meta-id"><code>${s(e.id||"")}</code></div>
            <div class="session-meta-row">
              <span class="session-badge ${$}">${s(i)}</span>
              <span class="session-badge session-badge-ct">${s(o)}</span>
              <span class="session-badge session-badge-cond">${s(p)}</span>
            </div>
          </div>
          <div class="session-meta-right">
            <div><strong>Model:</strong> <code>${s(u)}</code></div>
            <div><strong>Provider:</strong> <code>${s(m)}</code></div>
            <div><strong>Created:</strong> <time datetime="${s(d)}">${s(d)}</time></div>
            <div>
              <a href="${s(w)}" target="_blank" rel="noopener">Raw JSON</a>
            </div>
          </div>
        </div>
      `}function x(e){if(!a)return;const n=Array.isArray(e.turns)?e.turns:[];if(n.length===0){a.textContent="No turns in this session.";return}const i=document.createDocumentFragment();for(const o of n){const p=o.role||"unknown",d=o.tag||null,u=Array.isArray(o.modifiers)?o.modifiers:[],m=o.raw_header||"",$=o.body||"",C=o.footer||"",k=o.turn_index??"?",v=document.createElement("article");v.className="session-turn session-turn-"+(p==="assistant"?"assistant":"user");const b=document.createElement("header");b.className="session-turn-header";const N=p==="assistant"?"Assistant":"User";b.innerHTML=`
          <div class="session-turn-title">
            <span class="session-turn-role">${N}</span>
            <span class="session-turn-index">#${k}</span>
            ${d?`<span class="session-turn-tag">tag: &lt;${s(d)}&gt;</span>`:""}
          </div>
          ${u.length?`<div class="session-turn-mods">${u.map(t=>`<span class="session-mod-chip">${s(t)}</span>`).join(" ")}</div>`:""}
        `;const c=document.createElement("div");if(c.className="session-turn-body-wrapper",m){const t=document.createElement("pre");t.className="session-code session-code-header",t.textContent=m,c.appendChild(t)}const y=document.createElement("pre");if(y.className="session-code session-code-body",y.textContent=$,c.appendChild(y),C){const t=document.createElement("pre");t.className="session-code session-code-footer",t.textContent=C,c.appendChild(t)}v.appendChild(b),v.appendChild(c),i.appendChild(v)}a.innerHTML="",a.appendChild(i)}function s(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}})();const I=JSON.parse('{"title":"Corpus Session Viewer","description":"","frontmatter":{"layout":"page","title":"Corpus Session Viewer","permalink":"/corpus/session/","nav_exclude":true},"headers":[],"relativePath":"corpus/session.md","filePath":"corpus/session.md","lastUpdated":1763286783000}'),A={name:"corpus/session.md"};function L(E,r,f,h,a,l){return M(),B("div",null,[...r[0]||(r[0]=[g("div",{id:"session-viewer-root",class:"session-viewer-root"},[g("div",{id:"session-viewer-meta",class:"session-viewer-meta"}),g("div",{id:"session-viewer-error",class:"session-viewer-error",role:"alert"}),g("div",{id:"session-viewer-turns",class:"session-viewer-turns"})],-1)])])}const P=S(A,[["render",L]]);export{I as __pageData,P as default};
