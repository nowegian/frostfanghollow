"""Frostfang's three music loops. Every loop is rendered circularly (notes and reverb that run past the end wrap
into the start), so it repeats with no gap or click."""
import numpy as np, synth as S

def rms_norm(x, target_db=-19.0):
    r = np.sqrt((x ** 2).mean()) or 1
    return x * (10 ** (target_db / 20) / r)

def render(parts, seconds, verb=0.32, verb_s=2.8):
    out = S.buf(seconds)
    for inst, notes, g, pan in parts:
        for (t, n, d, v) in notes:
            S.add(out, inst.note(n, v, d), t, gain=g, pan=pan, wrap=True)
    out = S.reverb(out, seconds=verb_s, mix=verb, wrap=True)
    out = rms_norm(out)
    return S.master(np.tanh(out * 1.6) / 1.6, peak=0.9)

# chord tones (MIDI) by name
CH = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'Gm': [43, 46, 50], 'A7': [45, 49, 52, 55], 'F': [41, 45, 48],
      'A': [45, 49, 52], 'C': [48, 52, 55], 'Eb': [51, 55, 58], 'Cm': [48, 51, 55], 'BbM': [46, 50, 53]}


# ---------------- regular play: a music-box waltz (3/4) ----------------
def music_base():
    bpm = 92; b = 60 / bpm; bar = 3 * b
    prog = ['Dm', 'Bb', 'Gm', 'A7', 'Dm', 'F', 'Gm', 'A', 'Bb', 'F', 'Gm', 'Dm', 'Bb', 'Gm', 'A', 'A7']
    D4, E4, F4, G4, A4, Bb4, C5, Cs5, D5, E5, F5, G5, A5, Bb5 = 62, 64, 65, 67, 69, 70, 72, 73, 74, 76, 77, 79, 81, 82
    mel = [  # (pitch, beat, beats) per bar
        [(A4, 0, 1.5), (F4, 1.5, .5), (D5, 2, 1)], [(D5, 0, 1), (C5, 1, .5), (Bb4, 1.5, .5), (A4, 2, 1)],
        [(G4, 0, 1.5), (Bb4, 1.5, .5), (D5, 2, 1)], [(Cs5, 0, 2), (E5, 2, 1)],
        [(F5, 0, 1.5), (E5, 1.5, .5), (D5, 2, 1)], [(C5, 0, 1), (A4, 1, 1), (F4, 2, 1)],
        [(Bb4, 0, 1), (D5, 1, 1), (G5, 2, 1)], [(E5, 0, 1.5), (Cs5, 1.5, .5), (A4, 2, 1)],
        [(F5, 0, 1.5), (D5, 1.5, .5), (Bb4, 2, 1)], [(A5, 0, 1.5), (F5, 1.5, .5), (C5, 2, 1)],
        [(G5, 0, 1), (F5, 1, .5), (E5, 1.5, .5), (D5, 2, 1)], [(F5, 0, 2), (A4, 2, 1)],
        [(D5, 0, 1), (F5, 1, 1), (Bb5, 2, 1)], [(A5, 0, 1), (G5, 1, 1), (Bb4, 2, 1)],
        [(Cs5, 0, 1.5), (E5, 1.5, .5), (A5, 2, 1)], [(G5, 0, 1), (E5, 1, 1), (Cs5, 2, 1)]]
    cel, box, pizz, harp, strg, ooh, glk = (S.inst(0, 8), S.inst(0, 10), S.inst(0, 45), S.inst(0, 46),
                                            S.inst(0, 49, attack=0.35, release=0.8), S.inst(0, 53, attack=0.5, release=1.0), S.inst(0, 9))
    P = {k: [] for k in ('cel', 'box', 'pizz', 'harp', 'str', 'ooh', 'glk')}
    for rep in range(2):
        for i, ch in enumerate(prog):
            t0 = (rep * 16 + i) * bar; tones = CH[ch]
            for (n, st, d) in mel[i]:
                P['cel'].append((t0 + st * b, n, d * b * 0.95, 96))
                if rep == 1: P['box'].append((t0 + st * b, n + 12, d * b * 0.9, 70))
            P['pizz'].append((t0, tones[0] - 12 if tones[0] > 44 else tones[0], b * 0.9, 110))
            for k in (1, 2):
                P['harp'].append((t0 + k * b, tones[1] + 12, b * 0.8, 52))
                P['harp'].append((t0 + k * b, tones[2] + 12, b * 0.8, 48))
            if rep == 1:
                P['str'].append((t0, tones[0] + 12, bar, 80)); P['str'].append((t0, tones[2] + 12, bar, 70))
                if i >= 8: P['ooh'].append((t0, tones[1] + 24, bar * 0.98, 60))
                if i % 4 == 0: P['glk'].append((t0, 86 if ch != 'A7' else 85, b, 55))
    parts = [(cel, P['cel'], 1.4, -0.1), (box, P['box'], 0.55, 0.25), (pizz, P['pizz'], 0.9, -0.2),
             (harp, P['harp'], 0.18, 0.2), (strg, P['str'], 2.4, 0.0), (ooh, P['ooh'], 0.55, 0.0), (glk, P['glk'], 0.35, 0.3)]
    return render(parts, 32 * bar, verb=0.34)


# ---------------- Frost Link: tense ostinato (4/4) ----------------
def music_hold():
    bpm = 120; b = 60 / bpm; bar = 4 * b
    prog = ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'A', 'A7'] * 2
    pizz, strg, timp, glk, ooh, kit, cel = (S.inst(0, 45), S.inst(0, 48, attack=0.01, release=0.15), S.inst(0, 47),
                                            S.inst(0, 9), S.inst(0, 52, attack=0.4, release=0.8), S.inst(128, 0), S.inst(0, 8))
    P = {k: [] for k in ('pz', 'st', 'tp', 'gl', 'oo', 'kit', 'cel')}
    pat = [0, 0, 2, 0, 1, 0, 2, 1]       # chord-tone index per eighth note
    hook = [74, 77, 76, 74, 73, 76, 81, 79]
    for rep in range(2):
        for i, ch in enumerate(prog):
            t0 = (rep * len(prog) + i) * bar
            tones = CH[ch]
            for k in range(8):
                n = tones[pat[k] % len(tones)] + 12
                P['pz'].append((t0 + k * b / 2, n, b * 0.4, 118 if k % 2 == 0 else 92))
                P['st'].append((t0 + k * b / 2, n - 12, b * 0.35, 70))
            P['tp'].append((t0, tones[0] - 12 if tones[0] > 45 else tones[0], b, 120))
            P['tp'].append((t0 + 2 * b, tones[0] - 12 if tones[0] > 45 else tones[0], b, 95))
            if i % 2 == 1:
                P['gl'].append((t0 + 3 * b, hook[(i // 2) % 8] + 12, b * 0.9, 80))
                P['gl'].append((t0 + 3.5 * b, hook[(i // 2 + 1) % 8] + 12, b * 0.9, 70))
            P['oo'].append((t0, tones[2] + 12, bar * 0.98, 55))
            for k in range(8):
                P['kit'].append((t0 + k * b / 2, 42, 0.05, 60 if k % 2 else 35))
            P['kit'].append((t0, 36, 0.2, 100)); P['kit'].append((t0 + 2 * b, 36, 0.2, 90))
            if i % 4 == 3: P['kit'].append((t0 + 3.5 * b, 38, 0.15, 70))
            if rep == 1 and i % 2 == 0:
                for k, n in enumerate([tones[0] + 36, tones[1] + 36, tones[2] + 36]):
                    P['cel'].append((t0 + (1 + k * 0.5) * b, n, b * 0.4, 70))
    parts = [(pizz, P['pz'], 0.9, -0.25), (strg, P['st'], 1.6, 0.25), (timp, P['tp'], 1.1, 0.0), (glk, P['gl'], 0.5, 0.3),
             (ooh, P['oo'], 0.4, 0.0), (kit, P['kit'], 0.5, 0.0), (cel, P['cel'], 0.8, -0.2)]
    return render(parts, 2 * len(prog) * bar, verb=0.22, verb_s=2.0)


# ---------------- free games and Diamond Hunt: magical, brighter (4/4, Bb major) ----------------
def music_moon():
    bpm = 104; b = 60 / bpm; bar = 4 * b
    prog = ['BbM', 'F', 'Gm', 'Eb', 'BbM', 'F', 'Eb', 'F', 'Gm', 'Eb', 'BbM', 'F', 'Gm', 'Eb', 'Cm', 'F']
    Bb4, C5, D5, Eb5, F5, G5, A5, Bb5, C6, D6 = 70, 72, 74, 75, 77, 79, 81, 82, 84, 86
    mel = [[(D5, 0, 1), (F5, 1, 1), (Bb5, 2, 2)], [(A5, 0, 1.5), (G5, 1.5, .5), (F5, 2, 2)],
           [(G5, 0, 1), (Bb5, 1, 1), (D6, 2, 2)], [(C6, 0, 1.5), (Bb5, 1.5, .5), (G5, 2, 2)],
           [(F5, 0, 1), (D5, 1, 1), (Bb4, 2, 1), (D5, 3, 1)], [(C5, 0, 1), (F5, 1, 1), (A5, 2, 2)],
           [(G5, 0, 1), (Bb5, 1, 1), (Eb5, 2, 1), (G5, 3, 1)], [(F5, 0, 3), (A5, 3, 1)],
           [(Bb5, 0, 1.5), (A5, 1.5, .5), (G5, 2, 2)], [(G5, 0, 1), (Bb5, 1, 1), (Eb5, 2, 2)],
           [(F5, 0, 1), (D5, 1, 1), (F5, 2, 1), (Bb5, 3, 1)], [(C6, 0, 2), (A5, 2, 2)],
           [(D6, 0, 1.5), (C6, 1.5, .5), (Bb5, 2, 2)], [(G5, 0, 1), (Bb5, 1, 1), (Eb5, 2, 2)],
           [(Eb5, 0, 1), (G5, 1, 1), (C6, 2, 2)], [(A5, 0, 2), (C6, 2, 1), (A5, 3, 1)]]
    harp, glk, aah, strg, bell, bass, cel = (S.inst(0, 46), S.inst(0, 9), S.inst(0, 52, attack=0.4, release=1.0),
                                             S.inst(0, 49, attack=0.3, release=0.8), S.inst(0, 14), S.inst(0, 45), S.inst(0, 8))
    P = {k: [] for k in ('hp', 'gl', 'aa', 'st', 'bl', 'bs', 'cl')}
    for rep in range(2):
        for i, ch in enumerate(prog):
            t0 = (rep * 16 + i) * bar; tones = CH[ch]
            arp = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[0] + 24, tones[2] + 12, tones[1] + 12, tones[0] + 24, tones[1] + 24]
            for k in range(16):
                P['hp'].append((t0 + k * b / 4, arp[k % 8], b * 0.5, 62 if k % 4 else 82))
            for (n, st, d) in mel[i]:
                P['gl' if rep == 1 else 'cl'].append((t0 + st * b, n + (0 if rep else 0), d * b * 0.9, 92))
            P['bs'].append((t0, tones[0] - 12 if tones[0] > 44 else tones[0], b, 110))
            P['bs'].append((t0 + 2 * b, tones[0] - 12 if tones[0] > 44 else tones[0], b, 95))
            P['st'].append((t0, tones[1] + 12, bar, 70)); P['st'].append((t0, tones[2] + 12, bar, 62))
            if rep == 1: P['aa'].append((t0, tones[0] + 24, bar * 0.98, 62))
            if i % 4 == 0: P['bl'].append((t0, tones[0] + 24, bar, 70))
    parts = [(harp, P['hp'], 0.16, 0.25), (glk, P['gl'], 0.75, -0.15), (cel, P['cl'], 1.3, -0.15), (aah, P['aa'], 0.5, 0.0),
             (strg, P['st'], 2.0, 0.1), (bell, P['bl'], 0.35, 0.2), (bass, P['bs'], 0.85, -0.2)]
    return render(parts, 32 * bar, verb=0.33, verb_s=3.0)


if __name__ == '__main__':
    import sys, os
    os.makedirs('out', exist_ok=True)
    for name, fn in [('music_base', music_base), ('music_hold', music_hold), ('music_moon', music_moon)]:
        if len(sys.argv) > 1 and name not in sys.argv[1:]:
            continue
        x = fn()
        S.save_mp3(x, f'out/{name}.mp3', kbps=112)
        print(name, f'{len(x) / S.SR:.1f}s', 'peak', round(float(np.abs(x).max()), 3), 'rms dB', round(20 * np.log10(np.sqrt((x ** 2).mean())), 1))
