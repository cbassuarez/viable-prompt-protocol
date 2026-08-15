import{d as Ie,p as j,v as Le,P as Te,Y as Be,q as Ge,o as re,c as ne,j as be,r as ye,e as Re,N as Xe}from"./framework.Cg3BiOJh.js";const We=Array.from({length:95},(v,m)=>String.fromCharCode(32+m)).join(""),_e={radius:400,softness:.5,cell:10,aspect:.75,charset:We,colored:1,color:"#4ade80",brightness:1,legibility:1,contrast:1,exposure:1,scramble:.1,scrambleSpeed:6,edgeWidth:.2,edgeFlicker:1,edgeGlow:2,edgeTint:.75,aberration:10,passthrough:.15,threshold:.025,background:"#000000",smoothing:.2,fallbackPaint:null},Oe=64,E=8,Ye=255,Ce=[[.28,.26],[.72,.14],[.28,.56],[.72,.44],[.28,.86],[.72,.74]],qe=`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,He=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform sampler2D uShapes;
uniform vec2 uContentRes;
uniform vec2 uCellPx;
uniform int uGlyphCount;
uniform float uContrast;
uniform float uExposure;
uniform float uThreshold;
uniform vec3 uBg;

const vec2 INNER[6] = vec2[6](
  vec2(0.28, 0.26), vec2(0.72, 0.14),
  vec2(0.28, 0.56), vec2(0.72, 0.44),
  vec2(0.28, 0.86), vec2(0.72, 0.74)
);
const vec2 OUTER[10] = vec2[10](
  vec2(0.28, -0.2), vec2(0.72, -0.2),
  vec2(-0.22, 0.25), vec2(1.22, 0.25),
  vec2(-0.22, 0.5), vec2(1.22, 0.5),
  vec2(-0.22, 0.75), vec2(1.22, 0.75),
  vec2(0.28, 1.2), vec2(0.72, 1.2)
);
const vec2 RING[6] = vec2[6](
  vec2(1.0, 0.0), vec2(0.5, 0.8660254), vec2(-0.5, 0.8660254),
  vec2(-1.0, 0.0), vec2(-0.5, -0.8660254), vec2(0.5, -0.8660254)
);

vec2 cellBase;

vec4 fetchTap (vec2 p) {
  vec2 uv = p / uContentRes;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uContent, uv);
}

vec4 sampleCircle (vec2 c) {
  vec2 middle = cellBase + c * uCellPx;
  float r = uCellPx.y * 0.161;
  vec4 acc = fetchTap(middle);
  for (int k = 0; k < 6; k++) acc += fetchTap(middle + RING[k] * r);
  return acc / 7.0;
}

float tapLevel (vec4 t) {
  vec3 straight = t.rgb / max(t.a, 1e-4);
  return dot(abs(straight - uBg), vec3(0.299, 0.587, 0.114)) * t.a;
}

float circleSig (vec4 acc) {
  return clamp(tapLevel(acc) * uExposure, 0.0, 1.0);
}

float dirContrast (float value, float ext) {
  float peak = max(value, ext);
  if (peak < 1e-4) return value;
  return pow(value / peak, uContrast) * peak;
}

void main () {
  cellBase = floor(gl_FragCoord.xy) * uCellPx;
  float v[6];
  vec3 colAcc = vec3(0.0);
  float alphaAcc = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 acc = sampleCircle(INNER[i]);
    v[i] = circleSig(acc);
    colAcc += acc.rgb;
    alphaAcc += acc.a;
  }
  float e[10];
  for (int i = 0; i < 10; i++) e[i] = circleSig(sampleCircle(OUTER[i]));
  v[0] = dirContrast(v[0], max(max(e[0], e[1]), max(e[2], e[4])));
  v[1] = dirContrast(v[1], max(max(e[0], e[1]), max(e[3], e[5])));
  v[2] = dirContrast(v[2], max(e[2], max(e[4], e[6])));
  v[3] = dirContrast(v[3], max(e[3], max(e[5], e[7])));
  v[4] = dirContrast(v[4], max(max(e[4], e[6]), max(e[8], e[9])));
  v[5] = dirContrast(v[5], max(max(e[5], e[7]), max(e[8], e[9])));
  float gm[6];
  for (int i = 0; i < 6; i++) gm[i] = 0.0;
  float levSum = 0.0;
  float inkLev = 0.0;
  vec3 inkCol = vec3(0.0);
  int nx = int(clamp(uCellPx.x, 6.0, 20.0));
  int ny = int(clamp(uCellPx.y, 8.0, 32.0));
  float fx = float(nx - 1);
  float fy = float(ny - 1);
  for (int gy = 0; gy < ny; gy++) {
    for (int gx = 0; gx < nx; gx++) {
      vec2 p = vec2(float(gx) / fx, float(gy) / fy);
      vec4 t = fetchTap(cellBase + p * uCellPx);
      float lev = tapLevel(t);
      int idx = (p.y < 0.41 ? 0 : (p.y < 0.71 ? 2 : 4)) + (p.x < 0.5 ? 0 : 1);
      gm[idx] = max(gm[idx], lev);
      levSum += lev;
      if (lev > inkLev) {
        inkLev = lev;
        inkCol = t.rgb / max(t.a, 1e-4);
      }
    }
  }
  inkLev *= uExposure;
  for (int i = 0; i < 6; i++)
    v[i] = max(v[i], clamp(gm[i] * uExposure, 0.0, 1.0));
  float peak = max(max(max(v[0], v[1]), max(v[2], v[3])), max(v[4], v[5]));
  vec3 avgCol = colAcc / max(alphaAcc, 1e-4);
  if (peak < uThreshold) {
    outColor = vec4(avgCol, 0.0);
    return;
  }
  float mean = levSum * uExposure / float(nx * ny);
  float sharp = inkLev / max(mean, 1e-4);
  float solid = smoothstep(uThreshold, uThreshold * 1.6, inkLev);
  float lift = smoothstep(1.5, 3.0, sharp) * solid;
  float lifted = mix(peak, 1.0, lift);
  for (int i = 0; i < 6; i++)
    v[i] = pow(min(v[i] / max(peak, 1e-4), 1.0), uContrast) * lifted;
  vec3 cellCol = mix(avgCol, inkCol, lift);
  int best = 0;
  float bestD = 1e9;
  for (int g = 0; g < uGlyphCount; g++) {
    float d = 0.0;
    for (int i = 0; i < 6; i++) {
      float diff = v[i] - texelFetch(uShapes, ivec2(i, g), 0).r;
      d += diff * diff;
    }
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  outColor = vec4(cellCol, float(best) / 255.0);
}`,je=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform sampler2D uCells;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uCellPx;
uniform vec2 uGrid;
uniform vec2 uAtlasGrid;
uniform vec2 uAtlasPad;
uniform vec2 uAtlasInner;
uniform int uGlyphCount;
uniform vec2 uPointer;
uniform float uActive;
uniform float uRadius;
uniform float uSoftness;
uniform float uColored;
uniform vec3 uColor;
uniform float uBrightness;
uniform float uLegibility;
uniform float uScramble;
uniform float uScrambleSpeed;
uniform float uEdgeWidth;
uniform float uEdgeFlicker;
uniform float uEdgeGlow;
uniform float uEdgeTint;
uniform float uAberration;
uniform float uPassthrough;
uniform vec3 uBg;
uniform float uTime;
uniform float uMaxX;
uniform float uCrisp;

float hash (vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec4 samp (vec2 p) {
  vec2 uv = p / uRes;
  uv = clamp(uv, vec2(0.001), vec2(uMaxX - 0.001, 0.999));
  return texture(uContent, uv);
}

void main () {
  vec2 pc = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  if (pc.x > uMaxX * uRes.x) {
    outColor = vec4(0.0);
    return;
  }
  if (uCrisp > 0.5) {
    outColor = samp(pc);
    return;
  }

  float dist = length(pc - uPointer);
  float radius = max(uRadius, 1.0);
  float inner = radius * (1.0 - clamp(uSoftness, 0.02, 1.0));
  float e = (1.0 - smoothstep(inner, radius, dist)) * uActive;

  float bandW = max(radius * clamp(uEdgeWidth, 0.0, 1.0) * 0.5, 6.0);
  float bandD = dist - mix(inner, radius, 0.5);
  float ring = exp(-bandD * bandD / (2.0 * bandW * bandW)) * uActive;

  vec2 dir = (pc - uPointer) / max(dist, 1e-3);
  float ca = uAberration * ring;
  vec4 rC = samp(pc);
  vec3 real = vec3(samp(pc + dir * ca).r, rC.g, samp(pc - dir * ca).b);

  vec2 cellPos = pc * uDpr / uCellPx;
  vec2 cell = clamp(floor(cellPos), vec2(0.0), uGrid - 1.0);
  vec4 info = texelFetch(uCells, ivec2(cell), 0);
  float glyph = floor(info.a * 255.0 + 0.5);

  float rerollP = clamp(uScramble * 0.35 + ring * uEdgeFlicker, 0.0, 1.0);
  float speed = max(uScrambleSpeed, 0.001) * (1.0 + ring * 2.5);
  float ft = floor(uTime * speed);
  float swap = step(1.0 - rerollP, hash(cell * 3.3 + vec2(ft * 0.717, ft * 0.523)))
    * step(0.5, glyph);
  float pick = hash(cell + vec2(ft * 0.613, ft * 0.831));
  glyph = mix(glyph, floor(pick * float(uGlyphCount - 1)) + 1.0, swap);

  vec2 local = clamp(cellPos - cell, 0.0, 1.0);
  float gx = mod(glyph, uAtlasGrid.x);
  float gy = floor(glyph / uAtlasGrid.x);
  vec2 atlasUv = vec2(
    (gx + uAtlasPad.x + local.x * uAtlasInner.x) / uAtlasGrid.x,
    (gy + uAtlasPad.y + local.y * uAtlasInner.y) / uAtlasGrid.y
  );
  vec2 atlasStep = uAtlasInner / uAtlasGrid;
  float mask = textureGrad(
    uAtlas,
    atlasUv,
    dFdx(cellPos) * atlasStep,
    dFdy(cellPos) * atlasStep
  ).a * step(0.5, glyph);

  vec3 cellCol = info.rgb;
  vec3 lw = vec3(0.299, 0.587, 0.114);
  vec3 dev = cellCol - uBg;
  float mag = dot(abs(dev), lw);
  float target = clamp(uLegibility, 0.0, 1.0) * 0.75;
  float boost = clamp(target / max(mag, 0.01), 1.0, 32.0);
  vec3 vivid = clamp(uBg + dev * boost, 0.0, 1.0);
  float vividMag = dot(abs(vivid - uBg), lw);
  vec3 ink = mix(vec3(1.0), vec3(0.06), step(0.5, dot(uBg, lw)));
  vivid = mix(vivid, ink, clamp((target - vividMag) / max(target, 1e-3), 0.0, 1.0));
  float cellSig = clamp(mag * 1.6, 0.0, 1.0);
  vec3 mono = uColor * mix(0.35, 1.2, cellSig);
  vec3 glyphColor = mix(mono, vivid, clamp(uColored, 0.0, 1.0));
  glyphColor = clamp(uBg + (glyphColor - uBg) * uBrightness, 0.0, 1.0);
  float cellLum = dot(vivid, lw);
  glyphColor = mix(
    glyphColor,
    uColor * max(uBrightness, 1.0) * (0.6 + cellLum),
    ring * clamp(uEdgeTint, 0.0, 1.0)
  );
  glyphColor = clamp(
    uBg + (glyphColor - uBg) * (1.0 + ring * uEdgeGlow * 1.6),
    0.0,
    1.0
  );

  vec3 base = mix(uBg, real, clamp(uPassthrough, 0.0, 1.0));
  vec3 encrypted = mix(base, glyphColor, mask);
  vec3 col = mix(encrypted, real, e);
  float alpha = mix(max(rC.a, mask), rC.a, e);
  outColor = vec4(col, alpha);
}`;let S=null;function Ae(v){if(typeof document>"u")return[0,0,0];if(!S){const t=document.createElement("canvas");t.width=1,t.height=1,S=t.getContext("2d",{willReadFrequently:!0})}if(!S)return[0,0,0];S.fillStyle="#000000",S.fillStyle=v,S.clearRect(0,0,1,1),S.fillRect(0,0,1,1);const m=S.getImageData(0,0,1,1).data;return[m[0]/255,m[1]/255,m[2]/255]}function ze(v){const m=new Set([" "]),t=[" "];for(const u of v){if(t.length>=Ye)break;u===`
`||u==="\r"||u==="	"||m.has(u)||(m.add(u),t.push(u))}return t}function Ve(v,m,t,u,h){const r=new Float32Array(h*6),e=u*.26,p=t+E*2,T=u+E*2;for(let f=0;f<h;f++){const g=f%m*p+E,d=Math.floor(f/m)*T+E;for(let A=0;A<6;A++){const k=Ce[A][0]*t,F=Ce[A][1]*u;let M=0,y=0;for(let R=Math.floor(F-e);R<=Math.ceil(F+e);R++)for(let b=Math.floor(k-e);b<=Math.ceil(k+e);b++){const w=b+.5-k,U=R+.5-F;w*w+U*U>e*e||(y+=1,!(b<-E||R<-E||b>=t+E||R>=u+E)&&(M+=v.data[((d+R)*v.width+g+b)*4+3]))}r[f*6+A]=y?M/(y*255):0}}for(let f=0;f<6;f++){let g=0;for(let d=0;d<h;d++)g=Math.max(g,r[d*6+f]);if(g>0)for(let d=0;d<h;d++)r[d*6+f]/=g}return r}function Me(v){return Math.min(Math.max(v||_e.aspect,.35),1.25)}function Ke(){if(typeof document>"u")return!1;const v=document.createElement("canvas"),m=v.getContext("2d");return!!(m&&typeof m.drawElementImage=="function"&&typeof v.requestPaint=="function")}function Pe(v,m={}){const t={..._e,...m},{source:u,content:h,output:r}=v,e=r.getContext("webgl2",{alpha:!0,depth:!1,stencil:!1,antialias:!1,premultipliedAlpha:!1});if(!e||e.isContextLost())return null;const p=u.getContext("2d"),T=u,f=!!(p&&typeof p.drawElementImage=="function"&&typeof T.requestPaint=="function");let g=!1,d=!0,A=()=>{};f&&(T.onpaint=()=>{try{p.reset(),p.drawElementImage(h,0,0),g=!0,A()}catch{}});function k(n,i){const l=e.createShader(n);return e.shaderSource(l,i),e.compileShader(l),e.getShaderParameter(l,e.COMPILE_STATUS)||console.error("DecryptReveal shader error:",e.getShaderInfoLog(l)),l}function F(n){const i=k(e.VERTEX_SHADER,qe),l=k(e.FRAGMENT_SHADER,n),a=e.createProgram();e.attachShader(a,i),e.attachShader(a,l),e.linkProgram(a);const s={},o=e.getProgramParameter(a,e.ACTIVE_UNIFORMS);for(let x=0;x<o;x++){const N=e.getActiveUniform(a,x);s[N.name]=e.getUniformLocation(a,N.name)}return{program:a,vs:i,fs:l,uniforms:s}}const M=F(He),y=F(je),R=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,R),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);function b(n){const i=e.createTexture();return e.bindTexture(e.TEXTURE_2D,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),i}const w=b(e.LINEAR);e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));const U=b(e.NEAREST),z=e.createFramebuffer();let L=0,B=0;const V=b(e.NEAREST),G=e.createTexture();e.bindTexture(e.TEXTURE_2D,G),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let K=0,ie=1,le=1,$=[0,0],Q=[1,1],ce="",ue=0;function se(){const n=Me(t.aspect);if(ce===t.charset&&ue===n)return;const i=ze(t.charset),l=Oe,a=Math.max(Math.round(l*n),8),s=a+E*2,o=l+E*2,x=Math.ceil(Math.sqrt(i.length)),N=Math.ceil(i.length/x),P=document.createElement("canvas");P.width=x*s,P.height=N*o;const _=P.getContext("2d");if(!_)return;ce=t.charset,ue=n,_.clearRect(0,0,P.width,P.height),_.fillStyle="#ffffff",_.textAlign="center",_.textBaseline="middle";const ke=Math.floor(Math.min(l*.92,a/.58));_.font=`600 ${ke}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;for(let I=0;I<i.length;I++)_.fillText(i[I],I%x*s+s/2,Math.floor(I/x)*o+o/2);const Fe=_.getImageData(0,0,P.width,P.height),Ne=Ve(Fe,x,a,l,i.length);e.bindTexture(e.TEXTURE_2D,G),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,P),e.generateMipmap(e.TEXTURE_2D),e.bindTexture(e.TEXTURE_2D,V),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.R32F,6,i.length,0,e.RED,e.FLOAT,Ne),e.pixelStorei(e.UNPACK_ALIGNMENT,4),K=i.length,ie=x,le=N,$=[E/s,E/o],Q=[a/s,l/o],d=!0}let fe=1;function J(n){const i=Math.min(Math.max(t.cell,4),40)*n;return[i*Me(t.aspect),i]}function Z(){const n=Math.min(window.devicePixelRatio||1,2),i=Math.max(1,Math.round(r.clientWidth*n)),l=Math.max(1,Math.round(r.clientHeight*n));(r.width!==i||r.height!==l)&&(r.width=i,r.height=l),fe=Math.min(1,Math.max(.05,h.clientWidth/Math.max(r.clientWidth,1)));const a=Math.max(1,Math.round(r.clientWidth)),s=Math.max(1,Math.round(r.clientHeight));(u.width!==a*n||u.height!==s*n)&&(u.width=a*n,u.height=s*n),f?T.requestPaint():p&&typeof t.fallbackPaint=="function"&&(p.setTransform(1,0,0,1,0,0),p.clearRect(0,0,u.width,u.height),t.fallbackPaint(p,a,s,n),g=!0),d=!0}function Se(){const n=r.width/Math.max(r.clientWidth,1),[i,l]=J(n),a=Math.max(Math.ceil(r.width/i),1),s=Math.max(Math.ceil(r.height/l),1);a===L&&s===B||(L=a,B=s,e.bindTexture(e.TEXTURE_2D,U),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,a,s,0,e.RGBA,e.UNSIGNED_BYTE,null),e.bindFramebuffer(e.FRAMEBUFFER,z),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,U,0),e.bindFramebuffer(e.FRAMEBUFFER,null),d=!0)}const c={x:-1e5,y:-1e5,tx:-1e5,ty:-1e5,active:0,target:0};let me=0,de="",D=[0,0,0],ve="",X=[.29,.87,.5];const W=window.matchMedia("(prefers-reduced-motion: reduce)");let O=W.matches;se(),Z();function we(){g&&(g=!1,d=!0,e.bindTexture(e.TEXTURE_2D,w),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,u))}function Ue(){if(!d)return;d=!1;const n=r.width/Math.max(r.clientWidth,1),[i,l]=J(n),a=M.uniforms;e.useProgram(M.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,w),e.uniform1i(a.uContent,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,V),e.uniform1i(a.uShapes,1),e.uniform2f(a.uContentRes,r.width,r.height),e.uniform2f(a.uCellPx,i,l),e.uniform1i(a.uGlyphCount,K),e.uniform1f(a.uContrast,Math.min(Math.max(t.contrast,.3),3)),e.uniform1f(a.uExposure,Math.min(Math.max(t.exposure,.2),3)),e.uniform1f(a.uThreshold,Math.max(t.threshold,.005)),e.uniform3f(a.uBg,D[0],D[1],D[2]),e.bindFramebuffer(e.FRAMEBUFFER,z),e.viewport(0,0,L,B),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.bindFramebuffer(e.FRAMEBUFFER,null)}function De(){we(),t.background!==de&&(de=t.background,D=Ae(t.background),d=!0),t.color!==ve&&(ve=t.color,X=Ae(t.color)),se(),Se(),Ue();const n=Math.max(r.clientWidth,1),i=Math.max(r.clientHeight,1),l=r.width/n,[a,s]=J(l),o=y.uniforms;e.useProgram(y.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,w),e.uniform1i(o.uContent,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,U),e.uniform1i(o.uCells,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,G),e.uniform1i(o.uAtlas,2),e.uniform2f(o.uRes,n,i),e.uniform1f(o.uDpr,l),e.uniform2f(o.uCellPx,a,s),e.uniform2f(o.uGrid,L,B),e.uniform2f(o.uAtlasGrid,ie,le),e.uniform2f(o.uAtlasPad,$[0],$[1]),e.uniform2f(o.uAtlasInner,Q[0],Q[1]),e.uniform1i(o.uGlyphCount,K),e.uniform2f(o.uPointer,c.x,c.y),e.uniform1f(o.uActive,c.active),e.uniform1f(o.uRadius,Math.max(t.radius,1)),e.uniform1f(o.uSoftness,t.softness),e.uniform1f(o.uColored,t.colored),e.uniform3f(o.uColor,X[0],X[1],X[2]),e.uniform1f(o.uBrightness,Math.min(Math.max(t.brightness,.2),3)),e.uniform1f(o.uLegibility,Math.min(Math.max(t.legibility,0),1)),e.uniform1f(o.uScramble,Math.min(Math.max(t.scramble,0),1)),e.uniform1f(o.uScrambleSpeed,Math.min(Math.max(t.scrambleSpeed,0),30)),e.uniform1f(o.uEdgeWidth,t.edgeWidth),e.uniform1f(o.uEdgeFlicker,Math.min(Math.max(t.edgeFlicker,0),1)),e.uniform1f(o.uEdgeGlow,Math.min(Math.max(t.edgeGlow,0),3)),e.uniform1f(o.uEdgeTint,t.edgeTint),e.uniform1f(o.uAberration,Math.max(t.aberration,0)),e.uniform1f(o.uPassthrough,t.passthrough),e.uniform3f(o.uBg,D[0],D[1],D[2]),e.uniform1f(o.uTime,me),e.uniform1f(o.uMaxX,fe);const x=f||typeof t.fallbackPaint=="function";e.uniform1f(o.uCrisp,O||!x?1:0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,r.width,r.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}let ee=0,te=performance.now(),ae=!1,Y=!1,q=!0;function he(n){if(ae)return;if(!q){Y=!1;return}const i=Math.min((n-te)/1e3,1/30);te=n,me+=i;const l=Math.max(t.smoothing,1e-4),a=O?1:1-Math.exp(-i/l);c.x+=(c.tx-c.x)*a,c.y+=(c.ty-c.y)*a,c.active+=(c.target-c.active)*a,De();const s=Math.abs(c.tx-c.x)<.1&&Math.abs(c.ty-c.y)<.1&&Math.abs(c.target-c.active)<.001,o=t.scramble>0&&t.scrambleSpeed>0||c.active>.001&&t.edgeFlicker>0;if(s&&!g&&(O||!f&&typeof t.fallbackPaint!="function"||!o)){c.x=c.tx,c.y=c.ty,c.active=c.target,Y=!1;return}ee=requestAnimationFrame(he)}function C(){ae||Y||!q||(Y=!0,te=performance.now(),ee=requestAnimationFrame(he))}A=C,C();function pe(){O=W.matches,C()}W.addEventListener("change",pe);const oe=new ResizeObserver(()=>{Z(),C()});oe.observe(r),oe.observe(h);const ge=new IntersectionObserver(n=>{var i;q=((i=n[n.length-1])==null?void 0:i.isIntersecting)??!0,q&&C()});ge.observe(r);const H=r.parentElement??r;function xe(n){const i=r.getBoundingClientRect(),l=n.clientX-i.left,a=n.clientY-i.top;c.target===0&&c.active<.001&&(c.x=l,c.y=a),c.tx=l,c.ty=a,c.target=1,C()}function Ee(){c.target=0,C()}return H.addEventListener("pointermove",xe,{passive:!0}),H.addEventListener("pointerleave",Ee,{passive:!0}),{setOptions(n){let i=!1;for(const[a,s]of Object.entries(n))if(typeof s!="function"&&t[a]!==s){i=!0;break}if(!i){Object.assign(t,n);return}const l={cell:t.cell,aspect:t.aspect,contrast:t.contrast,exposure:t.exposure,threshold:t.threshold};Object.assign(t,n),(t.cell!==l.cell||t.aspect!==l.aspect||t.contrast!==l.contrast||t.exposure!==l.exposure||t.threshold!==l.threshold)&&(d=!0),C()},resize(){Z(),C()},destroy(){ae=!0,cancelAnimationFrame(ee),oe.disconnect(),ge.disconnect(),W.removeEventListener("change",pe),H.removeEventListener("pointermove",xe),H.removeEventListener("pointerleave",Ee),e.deleteTexture(w),e.deleteTexture(U),e.deleteTexture(V),e.deleteTexture(G),e.deleteFramebuffer(z),e.deleteProgram(M.program),e.deleteShader(M.vs),e.deleteShader(M.fs),e.deleteProgram(y.program),e.deleteShader(y.vs),e.deleteShader(y.fs),e.deleteBuffer(R),f&&(T.onpaint=null)}}}const $e={style:{position:"relative"}},Je=Ie({__name:"DecryptReveal",props:{radius:Number,softness:Number,cell:Number,aspect:Number,charset:String,colored:Number,color:String,brightness:Number,legibility:Number,contrast:Number,exposure:Number,scramble:Number,scrambleSpeed:Number,edgeWidth:Number,edgeFlicker:Number,edgeGlow:Number,edgeTint:Number,aberration:Number,passthrough:Number,threshold:Number,background:String,smoothing:Number,fallbackPaint:Function},setup(v){const m=v,t=j(null),u=j(null),h=j(null),r=j(!1);let e=null,p=!1;function T(){return Object.fromEntries(Object.entries(m).filter(([,f])=>f!==void 0))}return Le(async()=>{if(r.value=Ke(),await Te(),!p&&t.value&&u.value&&h.value&&(e=Pe({source:t.value,content:u.value,output:h.value},T()),r.value&&!e)){if(r.value=!1,await Te(),p)return;t.value&&u.value&&h.value&&(e=Pe({source:t.value,content:u.value,output:h.value},T()))}}),Be(()=>{p=!0,e==null||e.destroy(),e=null}),Ge(()=>({...m}),()=>e==null?void 0:e.setOptions(T()),{deep:!0}),(f,g)=>(re(),ne("div",$e,[be("canvas",{ref_key:"sourceEl",ref:t,layoutsubtree:"true",style:Xe(r.value?"position: absolute; inset: 0; width: 100%; height: 100%":"display: none")},[r.value?(re(),ne("div",{key:0,ref_key:"contentEl",ref:u,style:{position:"relative",width:"100%",height:"100%",overflow:"auto"}},[ye(f.$slots,"default")],512)):Re("",!0)],4),r.value?Re("",!0):(re(),ne("div",{key:0,ref_key:"contentEl",ref:u,style:{position:"relative",width:"100%",height:"100%",overflow:"auto"}},[ye(f.$slots,"default")],512)),be("canvas",{ref_key:"outputEl",ref:h,"aria-hidden":"true",style:{position:"absolute",inset:"0",width:"100%",height:"100%","pointer-events":"none"}},null,512)]))}});export{Je as default};
