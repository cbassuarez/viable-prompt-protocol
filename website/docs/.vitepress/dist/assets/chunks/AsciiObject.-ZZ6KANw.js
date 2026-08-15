import{W as ot,A as nt,S as te,P as at,G as ce,O as st,a as Re,b as Ve,N as Ee,c as Le,d as Ie,C as Pe,V as D,e as Oe,B as rt,f as qe,M as z,g as it,h as ct,D as lt,i as ut,j as fe,k as Be,l as Xe,L as ft,m as dt,n as De,o as ht,R as pt,F as mt,T as vt,p as gt,E as wt,q as de,r as Ge,s as xt,t as Fe,u as Te,v as yt,w as bt,x as Ct,y as St,z as At}from"./GLTFLoader.CcrXYWSm.js";import{d as Mt,p as kt,v as Rt,Y as Et,q as Lt,o as It,c as Pt,j as Ot}from"./framework.Cg3BiOJh.js";const Bt=Array.from({length:95},(t,s)=>String.fromCharCode(32+s)).join(""),Dt={src:"",ascii:!0,cellSize:10,cellAspect:.6,charset:Bt,colored:!0,color:"#ffffff",contrast:1.5,edgeContrast:3,exposure:1,invert:!1,background:"",highlight:"#066aff",environmentIntensity:1,roughness:-1,scale:3,xOffset:0,yOffset:0,floatIntensity:2,rotationIntensity:1,floatSpeed:2,orbit:!0,zoom:!1,autoRotate:!1,autoRotateSpeed:2,fov:65,cameraDistance:4.2,dracoDecoderPath:"https://www.gstatic.com/draco/versioned/decoders/1.5.7/",onLoad:null,onError:null},Ne=`
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,Ye=`
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
`,Gt=`
precision highp float;
out vec4 outColor;
uniform sampler2D tScene;
uniform sampler2D tShapes;
uniform vec2 uResolution;
uniform vec2 uCellPx;
uniform int uGlyphCount;
uniform float uContrast;
uniform float uEdgeContrast;
uniform float uExposure;
uniform float uInvert;
${Ye}
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
vec4 fetchTap(vec2 p) {
  vec2 uv = p / uResolution;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(tScene, uv);
}
vec4 sampleCircle(vec2 c) {
  vec2 middle = cellBase + vec2(c.x, 1.0 - c.y) * uCellPx;
  float r = uCellPx.y * 0.161;
  vec4 acc = fetchTap(middle);
  for (int k = 0; k < 6; k++) acc += fetchTap(middle + RING[k] * r);
  return acc / 7.0;
}
float circleLum(vec4 acc) {
  vec3 straight = toSrgb(acc.rgb / max(acc.a, 1e-4));
  float level = clamp(dot(straight, vec3(0.2126, 0.7152, 0.0722)) * uExposure, 0.0, 1.0);
  level = mix(level, 1.0 - level, uInvert);
  return level * acc.a;
}
float dirContrast(float value, float ext) {
  float peak = max(value, ext);
  if (peak < 1e-4) return value;
  return pow(value / peak, uEdgeContrast) * peak;
}
void main() {
  cellBase = floor(gl_FragCoord.xy) * uCellPx;
  float v[6];
  vec3 colAcc = vec3(0.0);
  float alphaAcc = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 acc = sampleCircle(INNER[i]);
    v[i] = circleLum(acc);
    colAcc += acc.rgb;
    alphaAcc += acc.a;
  }
  float e[10];
  for (int i = 0; i < 10; i++) e[i] = circleLum(sampleCircle(OUTER[i]));
  v[0] = dirContrast(v[0], max(max(e[0], e[1]), max(e[2], e[4])));
  v[1] = dirContrast(v[1], max(max(e[0], e[1]), max(e[3], e[5])));
  v[2] = dirContrast(v[2], max(e[2], max(e[4], e[6])));
  v[3] = dirContrast(v[3], max(e[3], max(e[5], e[7])));
  v[4] = dirContrast(v[4], max(max(e[4], e[6]), max(e[8], e[9])));
  v[5] = dirContrast(v[5], max(max(e[5], e[7]), max(e[8], e[9])));
  float peak = max(max(max(v[0], v[1]), max(v[2], v[3])), max(v[4], v[5]));
  if (peak > 1e-4) {
    for (int i = 0; i < 6; i++) v[i] = pow(v[i] / peak, uContrast) * peak;
  }
  int best = 0;
  float bestD = 1e9;
  for (int g = 0; g < uGlyphCount; g++) {
    float d = 0.0;
    for (int i = 0; i < 6; i++) {
      float diff = v[i] - texelFetch(tShapes, ivec2(i, g), 0).r;
      d += diff * diff;
    }
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  vec3 cellColor = toSrgb(colAcc / max(alphaAcc, 1e-4));
  outColor = vec4(cellColor, float(best) / 255.0);
}`,Ft=`
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D tScene;
uniform sampler2D tCells;
uniform sampler2D tAtlas;
uniform vec2 uResolution;
uniform vec2 uCellPx;
uniform vec2 uGrid;
uniform vec2 uAtlasGrid;
uniform vec2 uAtlasPad;
uniform vec2 uAtlasInner;
uniform float uAscii;
uniform float uColored;
uniform vec3 uColor;
uniform vec3 uBackground;
uniform float uHasBg;
${Ye}
void main() {
  if (uAscii < 0.5) {
    vec4 raw = texture(tScene, vUv);
    vec3 rawColor = toSrgb(raw.rgb);
    if (uHasBg > 0.5) {
      outColor = vec4(uBackground * (1.0 - raw.a) + rawColor, 1.0);
    } else {
      outColor = vec4(rawColor * raw.a, raw.a);
    }
    return;
  }
  vec2 fragCoord = vUv * uResolution;
  vec2 cellPos = fragCoord / uCellPx;
  vec2 cell = clamp(floor(cellPos), vec2(0.0), uGrid - 1.0);
  vec4 info = texelFetch(tCells, ivec2(cell), 0);
  float glyph = floor(info.a * 255.0 + 0.5);
  vec2 local = clamp(cellPos - cell, 0.0, 1.0);
  float gx = mod(glyph, uAtlasGrid.x);
  float gy = floor(glyph / uAtlasGrid.x);
  vec2 atlasUv = vec2(
    (gx + uAtlasPad.x + local.x * uAtlasInner.x) / uAtlasGrid.x,
    (uAtlasGrid.y - gy - 1.0 + uAtlasPad.y + local.y * uAtlasInner.y) /
      uAtlasGrid.y
  );
  vec2 atlasStep = uAtlasInner / uAtlasGrid;
  float mask = textureGrad(
    tAtlas,
    atlasUv,
    dFdx(cellPos) * atlasStep,
    dFdy(cellPos) * atlasStep
  ).a;
  vec3 glyphColor = mix(uColor, info.rgb, uColored);
  if (uHasBg > 0.5) {
    outColor = vec4(mix(uBackground, glyphColor, mask), 1.0);
  } else {
    outColor = vec4(glyphColor * mask, mask);
  }
}`,Tt=[{position:[-10.906,-1,1.846],rotation:[0,-.195,0],scale:[2.328,7.905,4.651]},{position:[-5.607,-.754,-.758],rotation:[0,.994,0],scale:[1.97,1.534,3.955]},{position:[6.167,-.16,7.803],rotation:[0,.561,0],scale:[3.927,6.285,3.687]},{position:[-2.017,.018,6.124],rotation:[0,.333,0],scale:[2.002,4.566,2.064]},{position:[2.291,-.756,-2.621],rotation:[0,-.286,0],scale:[1.546,1.552,1.496]},{position:[-2.193,-.369,-5.547],rotation:[0,.516,0],scale:[3.875,3.487,2.986]}],Nt=[{kind:"ring",intensity:15,position:[2,3,-2],scale:[10,10,10],lookAtCenter:!0},{kind:"box",intensity:80,position:[-14,10,8],scale:[.1,2.5,2.5]},{kind:"box",intensity:80,position:[-14,14,-4],scale:[.1,2.5,2.5],withLight:!0},{kind:"box",intensity:23,position:[14,12,0],scale:[.1,5,5],withLight:!0},{kind:"box",intensity:16,position:[0,9,14],scale:[5,5,.1],withLight:!0},{kind:"box",intensity:80,position:[7,8,-14],scale:[2.5,2.5,.1],withLight:!0},{kind:"box",intensity:80,position:[-7,16,-14],scale:[2.5,2.5,.1],withLight:!0},{kind:"box",intensity:1,position:[0,20,0],scale:[.1,.1,.1],withLight:!0},{kind:"box",intensity:20,position:[0,15,0],scale:[10,1,10],withLight:!0}],_e=new fe(0,-1,4).normalize(),le=.3,q=2048,_t=512,Ut=127,jt=1,zt=6,Wt=64,Ht=.08,Ue=.006,Vt=64,O=8,qt=255,je=[[.28,.26],[.72,.14],[.28,.56],[.72,.44],[.28,.86],[.72,.74]];function ze(t){return Math.min(Math.max(t||.6,.35),1.25)}function Xt(t){const s=new Set([" "]),n=[" "];for(const e of t){if(n.length>=qt)break;e===`
`||e==="\r"||e==="	"||s.has(e)||(s.add(e),n.push(e))}return n}function Yt(t,s,n,e,o){const l=new Float32Array(o*6),d=e*.26,c=n+O*2,m=e+O*2;for(let x=0;x<o;x++){const a=x%s*c+O,i=Math.floor(x/s)*m+O;for(let g=0;g<6;g++){const S=je[g][0]*n,u=je[g][1]*e;let h=0,M=0;for(let k=Math.floor(u-d);k<=Math.ceil(u+d);k++)for(let r=Math.floor(S-d);r<=Math.ceil(S+d);r++){const v=r+.5-S,C=k+.5-u;v*v+C*C>d*d||(M+=1,!(r<-O||k<-O||r>=n+O||k>=e+O)&&(h+=t.data[((i+k)*t.width+a+r)*4+3]))}l[x*6+g]=M?h/(M*255):0}}for(let x=0;x<6;x++){let a=0;for(let i=0;i<o;i++)a=Math.max(a,l[i*6+x]);if(a>0)for(let i=0;i<o;i++)l[i*6+x]/=a}return l}function Zt(t){if(t.length<4)return null;const s=(e,o)=>{for(let l=0;l<o.length;l++)if(t[e+l]!==o.charCodeAt(l))return!1;return!0};if(s(0,"glTF"))return"glb";if(t[0]===137&&s(1,"PNG")||t[0]===255&&t[1]===216||s(0,"RIFF")&&s(8,"WEBP")||s(0,"GIF8"))return"bitmap";let n="";try{n=new TextDecoder().decode(t.subarray(0,2048)).replace(/^\uFEFF/,"").trimStart()}catch{return null}return n.startsWith("{")?"gltf":n.startsWith("<")&&n.includes("<svg")?"svg":null}function Ze(t,s){const n=document.createElement("canvas");return n.width=Math.max(1,Math.round(t)),n.height=Math.max(1,Math.round(s)),n}function he(t,s,n){const e=Ze(s,n),o=e.getContext("2d");if(!o)throw new Error("2d context unavailable");return o.drawImage(t,0,0,e.width,e.height),e}function $t(t){return new Promise((s,n)=>{const e=URL.createObjectURL(t),o=new Image;o.onload=()=>{URL.revokeObjectURL(e),s(o)},o.onerror=()=>{URL.revokeObjectURL(e),n(new Error("Could not decode the image"))},o.src=e})}async function Kt(t){if(typeof createImageBitmap!="function")return null;try{const s=await createImageBitmap(t),n=Math.max(s.width,s.height,1),e=Math.min(1,q/n),o=he(s,s.width*e,s.height*e);return s.close(),o}catch{return null}}async function Qt(t,s){const n=s==="svg";if(!n){const m=await Kt(t);if(m)return m}const e=await $t(t),o=e.naturalWidth||q,l=e.naturalHeight||q,d=Math.max(o,l,1),c=n?q/d:Math.min(1,q/d);return he(e,o*c,l*c)}function Jt(t,s,n){const e=[];for(let a=0;a<n-1;a++)for(let i=0;i<s-1;i++){const g=a*s+i,S=t[g]|t[g+1]<<1|t[g+s+1]<<2|t[g+s]<<3;if(S===0||S===15)continue;const u=i+.5,h=a+.5;switch(S){case 1:case 14:e.push(i,h,u,a);break;case 2:case 13:e.push(u,a,i+1,h);break;case 3:case 12:e.push(i,h,i+1,h);break;case 4:case 11:e.push(i+1,h,u,a+1);break;case 6:case 9:e.push(u,a,u,a+1);break;case 7:case 8:e.push(i,h,u,a+1);break;case 5:e.push(i,h,u,a,i+1,h,u,a+1);break;default:e.push(u,a,i+1,h,i,h,u,a+1);break}}const o=e.length/4,l=s*2+1,d=new Map,c=a=>e[a*2+1]*2*l+e[a*2]*2;for(let a=0;a<o;a++)for(const i of[a*2,a*2+1]){const g=c(i),S=d.get(g);S?S.push(a):d.set(g,[a])}const m=new Uint8Array(o),x=[];for(let a=0;a<o;a++){if(m[a])continue;const i=[];let g=a,S=e[a*4],u=e[a*4+1];for(;g>=0&&!m[g];){m[g]=1;const h=g*4,M=e[h]===S&&e[h+1]===u;S=M?e[h+2]:e[h],u=M?e[h+3]:e[h+1],i.push(S,u);const k=d.get(u*2*l+S*2);let r=-1;if(k){for(const v of k)if(!m[v]){r=v;break}}g=r}i.length>=8&&x.push(i)}return x}function eo(t,s){const n=t.length/2;if(n<4)return t;const e=new Uint8Array(n);e[0]=1,e[n-1]=1;const o=[0,n-1],l=s*s;for(;o.length;){const c=o.pop(),m=o.pop();if(c-m<2)continue;const x=t[m*2],a=t[m*2+1],i=t[c*2]-x,g=t[c*2+1]-a,S=i*i+g*g;let u=-1,h=l;for(let M=m+1;M<c;M++){const k=t[M*2]-x,r=t[M*2+1]-a,v=S>0?(k*i+r*g)/S:0,C=v<0?0:v>1?1:v,G=k-i*C,W=r-g*C,L=G*G+W*W;L>h&&(u=M,h=L)}u<0||(e[u]=1,o.push(m,u,u,c))}const d=[];for(let c=0;c<n;c++)e[c]&&d.push(t[c*2],t[c*2+1]);return d}function We(t){let s=0;for(let n=0,e=t.length-2;n<t.length;e=n,n+=2)s+=(t[e]-t[n])*(t[e+1]+t[n+1]);return Math.abs(s)/2}function He(t,s,n){let e=!1;for(let o=0,l=t.length-2;o<t.length;l=o,o+=2){const d=t[o+1],c=t[l+1];if(d>n==c>n)continue;const m=(n-d)/(c-d);s<t[o]+m*(t[l]-t[o])&&(e=!e)}return e}function to(t,s,n){const e=()=>new Ge([new D(0,0),new D(s,0),new D(s,n),new D(0,n)]),o=Math.min(1,_t/Math.max(t.width,t.height,1)),l=o<1?he(t,t.width*o,t.height*o):t,d=l.getContext("2d",{willReadFrequently:!0});if(!d)return[e()];const c=l.width,m=l.height,x=d.getImageData(0,0,c,m).data,a=c+2,i=m+2,g=new Uint8Array(a*i);let S=0;for(let r=0;r<m;r++)for(let v=0;v<c;v++){const C=x[(r*c+v)*4+3]>=Ut?1:0;g[(r+1)*a+v+1]=C,S+=C}if(S>=c*m*.995)return[e()];const u=Jt(g,a,i).map(r=>eo(r,jt)).filter(r=>r.length>=6&&We(r)>=zt).map(r=>({points:r,area:We(r),depth:0})).sort((r,v)=>v.area-r.area).slice(0,Wt);if(!u.length)return[e()];for(const r of u)for(const v of u)v!==r&&v.area>r.area&&He(v.points,r.points[0],r.points[1])&&(r.depth+=1);const h=r=>{const v=[];for(let C=0;C<r.length;C+=2)v.push(new D((r[C]-.5)/c*s,(1-(r[C+1]-.5)/m)*n));return v},M=new Map;for(const r of u)r.depth%2===0&&M.set(r,new Ge(h(r.points)));for(const r of u){if(r.depth%2===0)continue;let v=null;for(const G of u)G.depth===r.depth-1&&He(G.points,r.points[0],r.points[1])&&(!v||G.area<v.area)&&(v=G);const C=v?M.get(v):void 0;C&&C.holes.push(new At(h(r.points)))}const k=[...M.values()];return k.length?k:[e()]}function oo(t,s){const n=Math.max(t.width,t.height,1),e=t.width/n,o=t.height/n,l=new wt(to(t,e,o),{depth:Ht,bevelEnabled:!0,bevelThickness:Ue,bevelSize:Ue,bevelOffset:0,bevelSegments:2,steps:1,curveSegments:1}),d=l.getAttribute("position"),c=new Float32Array(d.count*2);for(let a=0;a<d.count;a++)c[a*2]=d.getX(a)/e,c[a*2+1]=d.getY(a)/o;l.setAttribute("uv",new qe(c,2));const m=new Xe(t);m.colorSpace=Ve,m.anisotropy=s;const x=new de({map:m,roughness:.6,metalness:0});return new z(l,x)}function ue(t){t.traverse(s=>{const n=s;n.geometry&&n.geometry.dispose();const e=Array.isArray(n.material)?n.material:[n.material];for(const o of e)if(o){for(const l of Object.values(o))l instanceof vt&&l.dispose();o.dispose()}})}function no(t,s={}){const{canvas:n}=t,e={...Dt,...s};let o;try{o=new ot({canvas:n,antialias:!1,alpha:!0,powerPreference:"high-performance"})}catch{return null}o.toneMapping=nt,o.setClearColor(0,0);const l=new te,d=new at(e.fov,1,.1,200);d.position.copy(_e).multiplyScalar(e.cameraDistance);const c=new ce;c.position.y=le;const m=new ce;c.add(m),l.add(c);const x=new st(d,n);x.enableDamping=!0,x.enablePan=!1;const a=new Re(1,1,{samples:4});a.texture.colorSpace=Ve;const i=new D(1,1),g=new D(6,10),S=new D(1,1),u=new Re(1,1,{depthBuffer:!1,stencilBuffer:!1,minFilter:Ee,magFilter:Ee}),h=new Le({glslVersion:Oe,vertexShader:Ne,fragmentShader:Ft,uniforms:{tScene:{value:a.texture},tCells:{value:u.texture},tAtlas:{value:null},uResolution:{value:i},uCellPx:{value:g},uGrid:{value:S},uAtlasGrid:{value:new D(1,1)},uAtlasPad:{value:new D(0,0)},uAtlasInner:{value:new D(1,1)},uAscii:{value:1},uColored:{value:1},uColor:{value:new Pe(1,1,1)},uBackground:{value:new Pe(0,0,0)},uHasBg:{value:0}},depthTest:!1,depthWrite:!1,blending:Ie}),M=new rt;M.setAttribute("position",new qe(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));const k=new z(M,h);k.frustumCulled=!1;const r=new te;r.add(k);const v=new it(-1,1,1,-1,0,1),C=new Le({glslVersion:Oe,vertexShader:Ne,fragmentShader:Gt,uniforms:{tScene:{value:a.texture},tShapes:{value:null},uResolution:{value:i},uCellPx:{value:g},uGlyphCount:{value:1},uContrast:{value:1.5},uEdgeContrast:{value:3},uExposure:{value:1},uInvert:{value:0}},depthTest:!1,depthWrite:!1,blending:Ie}),G=new z(M,C);G.frustumCulled=!1;const W=new te;W.add(G);let L=null,F=null,pe=null,me=0;const ve=new ut(o);let N=null,oe=null,T=null,ne=!0;function $e(){N=new te;const f=new ce;f.position.set(0,-.5,0),N.add(f);for(const[y,R]of[[-15,15],[15,15],[15,-15],[-15,-15]]){const E=new xt(16777215,2,0,.2,1,0);E.position.set(y,20,R),f.add(E,E.target)}const p=new Fe(16777215,100,28,2);p.position.set(.5,14,.5),f.add(p);const b=new Te,A=new z(b,new de({color:"gray",side:yt}));A.position.set(0,13.2,0),A.scale.set(31.5,28.5,31.5),f.add(A);const w=new de({color:16777215});for(const y of Tt){const R=new z(b,w);R.position.set(...y.position),R.rotation.set(...y.rotation),R.scale.set(...y.scale),f.add(R)}for(const y of Nt){const R=y.kind==="ring"?new bt(.5,1,64):new Te,E=new Ct({side:St,toneMapped:!1});E.color.set(y.kind==="ring"?e.highlight:"#ffffff").multiplyScalar(y.intensity),y.kind==="ring"&&(oe=E);const I=new z(R,E);if(I.position.set(...y.position),I.scale.set(...y.scale),y.lookAtCenter&&I.lookAt(0,0,0),f.add(I),y.withLight){const P=new Fe(16777215,100,28,2);P.position.set(...y.position),f.add(P)}}}function Ke(){N||$e(),oe&&oe.color.set(e.highlight).multiplyScalar(15),T==null||T.dispose(),T=ve.fromScene(N,0,.1,1e3),l.environment=T.texture}let B=null,ge=1,we=null,_=0,U=!1;const xe=new ct,X=new lt;X.setDecoderPath(e.dracoDecoderPath),xe.setDRACOLoader(X);function ye(){B&&B.traverse(f=>{const p=f,b=Array.isArray(p.material)?p.material:[p.material];for(const A of b){const w=A;!w||typeof w.roughness!="number"||(w.userData.baseRoughness===void 0&&(w.userData.baseRoughness=w.roughness),w.roughness=e.roughness>=0?e.roughness:w.userData.baseRoughness)}})}function be(){B&&m.scale.setScalar(e.scale/ge)}function ae(){B&&(m.remove(B),ue(B),B=null)}function Ce(f){ae(),B=f;const p=new gt().setFromObject(B),b=p.getSize(new fe),A=p.getCenter(new fe);ge=Math.max(b.x,b.y,b.z,1e-4),B.position.sub(A),ye(),be(),m.add(B)}async function Se(){var b,A;const f=e.src;if(f===we)return;we=f;const p=++_;if(!f){ae();return}try{const w=await fetch(f);if(!w.ok)throw new Error(`HTTP ${w.status}`);const y=await w.arrayBuffer();if(U||p!==_)return;const R=new Uint8Array(y),E=Zt(R);if(!E)throw new Error("Unrecognized asset format");if(E==="glb"||E==="gltf"){X.setDecoderPath(e.dracoDecoderPath);const I=f.slice(0,f.lastIndexOf("/")+1),P=E==="glb"?y:new TextDecoder().decode(R),ee=await xe.parseAsync(P,I);if(U||p!==_){ue(ee.scene);return}Ce(ee.scene)}else{const I=new Blob([y],{type:E==="svg"?"image/svg+xml":""}),P=await Qt(I,E);if(U||p!==_)return;Ce(oo(P,o.capabilities.getMaxAnisotropy()))}(b=e.onLoad)==null||b.call(e)}catch(w){if(U||p!==_)return;(A=e.onError)==null||A.call(e,w)}}const Y=window.matchMedia("(prefers-reduced-motion: reduce)");let Z=Y.matches;const Ae=()=>{Z=Y.matches,Z&&c.rotation.set(0,0,0),se()};Y.addEventListener("change",Ae);function Qe(){const f=ze(e.cellAspect);if(pe===e.charset&&me===f)return;const p=Xt(e.charset),b=Vt,A=Math.max(Math.round(b*f),8),w=A+O*2,y=b+O*2,R=Math.ceil(Math.sqrt(p.length)),E=Math.ceil(p.length/R),I=Ze(R*w,E*y),P=I.getContext("2d");if(!P)return;pe=e.charset,me=f,P.clearRect(0,0,I.width,I.height),P.fillStyle="#ffffff",P.textAlign="center",P.textBaseline="middle";const ee=Math.floor(Math.min(b*.92,A/.58));P.font=`600 ${ee}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;for(let V=0;V<p.length;V++)P.fillText(p[V],V%R*w+w/2,Math.floor(V/R)*y+y/2);const et=P.getImageData(0,0,I.width,I.height),tt=Yt(et,R,A,b,p.length);L==null||L.dispose(),F==null||F.dispose(),L=new Xe(I),L.minFilter=ft,L.magFilter=dt,L.wrapS=De,L.wrapT=De,F=new ht(tt,6,p.length,pt,mt),F.needsUpdate=!0,h.uniforms.tAtlas.value=L,h.uniforms.uAtlasGrid.value.set(R,E),h.uniforms.uAtlasPad.value.set(O/w,O/y),h.uniforms.uAtlasInner.value.set(A/w,b/y),C.uniforms.tShapes.value=F,C.uniforms.uGlyphCount.value=p.length}function Me(){const f=o.getPixelRatio(),p=Math.max(e.cellSize,3)*f,b=p*ze(e.cellAspect);g.set(b,p);const A=Math.max(Math.ceil(i.x/b),1),w=Math.max(Math.ceil(i.y/p),1);S.set(A,w),(u.width!==A||u.height!==w)&&u.setSize(A,w)}function se(){l.environmentIntensity=e.environmentIntensity,x.enableRotate=e.orbit,x.enableZoom=e.zoom,x.autoRotate=e.autoRotate&&!Z,x.autoRotateSpeed=e.autoRotateSpeed,d.fov=e.fov,d.updateProjectionMatrix(),c.position.x=e.xOffset,c.position.y=le+e.yOffset,C.uniforms.uContrast.value=Math.max(e.contrast,.05),C.uniforms.uEdgeContrast.value=Math.max(e.edgeContrast,.05),C.uniforms.uExposure.value=Math.max(e.exposure,0),C.uniforms.uInvert.value=e.invert?1:0,h.uniforms.uAscii.value=e.ascii?1:0,h.uniforms.uColored.value=e.colored?1:0,h.uniforms.uColor.value.setStyle(e.color||"#ffffff",Be),h.uniforms.uHasBg.value=e.background?1:0,e.background&&h.uniforms.uBackground.value.setStyle(e.background,Be),Qe(),Me(),ye(),be()}function $(){const f=Math.max(n.clientWidth,1),p=Math.max(n.clientHeight,1),b=Math.min(window.devicePixelRatio||1,2);o.setPixelRatio(b),o.setSize(f,p,!1);const A=Math.round(f*b),w=Math.round(p*b);a.setSize(A,w),i.set(A,w),d.aspect=f/p,d.updateProjectionMatrix(),Me()}const ke=new ResizeObserver($);ke.observe(n),$(),se(),Se();let K=!0,Q=!1;function Je(f){if(!K){J=0,ie();return}const p=J?Math.min((f-J)/1e3,.1):0;J=f,ne&&(ne=!1,Ke()),x.update(),Z||(H+=p*e.floatSpeed,c.rotation.x=Math.cos(H/4)/8*e.rotationIntensity,c.rotation.y=Math.sin(H/4)/8*e.rotationIntensity,c.rotation.z=Math.sin(H/4)/20*e.rotationIntensity,c.position.y=le+e.yOffset+Math.sin(H/1.5)/10*e.floatIntensity),o.setRenderTarget(a),o.render(l,d),e.ascii&&(o.setRenderTarget(u),o.render(W,v)),o.setRenderTarget(null),o.render(r,v)}function re(){Q||!K||U||(Q=!0,o.setAnimationLoop(Je))}function ie(){Q&&(Q=!1,o.setAnimationLoop(null))}const j=typeof IntersectionObserver<"u"?new IntersectionObserver(f=>{var p;K=((p=f[f.length-1])==null?void 0:p.isIntersecting)??!0,K?re():ie()}):null;j==null||j.observe(n);let J=0,H=Math.random()*100;return re(),{setOptions(f){let p=!1;for(const[w,y]of Object.entries(f))if(typeof y!="function"&&e[w]!==y){p=!0;break}if(!p){Object.assign(e,f);return}const b=e.highlight,A=e.cameraDistance;Object.assign(e,f),e.highlight!==b&&(ne=!0),e.cameraDistance!==A&&d.position.copy(_e).multiplyScalar(e.cameraDistance),se(),$(),Se(),re()},resize:$,destroy(){U=!0,_+=1,ie(),ke.disconnect(),j==null||j.disconnect(),Y.removeEventListener("change",Ae),x.dispose(),ae(),N&&ue(N),T==null||T.dispose(),ve.dispose(),X.dispose(),a.dispose(),u.dispose(),C.dispose(),L==null||L.dispose(),F==null||F.dispose(),M.dispose(),h.dispose(),o.dispose()}}}const ao={style:{position:"relative",display:"block"}},io=Mt({__name:"AsciiObject",props:{src:String,ascii:{type:Boolean,default:void 0},cellSize:Number,cellAspect:Number,charset:String,colored:{type:Boolean,default:void 0},color:String,contrast:Number,edgeContrast:Number,exposure:Number,invert:{type:Boolean,default:void 0},background:String,highlight:String,environmentIntensity:Number,roughness:Number,scale:Number,xOffset:Number,yOffset:Number,floatIntensity:Number,rotationIntensity:Number,floatSpeed:Number,orbit:{type:Boolean,default:void 0},zoom:{type:Boolean,default:void 0},autoRotate:{type:Boolean,default:void 0},autoRotateSpeed:Number,fov:Number,cameraDistance:Number,dracoDecoderPath:String,onLoad:Function,onError:Function},setup(t){const s=t,n=kt(null);let e=null;function o(){return Object.fromEntries(Object.entries(s).filter(([,l])=>l!==void 0))}return Rt(()=>{n.value&&(e=no({canvas:n.value},o()))}),Et(()=>{e==null||e.destroy(),e=null}),Lt(()=>({...s}),()=>e==null?void 0:e.setOptions(o()),{deep:!0}),(l,d)=>(It(),Pt("span",ao,[Ot("canvas",{ref_key:"canvasEl",ref:n,style:{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block","touch-action":"none"}},null,512)]))}});export{io as default};
