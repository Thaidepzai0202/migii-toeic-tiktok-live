# Bước 3 (python của VieNeu): nhấn các chữ trong *…* (kéo chậm + tăng âm lượng), xuất mỗi câu một file m4a.
#   ~/.venvs/vieneu/bin/python 3-nhan.py <thư mục tạm> <thư mục am> [mức: khong|nhe|vua|ro]
# VieNeu không có lệnh nhấn chữ, nên nhấn sau khi sinh: dóng chữ theo mốc Whisper (bước 2), cắt ở khe nhỏ tiếng giữa hai chữ.
import sys, json, re, os, subprocess, tempfile, difflib
import numpy as np, soundfile as sf
d, am, muc = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else "vua")
MUC = {"khong": None, "nhe": (0.90, 1.5), "vua": (0.82, 2.5), "ro": (0.74, 3.5)}   # (tốc độ, dB)
m = json.load(open(f"{d}/cau.json", encoding="utf-8")); sr = m["sr"]
chuan = lambda s: re.sub(r"[^\w]", "", s.lower())

def tach(text):
    """→ [(chữ, có nhấn)] bỏ thẻ [cười]…"""
    text = re.sub(r"\[[^\]]+\]", " ", text); out = []; nhan = False
    for manh in re.split(r"(\*)", text):
        if manh == "*": nhan = not nhan; continue
        out += [(c, nhan) for c in map(chuan, manh.split()) if c]
    return out

def moc_chu(ref, hyp, dai):
    """Mốc (đầu, cuối) cho từng chữ gốc, dóng theo chữ Whisper nghe được."""
    t = [None] * len(ref)
    sm = difflib.SequenceMatcher(a=[r for r, _ in ref], b=[chuan(h[0]) for h in hyp], autojunk=False)
    for _, i1, i2, j1, j2 in sm.get_opcodes():
        if i2 == i1 or j2 == j1: continue
        a, b = hyp[j1][1], hyp[j2 - 1][2]
        for k in range(i1, i2): t[k] = (a + (b - a) * (k - i1) / (i2 - i1), a + (b - a) * (k - i1 + 1) / (i2 - i1))
    i = 0
    while i < len(t):   # chữ Whisper không nghe ra: chia đều khoảng trống giữa hai chữ đã có mốc
        if t[i] is None:
            j = i
            while j < len(t) and t[j] is None: j += 1
            a = t[i - 1][1] if i else 0.0; b = t[j][0] if j < len(t) else dai
            for k in range(i, j): t[k] = (a + (b - a) * (k - i) / (j - i), a + (b - a) * (k - i + 1) / (j - i))
            i = j
        else: i += 1
    return t

def khe(w, giay, rong=0.045):
    """Dời mốc tới chỗ nhỏ tiếng nhất quanh đó, để cắt giữa hai chữ."""
    i = int(giay * sr); r = int(rong * sr); f = int(0.008 * sr)
    best, vt = 1e9, i
    for j in range(max(0, i - r), min(len(w) - f, i + r), f // 2):
        e = float(np.abs(w[j:j + f]).mean())
        if e < best: best, vt = e, j + f // 2
    return max(0, min(len(w), vt))

def keo(seg, toc):
    with tempfile.TemporaryDirectory() as td:
        sf.write(f"{td}/a.wav", seg, sr)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{td}/a.wav", "-af", f"atempo={toc}", f"{td}/b.wav"], check=True)
        return sf.read(f"{td}/b.wav", dtype="float32")[0]

def noi(ds, n=int(0.006 * 48000)):
    out = ds[0]
    for x in ds[1:]:
        k = min(n, len(out), len(x))
        if k > 0:
            r = np.linspace(0, 1, k, dtype=np.float32)
            out = np.concatenate([out[:-k], out[-k:] * (1 - r) + x[:k] * r, x[k:]])
        else: out = np.concatenate([out, x])
    return out

def nhan(w, c, muc, log):
    if MUC[muc] is None: return w
    toc, db = MUC[muc]; ref = tach(c["text"]); t = moc_chu(ref, c["chu"], len(w) / sr); doan = []; i = 0
    while i < len(ref):
        if ref[i][1]:
            j = i
            while j + 1 < len(ref) and ref[j + 1][1]: j += 1
            if t[i] and t[j] and t[j][1] - t[i][0] > 0.08:
                a = 0 if i == 0 else khe(w, t[i][0]); b = len(w) if j == len(ref) - 1 else khe(w, t[j][1])
                if b - a > 0.08 * sr: doan.append((a, b, " ".join(r for r, _ in ref[i:j + 1])))
            else: log.append(f"   ! không dóng được: {' '.join(r for r, _ in ref[i:j+1])} ({c['file']})")
            i = j + 1
        else: i += 1
    manh, truoc = [], 0
    for a, b, chu in doan:
        if a < truoc: continue
        manh += [w[truoc:a], keo(w[a:b], toc) * 10 ** (db / 20)]; truoc = b
        log.append(f"   {chu}: {(b - a) / sr:.2f}s → {(b - a) / sr / toc:.2f}s")
    manh.append(w[truoc:])
    return noi([x for x in manh if len(x)])

os.makedirs(am, exist_ok=True)
for c in m["cau"]:
    c = dict(c, file=os.path.relpath(c["file"], d)); log = []
    w = sf.read(f"{d}/{c['file']}", dtype="float32")[0]
    out = np.clip(nhan(w, c, muc, log), -0.98, 0.98)
    sf.write(f"{d}/_nhan.wav", out, sr)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{d}/_nhan.wav", "-c:a", "aac", "-b:a", "96k", f"{am}/{c['i']:02d}.m4a"], check=True)
    print(c["i"], f"{len(w)/sr:.2f}s → {len(out)/sr:.2f}s", "|", "; ".join(l.strip() for l in log))
os.remove(f"{d}/_nhan.wav")
