// ===== Frostfang Hollow Link — sprite masters (SVG, 256x256) =====
const ART2 = (() => {
  const O = '#1b0f3d';            // outline ink
  const SW = 7;                   // outline weight at 256px
  const st = (w = SW) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const wrap = (body, defs = '', vb = '0 0 256 256') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs>${defs}</defs>${body}</svg>`;
  const lg = (id, stops, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const rg = (id, stops, cx = .5, cy = .5, r = .5) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;

  // scalloped "fur" outline around an ellipse
  function fluff(cx, cy, rx, ry, n, amp, rot = 0) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      if (i === 0) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
      const am = rot + ((i - .5) / n) * Math.PI * 2;
      const qx = cx + Math.cos(am) * (rx + amp), qy = cy + Math.sin(am) * (ry + amp);
      d += ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + 'Z';
  }
  // icicles hanging along a line
  function icicles(x0, x1, y, n, len) {
    let d = '';
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * w, l = len * (0.55 + ((i * 37) % 10) / 20);
      d += `M${x + 2} ${y} L${x + w / 2} ${y + l} L${x + w - 2} ${y}Z `;
    }
    return d;
  }
  const sparkle = (x, y, s, c = '#fff') =>
    `<path d="M${x} ${y - s} Q${x + s * .18} ${y - s * .18} ${x + s} ${y} Q${x + s * .18} ${y + s * .18} ${x} ${y + s} Q${x - s * .18} ${y + s * .18} ${x - s} ${y} Q${x - s * .18} ${y - s * .18} ${x} ${y - s}Z" fill="${c}"/>`;

  // ---------------- Frostfang character ----------------
  const FUR = lg('ffFur', [[0, '#ffffff'], [.6, '#eaf7ff'], [1, '#b8e2fa']]);
  const FACE = rg('ffFace', [[0, '#9fe0ff'], [.7, '#4fb2f2'], [1, '#2f7fd6']], .45, .35, .65);
  const HORN = lg('ffHorn', [[0, '#e4d2ff'], [.5, '#a46bff'], [1, '#5b2bc4']], 1, 1);
  const charDefs = FUR + FACE + HORN + rg('ffSnow', [[0, '#fff'], [.6, '#e3f5ff'], [1, '#9fd2f0']], .35, .3, .7);

  function horns() {
    return `<path d="M78 74 C58 60 46 34 54 8 C70 30 88 42 104 52Z" fill="url(#ffHorn)" ${st()}/>
      <path d="M178 74 C198 60 210 34 202 8 C186 30 168 42 152 52Z" fill="url(#ffHorn)" ${st()}/>
      <path d="M62 36 q12 6 22 4 M66 52 q12 4 22 0 M194 36 q-12 6 -22 4 M190 52 q-12 4 -22 0" stroke="#4a1d9e" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M58 16 q4 14 14 24" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>`;
  }
  function face(expr = 'grin') {
    const eyes = expr === 'joy'
      ? `<path d="M90 120 q14 -16 28 0" ${st(7)} fill="none"/><path d="M138 120 q14 -16 28 0" ${st(7)} fill="none"/>`
      : `<ellipse cx="104" cy="118" rx="17" ry="19" fill="#fff" ${st(5)}/><ellipse cx="152" cy="118" rx="17" ry="19" fill="#fff" ${st(5)}/>
         <circle cx="${expr === 'aim' ? 112 : 107}" cy="121" r="9" fill="${O}"/><circle cx="${expr === 'aim' ? 160 : 155}" cy="121" r="9" fill="${O}"/>
         <circle cx="${expr === 'aim' ? 115 : 110}" cy="117" r="3.5" fill="#fff"/><circle cx="${expr === 'aim' ? 163 : 158}" cy="117" r="3.5" fill="#fff"/>`;
    const brows = expr === 'joy'
      ? `<path d="M88 98 q16 -10 30 -2 M138 96 q14 -8 30 2" ${st(6)} fill="none"/>`
      : `<path d="M84 92 L120 102 M172 92 L136 102" stroke="#1d3f9e" stroke-width="9" stroke-linecap="round"/>`;
    const mouth = expr === 'aim'
      ? `<path d="M106 152 q22 14 44 0 q-22 22 -44 0Z" fill="#3a0f5c" ${st(5)}/><path d="M112 154 l5 10 5 -8 M134 154 l5 8 5 -10" fill="#fff" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`
      : `<path d="M92 146 Q128 190 164 146 Q128 160 92 146Z" fill="#3a0f5c" ${st(5)}/>
         <path d="M112 166 q16 12 32 0 q-16 -6 -32 0Z" fill="#ff7aa8"/>
         <path d="M104 150 l6 13 6 -11 M140 152 l6 11 6 -13" fill="#fff" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    return `<ellipse cx="128" cy="130" rx="64" ry="52" fill="url(#ffFace)" ${st()}/>
      <path d="M78 112 q10 -30 46 -34" stroke="#d6f3ff" stroke-width="6" fill="none" opacity=".7" stroke-linecap="round"/>
      ${eyes}${brows}
      <ellipse cx="82" cy="148" rx="10" ry="6" fill="#ff8fc0" opacity=".7"/><ellipse cx="174" cy="148" rx="10" ry="6" fill="#ff8fc0" opacity=".7"/>
      ${mouth}`;
  }
  function body() {
    return `<path d="${fluff(128, 152, 92, 90, 22, 9, -Math.PI / 2)}" fill="url(#ffFur)" ${st()}/>
      <path d="M190 130 q20 50 -20 92" stroke="#9fd0ee" stroke-width="10" fill="none" opacity=".55" stroke-linecap="round"/>
      <path d="M96 204 q8 10 18 2 M138 206 q8 10 18 0 M70 186 q6 8 14 4" stroke="#9fd0ee" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  function feet() {
    return `<path d="${fluff(92, 236, 30, 15, 9, 4)}" fill="url(#ffFur)" ${st()}/><path d="${fluff(164, 236, 30, 15, 9, 4)}" fill="url(#ffFur)" ${st()}/>
      <path d="M72 244 q20 8 40 0 M144 244 q20 8 40 0" stroke="#7cb8e0" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  const armDown = (side) => side < 0
    ? `<path d="${fluff(40, 168, 26, 38, 11, 5, 0.3)}" fill="url(#ffFur)" ${st()} transform="rotate(22 40 168)"/>`
    : `<path d="${fluff(216, 168, 26, 38, 11, 5, 0.3)}" fill="url(#ffFur)" ${st()} transform="rotate(-22 216 168)"/>`;
  const armUp = (side) => side < 0
    ? `<path d="${fluff(42, 96, 26, 42, 11, 5, 0.3)}" fill="url(#ffFur)" ${st()} transform="rotate(-28 42 96)"/>`
    : `<path d="${fluff(214, 96, 26, 42, 11, 5, 0.3)}" fill="url(#ffFur)" ${st()} transform="rotate(28 214 96)"/>`;
  const snowballInHand = (x, y, r) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#ffSnow)" ${st(6)}/><path d="M${x - r * .5} ${y - r * .3} q${r * .3} -${r * .4} ${r * .7} -${r * .35}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`;

  const frostIdle = wrap(`${horns()}${armDown(-1)}${armDown(1)}${feet()}${body()}${face('grin')}
      ${snowballInHand(222, 196, 20)}`, charDefs);
  const frostThrow = wrap(`${horns()}${armDown(-1)}${feet()}${body()}${armUp(1)}${face('aim')}
      ${snowballInHand(226, 46, 24)}
      <path d="M182 20 q20 -10 36 -6 M240 80 q10 10 8 26" stroke="#bfe9ff" stroke-width="5" fill="none" stroke-linecap="round"/>`, charDefs);
  const frostCheer = wrap(`${horns()}${armUp(-1)}${armUp(1)}${feet()}${body()}${face('joy')}
      ${sparkle(22, 40, 14, '#ffd34d')}${sparkle(236, 36, 12, '#ffd34d')}${sparkle(30, 200, 9, '#bfe9ff')}${sparkle(230, 190, 10, '#bfe9ff')}`, charDefs);

  // Frostfang SYMBOL: portrait in a frosty medallion
  const frostSym = wrap(`
    <circle cx="128" cy="128" r="118" fill="url(#medal)" ${st()}/>
    <circle cx="128" cy="128" r="100" fill="url(#medalIn)" stroke="#d6f3ff" stroke-width="4"/>
    <path d="${icicles(46, 210, 222, 9, 26)}" fill="#dff5ff" ${st(4)}/>
    <g transform="translate(33 52) scale(.74)">${horns()}${body()}${face('grin')}</g>
    ${sparkle(40, 50, 12)}${sparkle(214, 70, 9)}`,
    charDefs + lg('medal', [[0, '#c9a6ff'], [.5, '#7b3fe4'], [1, '#3c1680']]) + rg('medalIn', [[0, '#2d5fbf'], [1, '#160a3d']], .5, .4, .7));

  // ---------------- Wild ----------------
  const wild = wrap(`
    <path d="M128 8 L168 70 L150 176 L106 176 L88 70Z" fill="url(#iceA)" ${st()}/>
    <path d="M68 52 L100 104 L92 184 L56 176 L40 98Z" fill="url(#iceB)" ${st()}/>
    <path d="M188 52 L216 98 L200 176 L164 184 L156 104Z" fill="url(#iceB)" ${st()}/>
    <path d="M128 8 L128 176 M68 52 L74 180 M188 52 L182 180" stroke="#fff" stroke-width="4" opacity=".7"/>
    <path d="M112 34 L104 90" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/>
    <path d="M22 158 Q128 132 234 158 L226 216 Q128 192 30 216Z" fill="url(#wildBan)" ${st()}/>
    <text x="128" y="204" text-anchor="middle" font-family="Creepster, Impact, sans-serif" font-size="62" fill="#ffe27a" stroke="${O}" stroke-width="8" paint-order="stroke" letter-spacing="4">WILD</text>
    <path d="${icicles(48, 208, 214, 8, 26)}" fill="#dff5ff" ${st(4)}/>
    ${sparkle(222, 34, 14)}${sparkle(34, 30, 9)}`,
    lg('iceA', [[0, '#ffffff'], [.4, '#bfe9ff'], [1, '#3f8fe0']], 1, 1) + lg('iceB', [[0, '#e9f9ff'], [1, '#5aa7e8']], 1, 1) +
    lg('wildBan', [[0, '#9b5cff'], [1, '#4a1d9e']]));

  // ---------------- Pumpkin ----------------
  const pumpkin = wrap(`
    <path d="M128 64 C118 40 124 22 140 12" stroke="#2e6b1f" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M128 64 C118 40 124 22 140 12" stroke="#5fae3a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M140 30 C170 6 206 22 206 22 C188 46 160 50 140 30Z" fill="#5fae3a" ${st(6)}/>
    <path d="M150 30 q24 -6 46 -6" stroke="#2e6b1f" stroke-width="3" fill="none"/>
    <path d="M110 40 q-20 -8 -16 -26 q8 12 20 8" stroke="#2e6b1f" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="72" cy="150" rx="58" ry="86" fill="url(#pkS)" ${st()}/>
    <ellipse cx="184" cy="150" rx="58" ry="86" fill="url(#pkS)" ${st()}/>
    <ellipse cx="128" cy="150" rx="64" ry="92" fill="url(#pkC)" ${st()}/>
    <path d="M100 76 q-8 70 0 150 M156 76 q8 70 0 150" stroke="#c4560a" stroke-width="4" fill="none" opacity=".7"/>
    <path d="M36 110 q-8 30 0 70" stroke="#ffc58a" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M60 124 L92 96 L108 132Z M148 132 L164 96 L196 124Z" fill="url(#glow)" ${st(6)}/>
    <path d="M120 142 L128 128 L136 142Z" fill="url(#glow)" ${st(5)}/>
    <path d="M52 160 Q128 222 204 160 L188 172 L176 160 L164 180 L150 166 L138 186 L128 170 L118 186 L106 166 L92 180 L80 160 L68 172Z" fill="url(#glow)" ${st(6)}/>`,
    lg('pkS', [[0, '#ffae4a'], [1, '#d35f00']], 1, 1) + rg('pkC', [[0, '#ffc06a'], [.6, '#ff8a1f'], [1, '#d35f00']], .4, .35, .75) +
    rg('glow', [[0, '#fffbd0'], [.5, '#ffd34d'], [1, '#ff8a1f']], .5, .5, .6));

  // ---------------- Skull ----------------
  const skull = wrap(`
    <path d="M128 18 C58 18 30 66 36 116 C40 148 58 158 66 176 L66 212 Q128 236 190 212 L190 176 C198 158 216 148 220 116 C226 66 198 18 128 18Z" fill="url(#bone)" ${st()}/>
    <path d="M60 60 C76 36 104 28 128 28" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M128 18 C104 30 92 50 82 40 C70 30 60 52 60 52 C80 22 120 12 128 18Z M150 22 l10 22 14 -14 10 20" fill="#dff5ff" ${st(4)}/>
    <path d="M70 104 C70 82 116 82 116 108 C116 132 70 136 70 104Z" fill="url(#eyeG)" ${st(6)}/>
    <path d="M186 104 C186 82 140 82 140 108 C140 132 186 136 186 104Z" fill="url(#eyeG)" ${st(6)}/>
    <circle cx="96" cy="106" r="10" fill="#bfe9ff"/><circle cx="160" cy="106" r="10" fill="#bfe9ff"/>
    <circle cx="99" cy="102" r="4" fill="#fff"/><circle cx="163" cy="102" r="4" fill="#fff"/>
    <path d="M118 154 L128 132 L138 154 Q128 160 118 154Z" fill="#3a1f6e" ${st(5)}/>
    <path d="M80 178 L176 178 M96 178 v34 M112 178 v38 M128 178 v40 M144 178 v38 M160 178 v34" ${st(5)} fill="none"/>
    <path d="M176 60 l-14 22 10 8 -12 18" stroke="#8d7fc4" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M194 150 q10 6 14 -4" stroke="#b4a8e6" stroke-width="5" fill="none" opacity=".8"/>`,
    lg('bone', [[0, '#ffffff'], [.6, '#ece6ff'], [1, '#b4a8e6']]) + rg('eyeG', [[0, '#7b3fe4'], [1, '#1b0f3d']]));

  // ---------------- Bat ----------------
  const bat = wrap(`
    <path d="M128 98 C110 74 70 50 8 70 C30 88 28 108 34 128 C50 118 66 124 72 146 C84 134 102 138 112 160 L128 150 L144 160 C154 138 172 134 184 146 C190 124 206 118 222 128 C228 108 226 88 248 70 C186 50 146 74 128 98Z" fill="url(#wing)" ${st()}/>
    <path d="M118 96 C90 86 60 84 34 128 M112 110 C96 112 82 120 72 146 M138 96 C166 86 196 84 222 128 M144 110 C160 112 174 120 184 146" stroke="#2a0f5c" stroke-width="4" fill="none" opacity=".8"/>
    <path d="M24 72 q50 -16 92 18" stroke="#c6a8ff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="128" cy="130" rx="38" ry="48" fill="url(#batB)" ${st()}/>
    <path d="M98 96 L90 52 L118 84Z M158 96 L166 52 L138 84Z" fill="url(#batB)" ${st(6)}/>
    <path d="M98 80 L94 62 L108 78Z M158 80 L162 62 L148 78Z" fill="#ff8fc0"/>
    <ellipse cx="114" cy="120" rx="10" ry="12" fill="#ffd34d" ${st(4)}/><ellipse cx="142" cy="120" rx="10" ry="12" fill="#ffd34d" ${st(4)}/>
    <ellipse cx="116" cy="122" rx="4" ry="7" fill="${O}"/><ellipse cx="140" cy="122" rx="4" ry="7" fill="${O}"/>
    <path d="M112 146 q16 10 32 0" ${st(5)} fill="none"/>
    <path d="M116 148 l4 10 4 -8 M132 150 l4 8 4 -10" fill="#fff" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M108 172 q20 10 40 0" stroke="#8e5ce8" stroke-width="5" fill="none" opacity=".8"/>`,
    lg('wing', [[0, '#8e5ce8'], [1, '#3c1680']]) + rg('batB', [[0, '#9b6bff'], [1, '#4a1d9e']], .4, .3, .75));

  // ---------------- Candles ----------------
  function candle(x, y, w, h) {
    return `<ellipse cx="${x}" cy="${y - 34}" rx="${w * .22}" ry="30" fill="url(#halo)"/>
      <path d="M${x} ${y - 52} C${x + 14} ${y - 30} ${x + 10} ${y - 10} ${x} ${y - 8} C${x - 10} ${y - 10} ${x - 14} ${y - 30} ${x} ${y - 52}Z" fill="url(#flame)" ${st(5)}/>
      <ellipse cx="${x}" cy="${y - 18}" rx="4" ry="8" fill="#fff"/>
      <path d="M${x} ${y - 8} v10" ${st(4)}/>
      <rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="6" fill="url(#wax)" ${st()}/>
      <path d="M${x - w / 2} ${y + 6} q${w * .15} ${w * .5} ${w * .3} 0 q${w * .12} ${w * .8} ${w * .28} 0 q${w * .12} ${w * .4} ${w * .42} 0" fill="#c9b6ff" ${st(4)}/>
      <path d="M${x - w / 2 + 8} ${y + 22} v${h - 32}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
  }
  const candles = wrap(`
    ${candle(84, 120, 46, 100)}${candle(170, 92, 52, 128)}${candle(128, 150, 40, 70)}
    <path d="M30 220 Q128 196 226 220 L226 236 Q128 250 30 236Z" fill="#7b3fe4" ${st()}/>
    <path d="M44 222 q84 -18 168 0" stroke="#c6a8ff" stroke-width="4" fill="none"/>`,
    lg('wax', [[0, '#f6f1ff'], [1, '#a996e8']], 1, 0) + lg('flame', [[0, '#fff6c8'], [.5, '#ffd34d'], [1, '#ff7a1a']]) +
    rg('halo', [[0, '#ffd34d', .55], [1, '#ffd34d', 0]]));

  // ---------------- Card letters ----------------
  const LET = {
    A: ['#ff9cc0', '#e0306f'], K: ['#9fe8ff', '#1f8fd6'], Q: ['#ffe9a0', '#f0a500'],
    J: ['#b8f5a0', '#3aa52a'], T: ['#ffc98f', '#e0620c']
  };
  const letters = {};
  for (const k in LET) {
    const t = k === 'T' ? '10' : k, fs = t.length > 1 ? 178 : 230, id = 'lt' + k;
    letters[k] = wrap(`
      <g transform="translate(128 0) scale(${t.length > 1 ? 1.15 : 1.45} 1) translate(-128 0)"><text x="128" y="${t.length > 1 ? 210 : 222}" text-anchor="middle" font-family="Creepster, Impact, sans-serif" font-size="${fs}" letter-spacing="${t.length > 1 ? -6 : 0}" fill="url(#${id})" stroke="${O}" stroke-width="14" paint-order="stroke" stroke-linejoin="round">${t}</text>
      <text x="128" y="${t.length > 1 ? 210 : 222}" text-anchor="middle" font-family="Creepster, Impact, sans-serif" font-size="${fs}" letter-spacing="${t.length > 1 ? -6 : 0}" fill="none" stroke="#fff" stroke-width="3" opacity=".45" transform="translate(-3 -4)">${t}</text></g>
      <path d="M40 40 Q128 14 216 40 Q204 54 128 48 Q52 54 40 40Z" fill="#f4fbff" ${st(5)}/>
      <path d="${icicles(56, 200, 47, 8, 20)}" fill="#f4fbff" ${st(4)}/>`,
      lg(id, [[0, LET[k][0]], [1, LET[k][1]]]));
  }

  // ---------------- Orb ----------------
  const orb = wrap(`
    <circle cx="128" cy="124" r="118" fill="url(#orbHalo)"/>
    <circle cx="128" cy="124" r="96" fill="url(#orbG)" ${st()}/>
    <path d="M70 150 C96 100 150 170 186 108" stroke="#d6f3ff" stroke-width="7" fill="none" opacity=".6" stroke-linecap="round"/>
    <path d="M78 104 C110 140 150 80 182 140" stroke="#c6a8ff" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>
    <circle cx="128" cy="124" r="28" fill="url(#orbCore)"/>
    <path d="M66 96 C78 64 106 48 136 48" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".85"/>
    <circle cx="160" cy="62" r="6" fill="#fff" opacity=".8"/>
    ${sparkle(206, 40, 16)}${sparkle(48, 200, 10, '#d6f3ff')}`,
    rg('orbHalo', [[.6, '#8f6bff', .55], [1, '#8f6bff', 0]]) +
    rg('orbG', [[0, '#e9fbff'], [.35, '#7fd3ff'], [.75, '#6a3cff'], [1, '#2a0f7a']], .38, .32, .75) +
    rg('orbCore', [[0, '#ffffff'], [.5, '#e0f6ff', .7], [1, '#7fd3ff', 0]]));

  // ---------------- Moon (scatter) ----------------
  const moon = wrap(`
    <circle cx="128" cy="110" r="104" fill="url(#moonHalo)"/>
    <circle cx="128" cy="108" r="86" fill="url(#moonG)" ${st()}/>
    <circle cx="96" cy="86" r="16" fill="#e8c860" opacity=".7"/><circle cx="160" cy="130" r="22" fill="#e8c860" opacity=".6"/><circle cx="148" cy="70" r="9" fill="#e8c860" opacity=".7"/><circle cx="92" cy="140" r="8" fill="#e8c860" opacity=".6"/>
    <path d="M60 88 C66 60 90 38 120 34" stroke="#fffbe6" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M128 112 C118 100 98 92 78 102 C88 108 88 116 90 124 C100 118 108 122 112 130 L128 122 L144 130 C148 122 156 118 166 124 C168 116 168 108 178 102 C158 92 138 100 128 112Z" fill="#2a0f5c"/>
    <path d="M26 176 Q128 150 230 176 L222 232 Q128 208 34 232Z" fill="url(#freeBan)" ${st()}/>
    <text x="128" y="221" text-anchor="middle" font-family="Fredoka, Arial Black, sans-serif" font-weight="700" font-size="46" fill="#fff" stroke="${O}" stroke-width="8" paint-order="stroke" letter-spacing="3">FREE</text>
    ${sparkle(222, 40, 12)}${sparkle(30, 56, 9)}`,
    rg('moonHalo', [[.7, '#ffe07a', .5], [1, '#ffe07a', 0]]) + rg('moonG', [[0, '#fffbe0'], [.6, '#ffe07a'], [1, '#f0b830']], .4, .35, .75) +
    lg('freeBan', [[0, '#ff9b3d'], [1, '#c2410c']]));

  // ---------------- +1 Spin ice block ----------------
  const plus = wrap(`
    <path d="M40 60 L128 22 L216 60 L216 188 L128 232 L40 188Z" fill="url(#cubeF)" ${st()}/>
    <path d="M40 60 L128 98 L216 60 M128 98 V232" stroke="#fff" stroke-width="5" opacity=".8" fill="none"/>
    <path d="M40 60 L128 22 L216 60 L128 98Z" fill="#f0fbff" opacity=".7"/>
    <text x="128" y="170" text-anchor="middle" font-family="Fredoka, Arial Black, sans-serif" font-weight="700" font-size="72" fill="#ffd34d" stroke="${O}" stroke-width="9" paint-order="stroke">+1</text>
    <text x="128" y="210" text-anchor="middle" font-family="Fredoka, Arial Black, sans-serif" font-weight="700" font-size="30" fill="#fff" stroke="${O}" stroke-width="7" paint-order="stroke">SPIN</text>
    ${sparkle(210, 30, 14)}`,
    lg('cubeF', [[0, '#d6f3ff'], [1, '#4a8fe0']], 1, 1));

  // ---------------- Snowball ----------------
  const snowball = wrap(`
    <circle cx="128" cy="128" r="96" fill="url(#ffSnow)" ${st(8)}/>
    <path d="M70 90 q24 -36 66 -36" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="160" cy="160" r="8" fill="#a8d6f0"/><circle cx="110" cy="176" r="6" fill="#a8d6f0"/><circle cx="178" cy="112" r="5" fill="#a8d6f0"/>
    ${sparkle(200, 52, 14)}`, charDefs);

  // ---------------- Diamond (grows the Moonrise grid) ----------------
  const diamond = wrap(`
    <circle cx="128" cy="128" r="116" fill="url(#gemHalo)"/>
    <path d="M70 52 L186 52 L232 104 L128 228 L24 104Z" fill="url(#gemBase)" ${st()}/>
    <path d="M24 104 L232 104 M70 52 L96 104 L128 52 L160 104 L186 52 M96 104 L128 228 L160 104" stroke="${O}" stroke-width="4" stroke-linejoin="round" fill="none"/>
    <path d="M70 52 L96 104 L24 104Z" fill="#e9fbff" opacity=".85"/>
    <path d="M128 52 L160 104 L96 104Z" fill="#bff0ff" opacity=".9"/>
    <path d="M186 52 L232 104 L160 104Z" fill="#4fb2f2" opacity=".75"/>
    <path d="M24 104 L96 104 L128 228Z" fill="#9fe0ff" opacity=".7"/>
    <path d="M160 104 L232 104 L128 228Z" fill="#3a6fd6" opacity=".75"/>
    <path d="M96 104 L160 104 L128 228Z" fill="#6cc8ff" opacity=".6"/>
    <path d="M78 64 L94 92" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    ${sparkle(206, 46, 16)}${sparkle(44, 186, 10, '#d6f3ff')}${sparkle(222, 170, 8, '#ff9cc0')}`,
    rg('gemHalo', [[.55, '#7fd3ff', .5], [1, '#7fd3ff', 0]]) + lg('gemBase', [[0, '#d6f6ff'], [1, '#2f6fd6']], 1, 1));

  const sprites = {
    D: diamond,
    W: wild, F: frostSym, P: pumpkin, S: skull, B: bat, C: candles,
    A: letters.A, K: letters.K, Q: letters.Q, J: letters.J, T: letters.T,
    O: orb, M: moon, X: plus,
    frost_idle: frostIdle, frost_throw: frostThrow, frost_cheer: frostCheer, snowball
  };
  // Every time a sprite is read it gets its own gradient ids. Shared ids let one hidden copy
  // break every other copy on the page (that is what turned Frostfang see-through).
  return uniqueIds(sprites);
})();
function uniqueIds(obj){
  let n = 0;
  const fresh = s => { const k = '_' + (n++).toString(36);
    return s.replace(/id="([^"]+)"/g, (m, a) => `id="${a}${k}"`).replace(/url\(#([^)]+)\)/g, (m, a) => `url(#${a}${k})`); };
  return new Proxy(obj, {
    get: (t, k) => typeof t[k] === 'string' ? fresh(t[k]) : t[k],
    set: (t, k, v) => { t[k] = v; return true; }
  });
}
if (typeof module !== 'undefined') module.exports = ART2;
