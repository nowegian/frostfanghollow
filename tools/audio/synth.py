"""Small soundfont sampler + mixing tools for rendering Frostfang's music and sound effects offline.

inst(bank, preset)    -> an Instrument; .note(midi, vel, dur) returns a stereo float32 array
Track/arrange helpers -> place notes in time; reverb(), master() and save_mp3() finish a mix.
"""
import logging, subprocess, functools
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
logging.disable(logging.WARNING)
from sf2utils.sf2parse import Sf2File

SR = 44100
SF2 = '/usr/share/sounds/sf2/TimGM6mb.sf2'
_f = open(SF2, 'rb')
_sf = Sf2File(_f)
_presets = {(p.bank, p.preset): p for p in _sf.presets if hasattr(p, 'bank')}


@functools.lru_cache(maxsize=None)
def _pcm(sample_name):
    s = next(s for s in _sf.samples if s.name == sample_name)
    a = np.frombuffer(s.raw_sample_data, dtype='<i2').astype(np.float32) / 32768.0
    return a, s


def _num(v, default):
    try:
        return float(v) if v is not None else default
    except Exception:
        return default


class Instrument:
    def __init__(self, bank, preset, attack=None, release=0.35, gain=1.0):
        self.p = _presets[(bank, preset)]
        self.zones = []
        for pb in self.p.bags:
            ins = pb.instrument
            if not ins:
                continue
            for ib in ins.bags:
                if not ib.sample:
                    continue
                kr = ib.key_range or pb.key_range or [0, 127]
                vr = ib.velocity_range or [0, 127]
                pcm, s = _pcm(ib.sample.name)
                root = ib.base_note if ib.base_note not in (None, 255, -1) else s.original_pitch
                tune = (_num(ib.tuning, 0) * 100 if ib.tuning else 0) + _num(ib.fine_tuning, 0) + (s.pitch_correction or 0)
                att_cb = ib.gens[48].amount if 48 in ib.gens else 0
                pan = _num(ib.pan, 0)
                self.zones.append(dict(kr=kr, vr=vr, pcm=pcm, sr=s.sample_rate, root=root, tune=tune,
                                       loop=bool(ib.sample_loop), ls=s.start_loop, le=s.end_loop,
                                       gain=10 ** (-att_cb / 200.0), pan=max(-1, min(1, pan / 500.0)),
                                       hold=_num(ib.volume_envelope_hold, 0), decay=_num(ib.volume_envelope_decay, 0),
                                       sustain=_num(ib.volume_envelope_sustain, 0),
                                       attack=_num(ib.volume_envelope_attack, 0.002)))
        self.attack, self.release, self.g = attack, release, gain

    def _zone(self, note, vel):
        best = None
        for z in self.zones:
            if z['kr'][0] <= note <= z['kr'][1] and z['vr'][0] <= vel <= z['vr'][1]:
                return z
            d = min(abs(note - z['kr'][0]), abs(note - z['kr'][1]))
            if best is None or d < best[0]:
                best = (d, z)
        return best[1]

    def note(self, note, vel=100, dur=0.5, release=None):
        z = self._zone(note, vel)
        rel = self.release if release is None else release
        n = int((dur + rel) * SR)
        ratio = 2 ** (((note - z['root']) * 100 + z['tune']) / 1200.0) * z['sr'] / SR
        pos = np.arange(n, dtype=np.float64) * ratio
        pcm = z['pcm']
        if z['loop'] and z['le'] - z['ls'] > 32:
            ls, le = z['ls'], z['le']
            over = pos >= le
            pos[over] = ls + np.mod(pos[over] - ls, le - ls)
        else:
            pos = pos[pos < len(pcm) - 1]
        x = np.interp(pos, np.arange(len(pcm)), pcm).astype(np.float32)
        n = len(x)
        t = np.arange(n) / SR
        a = self.attack if self.attack is not None else max(0.001, z['attack'])
        env = np.minimum(1.0, t / a)
        if not z['loop']:
            pass                                   # one-shot sample: its own decay
        else:
            # looped sustain: gentle decay toward a sustain level, like a real held note
            sus = 10 ** (-max(0, z['sustain']) / 200.0) if z['sustain'] else 0.6
            dk = max(0.05, z['decay'] or 1.0)
            env *= sus + (1 - sus) * np.exp(-t / dk)
        off = t > dur
        env[off] *= np.exp(-(t[off] - dur) / max(0.02, rel / 4))
        y = x * env * z['gain'] * self.g * (vel / 127.0) ** 1.6
        pl, pr = np.sqrt((1 - z['pan']) / 2), np.sqrt((1 + z['pan']) / 2)
        return np.stack([y * pl * 1.41, y * pr * 1.41], axis=1).astype(np.float32)


def inst(bank, preset, **kw):
    return Instrument(bank, preset, **kw)


def buf(seconds):
    return np.zeros((int(seconds * SR), 2), np.float32)


def add(dst, src, at, gain=1.0, pan=0.0, wrap=False):
    """Mix src into dst at time `at` seconds. wrap=True folds anything past the end back to the start (seamless loops)."""
    i = int(at * SR) % len(dst) if wrap else int(at * SR)
    if pan:
        src = src * np.array([np.sqrt(1 - pan) if pan > 0 else 1, np.sqrt(1 + pan) if pan < 0 else 1], np.float32)
    n = len(src)
    end = min(len(dst), i + n)
    dst[i:end] += src[:end - i] * gain
    rest = src[end - i:]
    if wrap and len(rest):
        k = 0
        while len(rest):
            m = min(len(dst), len(rest))
            dst[:m] += rest[:m] * gain
            rest = rest[m:]
    return dst


def lowpass(x, f):
    return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x, axis=0).astype(np.float32)


def highpass(x, f):
    return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x, axis=0).astype(np.float32)


_irs = {}


def reverb(x, seconds=2.6, mix=0.3, bright=6000, predelay=0.02, wrap=False, seed=3):
    key = (seconds, bright, predelay, seed)
    if key not in _irs:
        rng = np.random.default_rng(seed)
        n = int(seconds * SR)
        t = np.arange(n) / SR
        ir = rng.standard_normal((n, 2)).astype(np.float32) * np.exp(-t * 6.9 / seconds)[:, None]
        ir = lowpass(ir, bright)
        ir[:int(predelay * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum(0)).max()
        _irs[key] = ir
    ir = _irs[key]
    if wrap:   # circular convolution: the tail of the loop rings into its start
        L = len(x)
        y = np.stack([fftconvolve(np.concatenate([x[:, c], x[:, c]]), ir[:, c])[L:2 * L] for c in range(2)], 1)
    else:
        y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return (x * (1 - mix) + y * mix * 1.6).astype(np.float32)


def master(x, peak=0.89, drive=1.0):
    x = np.tanh(x * drive) if drive != 1.0 else x
    m = np.abs(x).max() or 1
    return (x * (peak / m)).astype(np.float32)


def fade(x, fin=0.0, fout=0.0):
    n = len(x)
    if fin:
        k = int(fin * SR); x[:k] *= np.linspace(0, 1, k)[:, None]
    if fout:
        k = int(fout * SR); x[n - k:] *= np.linspace(1, 0, k)[:, None]
    return x


def save_mp3(x, path, kbps=96, mono=False):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    ch = 2
    if mono:
        pcm = pcm.mean(1).astype('<i2'); ch = 1
    p = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', str(ch), '-i', '-',
                        '-c:a', 'libmp3lame', '-b:a', f'{kbps}k', path], input=pcm.tobytes())
    assert p.returncode == 0


def noise(seconds, seed=0):
    return np.random.default_rng(seed).standard_normal(int(seconds * SR)).astype(np.float32)


def stereo(m):
    return np.stack([m, m], 1).astype(np.float32)


def env_exp(seconds, tau, attack=0.002):
    t = np.arange(int(seconds * SR)) / SR
    return (np.minimum(1, t / attack) * np.exp(-t / tau)).astype(np.float32)
