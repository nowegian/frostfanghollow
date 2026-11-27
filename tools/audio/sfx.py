"""Frostfang's sound effects, rendered from soundfont instruments plus shaped noise.
Peak level per effect is set by its weight so small ticks stay small and big wins feel big."""
import numpy as np, synth as S
from scipy.signal import butter, sosfilt

SR = S.SR
I = {}
def ins(name, b, p, **kw):
    if name not in I: I[name] = S.inst(b, p, **kw)
    return I[name]

cel = lambda: ins('cel', 0, 8); glk = lambda: ins('glk', 0, 9); box = lambda: ins('box', 0, 10)
bells = lambda: ins('bells', 0, 14); harp = lambda: ins('harp', 0, 46); timp = lambda: ins('timp', 0, 47)
choir = lambda: ins('choir', 0, 52, attack=0.08, release=0.6); strg = lambda: ins('strg', 0, 48, attack=0.03, release=0.5)
tink = lambda: ins('tink', 0, 112); crys = lambda: ins('crys', 0, 98); glass = lambda: ins('glass', 0, 92, attack=0.05)
wood = lambda: ins('wood', 0, 115); kit = lambda: ins('kit', 128, 0); horn = lambda: ins('horn', 0, 60, attack=0.04, release=0.5)
pizz = lambda: ins('pizz', 0, 45)

def sweep_noise(sec, f0, f1, q=1.2, seed=0, shape=None):
    """band-passed noise whose centre glides from f0 to f1 (a whoosh)."""
    x = S.noise(sec, seed); n = len(x); out = np.zeros(n, np.float32); blk = 512
    for i in range(0, n, blk):
        f = f0 * (f1 / f0) ** (i / n)
        lo, hi = max(30, f / (1 + 1 / q)), min(SR / 2 - 100, f * (1 + 1 / q))
        sos = butter(2, [lo, hi], 'band', fs=SR, output='sos')
        out[i:i + blk] = sosfilt(sos, x[max(0, i - 2048):i + blk])[-len(x[i:i + blk]):]
    t = np.arange(n) / SR
    e = shape(t) if shape else np.sin(np.pi * np.minimum(1, t / sec)) ** 1.5
    return S.stereo(out * e)

def thump(sec=0.25, f0=120, f1=45, tau=0.07):
    t = np.arange(int(sec * SR)) / SR
    ph = 2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (t / sec)) / SR
    return S.stereo(np.sin(ph) * np.exp(-t / tau) * np.minimum(1, t / 0.002))

def crunch(sec=0.18, seed=5, lp=3500, tau=0.05):
    x = S.lowpass(S.stereo(S.noise(sec, seed)), lp)
    t = np.arange(len(x)) / SR
    grains = (np.random.default_rng(seed).random(len(x)) < 0.02).astype(np.float32) * 3
    return x * (np.exp(-t / tau) * (1 + grains))[:, None]

def mix(sec, parts, verb=0.25, verb_s=1.6, bright=7000):
    out = S.buf(sec)
    for (src, at, g, *pan) in parts:
        S.add(out, src, at, gain=g, pan=pan[0] if pan else 0)
    if verb: out = S.reverb(out, seconds=verb_s, mix=verb, bright=bright)
    t = np.arange(len(out)) / SR
    out *= np.minimum(1, (sec - t) / 0.08).clip(0, 1)[:, None]    # no click at the very end
    return out

def notes(instr, seq, vel=100, dur=0.6):
    return [(instr.note(n, vel, dur), at, 1.0) for (at, n) in seq]

RMS = {'tiny': -33.0, 'small': -25.0, 'medium': -23.0, 'big': -20.5}   # target loudness by weight (dB)

def build():
    fx = {}
    fx['click'] = ('tiny', mix(0.12, [(wood().note(84, 90, 0.05), 0, 0.6), (S.highpass(crunch(0.03, 1, 9000, 0.008), 2500), 0, 0.5)], verb=0))
    fx['spinStart'] = ('medium', mix(0.6, [(sweep_noise(0.4, 300, 3000, q=1.0, seed=2), 0, 0.9), (thump(0.2, 110, 50, 0.05), 0, 0.8),
                                           (crys().note(96, 70, 0.2), 0.05, 0.25, 0.3)], verb=0.15))
    fx['reelStop'] = ('small', mix(0.35, [(thump(0.25, 140, 55, 0.06), 0, 1.0), (kit().note(45, 100, 0.2), 0, 0.5),
                                          (S.highpass(crunch(0.05, 3, 6000, 0.01), 1500), 0, 0.35)], verb=0.08))
    # tease: a rising bowed-glass shimmer with a tremolo string swell under it
    te = []
    for k, n in enumerate([74, 76, 78, 79, 81, 83, 85, 86]):
        te.append((glass().note(n, 80 + k * 4, 0.3), k * 0.13, 0.7))
        te.append((strg().note(n - 24, 70 + k * 5, 0.14), k * 0.13, 0.5))
    te.append((sweep_noise(1.3, 600, 6000, q=2, seed=4), 0, 0.25))
    fx['tease'] = ('medium', mix(1.6, te, verb=0.35))
    fx['orb'] = ('small', mix(1.2, [(cel().note(81, 105, 0.6), 0, 1.0), (glk().note(93, 70, 0.3), 0.01, 0.35, 0.2),
                                    (tink().note(105, 60, 0.3), 0.03, 0.15, -0.2)], verb=0.3))
    fx['moon'] = ('medium', mix(2.8, [(bells().note(43 + 12, 110, 2.0), 0, 1.0), (bells().note(55 + 12, 80, 1.6), 0.03, 0.4),
                                      (choir().note(62, 70, 1.2), 0.05, 0.5), (glass().note(86, 60, 1.0), 0.1, 0.25)], verb=0.45, verb_s=2.4))
    rng = np.random.default_rng(7)
    fx['diamond'] = ('small', mix(0.9, [(glk().note(int(n), 75, 0.25), k * 0.045, 0.7) for k, n in enumerate(rng.choice([88, 91, 93, 95, 96, 98, 100], 6))]
                                  + [(tink().note(100, 70, 0.4), 0.02, 0.4)], verb=0.3))
    fx['gem'] = ('small', mix(1.0, [(sweep_noise(0.25, 800, 5000, q=1.5, seed=8), 0, 0.5), (glk().note(88, 110, 0.5), 0.12, 1.0), (cel().note(100, 80, 0.4), 0.13, 0.4)], verb=0.3))
    fx['throw'] = ('small', mix(0.45, [(sweep_noise(0.38, 350, 1600, q=0.9, seed=9), 0, 1.0)], verb=0.05))
    fx['impact'] = ('small', mix(0.5, [(thump(0.3, 120, 45, 0.07), 0, 1.0), (crunch(0.3, 10, 2600, 0.07), 0, 0.9), (S.highpass(crunch(0.12, 11, 9000, 0.03), 3000), 0.005, 0.5)], verb=0.1))
    fx['lock'] = ('small', mix(1.0, [(thump(0.15, 100, 45, 0.04), 0, 0.7), (cel().note(76, 105, 0.5), 0, 1.0), (glk().note(88, 60, 0.3), 0.01, 0.25)], verb=0.25))
    fx['plus'] = ('small', mix(1.4, notes(glk(), [(0, 84), (0.1, 91), (0.2, 96)], 100, 0.5) + [(tink().note(108, 80, 0.6), 0.22, 0.5)], verb=0.35))
    fx['coin'] = ('tiny', mix(0.12, [(glk().note(103, 90, 0.06), 0, 1.0)], verb=0))
    fx['glide'] = ('tiny', mix(0.15, [(cel().note(84, 80, 0.07), 0, 1.0)], verb=0.05))
    fx['winSmall'] = ('small', mix(1.2, notes(cel(), [(0, 79), (0.08, 83), (0.16, 86)], 100, 0.5), verb=0.3))
    fx['winMed'] = ('medium', mix(1.6, notes(cel(), [(0, 76), (0.09, 80), (0.18, 83), (0.27, 88), (0.36, 92)], 105, 0.6)
                                 + notes(harp(), [(0, 64), (0.09, 68), (0.18, 71), (0.27, 76)], 80, 0.6), verb=0.32))
    big = [(strg().note(n, 110, 1.4), 0, 0.9) for n in (50, 57, 62, 66)] + [(timp().note(38, 127, 0.8), 0, 1.0), (timp().note(45, 110, 0.6), 0.45, 0.7)]
    big += [(choir().note(n, 95, 1.6), 0.05, 0.6) for n in (62, 66, 69)]
    big += notes(glk(), [(0.1, 86), (0.2, 90), (0.3, 93), (0.4, 98)], 105, 0.6) + [(bells().note(74, 110, 1.6), 0.45, 0.6)]
    fx['winBig'] = ('big', mix(2.8, big, verb=0.4, verb_s=2.4))
    feat = [(sweep_noise(1.0, 200, 6000, q=0.8, seed=12), 0, 0.6)]
    feat += [(harp().note(n, 95, 0.4), 0.15 + k * 0.035, 0.45) for k, n in enumerate([62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88])]
    feat += [(choir().note(n, 95, 1.4), 0.55, 0.7) for n in (62, 69, 74, 78)] + [(bells().note(74, 115, 1.8), 0.55, 0.8), (timp().note(38, 120, 0.8), 0.55, 0.8)]
    fx['feature'] = ('big', mix(2.8, feat, verb=0.42, verb_s=2.6))
    # jackpots: a bell fanfare that repeats and climbs once per level
    for lvl, k in (('MINI', 1), ('MINOR', 2), ('MAJOR', 3), ('GRAND', 4)):
        jp = []
        for r in range(k):
            jp += [(glk().note(84 + r * 5 + s, 110, 0.5), r * 0.42 + i * 0.07, 0.8) for i, s in enumerate((0, 4, 7, 12))]
            jp += [(bells().note(72 + r * 5, 100, 1.0), r * 0.42, 0.45)]
        jp += [(choir().note(n + (k - 1) * 5, 90, 0.8 + k * 0.4), 0, 0.6) for n in (60, 64, 67)]
        jp += [(timp().note(36 + (k - 1) * 2, 120, 0.6), (k - 1) * 0.42, 0.9)]
        if k >= 3: jp += [(horn().note(n + (k - 1) * 5, 110, 0.9), (k - 1) * 0.42, 0.7) for n in (60, 64, 67)]
        fx['jackpot' if lvl == 'MINI' else 'jackpot_' + lvl] = ('big', mix(1.6 + k * 0.5, jp, verb=0.4, verb_s=2.4))
    gr = [(harp().note(n, 90, 0.35), k * 0.03, 0.6) for k, n in enumerate(range(62, 98, 2))]
    gr += [(sweep_noise(0.7, 500, 7000, q=1.5, seed=13), 0, 0.35), (glass().note(86, 80, 0.6), 0.5, 0.5)]
    fx['grow'] = ('medium', mix(1.5, gr, verb=0.38))
    fu = [(strg().note(n, 115, 2.0), 0, 0.9) for n in (45, 57, 64, 69, 73)] + [(choir().note(n, 100, 2.0), 0.05, 0.6) for n in (64, 69, 73)]
    fu += notes(glk(), [(i * 0.08, 81 + s) for i, s in enumerate((0, 4, 7, 12, 16, 19, 24))], 105, 0.6) + [(timp().note(33, 127, 1.0), 0, 1.0)]
    fx['full'] = ('big', mix(3.2, fu, verb=0.42, verb_s=2.6))
    # GRAND orb: rising timpani roll into a full chord with horns, choir and tubular bells
    gd = [(timp().note(38, 60 + k * 3, 0.12), k * 0.07, 0.8) for k in range(18)]
    gd += [(horn().note(n, 120, 2.0), 1.25, 0.8) for n in (50, 57, 62, 66)] + [(choir().note(n, 110, 2.2), 1.25, 0.8) for n in (62, 66, 69, 74)]
    gd += [(bells().note(n, 120, 2.0), 1.25 + k * 0.12, 0.6) for k, n in enumerate((62, 66, 69, 74))]
    gd += [(sweep_noise(1.3, 300, 8000, q=0.8, seed=14), 0, 0.4), (timp().note(38, 127, 1.2), 1.25, 1.0)]
    fx['grand'] = ('big', mix(4.0, gd, verb=0.45, verb_s=3.0))
    return fx

if __name__ == '__main__':
    import os
    os.makedirs('out/sfx', exist_ok=True)
    for name, (w, x) in build().items():
        rms = np.sqrt((x ** 2).mean()) or 1
        x = x * min(10 ** (RMS[w] / 20) / rms, 0.9 / (np.abs(x).max() or 1))
        S.save_mp3(x, f'out/sfx/{name}.mp3', kbps=80)
        print(f'{name:14} {w:6} {len(x) / SR:4.2f}s rms {20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9):6.1f} dB peak {np.abs(x).max():.2f}')
