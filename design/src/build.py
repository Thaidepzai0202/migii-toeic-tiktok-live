"""Dựng HTML cho Figma: màn live Migii TOEIC theo Design System (mặc định bản sáng).

Chạy từ thư mục gốc repo:
    python3 -I design/src/build.py [--theme light|dark] [--fonts <thư mục font>] [--out design/out] [--preview <thư mục>]

Ghi ra <out>/:
    migii-live-figma-<sang|toi>.html     tất cả khung trên một bảng vẽ
    frames-<sang|toi>/NN-<tên>.html      mỗi khung một file (1080 px rộng) nếu muốn import từng khung
Font SVN-Avo (thương mại, chưa xác nhận giấy phép) được nhúng vào file ra, nên thư mục out/ nằm ngoài git.

--preview: ghi thêm bản có script đo tràn nội dung, chỉ để kiểm tra khi sửa thiết kế (không dùng để import).
Màu chép từ migii_design_system/docs/design/design-tokens.json. 1 dp = 3 px: khung 360 x 640 dp = 1080 x 1920 px.
"""
import base64
import html
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "design" / "src"
IMG = ROOT / "public" / "img"
DEFAULT_FONTS = ROOT.parent / "migii_toeic_ios" / "Migii Toeic" / "viewmodel" / "source" / "font"

args = sys.argv[1:]


def opt(name, default):
    return args[args.index(name) + 1] if name in args else default


FONTS = pathlib.Path(opt("--fonts", DEFAULT_FONTS))
OUT = pathlib.Path(opt("--out", ROOT / "design" / "out"))
PREVIEW = opt("--preview", None)
PREVIEW = pathlib.Path(PREVIEW) if PREVIEW else None
THEME = opt("--theme", "light")
assert THEME in ("light", "dark"), "--theme phải là light hoặc dark"
SLUG = {"light": "sang", "dark": "toi"}[THEME]
SCALE = 3  # 1 dp = 3 px

# ---------------------------------------------------------------- token (design-tokens.json)
TOKENS = {
    "light": dict(
        background="#edf3f1", surface="#ffffff", surfaceInner="#e4edea",
        textPrimary="#10201e", textSecondary="#3b524e", textHint="#506762",
        textOnPrimary="#06201c", textOnAccent="#ffffff",
        primary="#48bcaa", primaryText="#1c7a6c", primarySurface="#d3eee8",
        accent="#a85600", error="#d33a49", errorOn="#ffffff",
        ramp1="#d9ede8", ramp2="#bce3da", ramp3="#93d6c7", ramp4="#62c6b3", ramp5="#2fa18f",
        rampInk="#032220", rampInk5="#032220",
        glow="rgba(72,188,170,.16)",
        # chỉ dành cho bảng vẽ, không thuộc design system
        canvas="#dfe5e3", canvasText="#33403d", canvasTitle="#10201e", canvasCode="#1c7a6c",
        guide="rgba(16,32,30,.06)", swatchLine="rgba(16,32,30,.18)",
    ),
    "dark": dict(
        background="#081615", surface="#132724", surfaceInner="#1b322e",
        textPrimary="#e4f1ee", textSecondary="#a9c0bb", textHint="#88a29c",
        textOnPrimary="#04110f", textOnAccent="#1a0f00",
        primary="#48bcaa", primaryText="#72e4d1", primarySurface="#1b4a43",
        accent="#f7a033", error="#f0626e", errorOn="#04110f",
        ramp1="#13332e", ramp2="#1a463e", ramp3="#22594f", ramp4="#2a6d60", ramp5="#48bcaa",
        rampInk="#ddf3ee", rampInk5="#04110f",
        glow="rgba(72,188,170,.18)",
        canvas="#1c2120", canvasText="#c9d4d1", canvasTitle="#ffffff", canvasCode="#9fe3d6",
        guide="rgba(255,255,255,.045)", swatchLine="rgba(255,255,255,.2)",
    ),
}[THEME]


def rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def mix(top, pct, base):
    t, b = rgb(top), rgb(base)
    return "#" + "".join(f"{round(b[i] + (t[i] - b[i]) * pct / 100):02x}" for i in range(3))


TOKENS["stateCorrect"] = mix(TOKENS["primary"], 18, TOKENS["surface"])
TOKENS["stateWrong"] = mix(TOKENS["error"], 14, TOKENS["surface"])
TOKENS["stateNotice"] = mix(TOKENS["accent"], 12, TOKENS["surface"])


# ---------------------------------------------------------------- tiện ích
def b64(path):
    return base64.b64encode(pathlib.Path(path).read_bytes()).decode("ascii")


def dp(text):
    return re.sub(r"(-?(?:\d+\.?\d*|\.\d+))dp\b", lambda m: f"{float(m.group(1)) * SCALE:g}px", text)


def style_dp(markup):
    """Đổi dp → px chỉ trong thuộc tính style="…" (không đụng chuỗi base64 của ảnh/font)."""
    return re.sub(r'style="([^"]*)"', lambda m: 'style="' + dp(m.group(1)) + '"', markup)


def esc(s):
    return html.escape(s, quote=False)


def data_uri(path, mime):
    return f"data:{mime};base64,{b64(path)}"


# ---------------------------------------------------------------- icon (nét, khung 24)
ICON = {
    "bolt": '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    "book": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    "headphones": '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    "shuffle": '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
    "repeat": '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    "pen": '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    "gift": '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    "chat": '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    "award": '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    "crown": '<path d="M2 6l4.5 5L12 4l5.5 7L22 6l-2 13H4z"/><path d="M4 22h16"/>',
    "check": '<polyline points="20 6 9 17 4 12"/>',
    "heart": '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    "volume": '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
}


def ic(name, size=20, sw=1.8, color=None):
    style = f' style="color:var(--{color})"' if color else ""
    return (f'<svg class="ic"{style} width="{size * SCALE}" height="{size * SCALE}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            f'{ICON[name]}</svg>')


# ---------------------------------------------------------------- dữ liệu mẫu (lấy từ kho từ / sim của game)
ETS = "TOEIC® là thương hiệu đã đăng ký của ETS; sản phẩm này không được ETS xác nhận hay phê duyệt."
LOGO = data_uri(IMG / "appicon.png", "image/png")
NINJA = data_uri(IMG / "ninja.png", "image/png")
NINJA_HERO = data_uri(IMG / "ninja-hero.png", "image/png")
QR_SVG = (SRC / "qr-mau.svg").read_text(encoding="utf-8").strip()

RAMP_BY_RANK = {1: (5, "rampInk5"), 2: (4, "rampInk"), 3: (3, "rampInk"), 4: (2, "rampInk"), 5: (2, "rampInk")}
FONT_OF = {20: 12, 24: 12, 28: 14, 32: 14, 36: 16, 40: 16, 48: 18, 56: 20}


# ---------------------------------------------------------------- thành phần
def av(name, size=24, rank=4):
    n, ink = RAMP_BY_RANK.get(rank, (2, "rampInk"))
    fs = FONT_OF.get(size, 14)
    return (f'<span class="av" style="width:{size}dp;height:{size}dp;background:var(--ramp{n});color:var(--{ink});'
            f'font-size:{fs}dp;line-height:{fs + 4}dp">{esc(name[:1].upper())}</span>')


def tag(icon, *parts):
    labels = '<i class="dot"></i>'.join(f'<span class="t-label">{esc(p)}</span>' for p in parts)
    return f'<span class="tag">{ic(icon, 16, 2)}{labels}</span>'


def topbar(tag_html=""):
    return f'<header class="topbar"><img class="logo" src="{LOGO}" alt=""><span class="brand">Migii TOEIC</span>{tag_html}</header>'


def timer(pct, secs):
    return (f'<div class="timer"><div class="bar"><div class="fill" style="width:{pct}%"></div></div>'
            f'<span class="secs">{secs}</span></div>')


def options(texts, ok=None):
    out = []
    for i, t in enumerate(texts):
        cls = "opt" if ok is None else ("opt ok" if i == ok else "opt dim")
        n = ic("check", 18, 2.6) if ok == i else str(i + 1)
        out.append(f'<div class="{cls}"><span class="n">{n}</span><span class="tx">{esc(t)}</span></div>')
    return f'<div class="opts">{"".join(out)}</div>'


def hint(left, check=False):
    lead = ic("check", 16, 2.4, "primaryText") if check else ""
    return f'<div class="hintrow"><span class="t-support" style="display:flex;align-items:center;gap:6dp">{lead}{esc(left)}</span></div>'


def cell(rank, name, pts):
    return (f'<div class="cell"><div class="top">{av(name, 24, rank)}<b>{pts}</b></div><span class="nm">{esc(name)}</span></div>')


def cell_empty(text="Chưa có ai"):
    return f'<div class="cell empty"><span class="t-support c-hint">{esc(text)}</span></div>'


def cells(*items):
    return f'<div class="cells">{"".join(items)}</div>'


def foot(promo=True):
    p = f'<div class="promo">{ic("gift", 18)}<span>Tặng quà: nhân đôi điểm 3 câu tiếp</span></div>' if promo else ""
    return f'<div class="foot">{p}<div class="ets">{esc(ETS)}</div></div>'


def qr_card(title, sub, qr=56):
    return (f'<div class="appcard"><img class="logo" src="{LOGO}" alt="" style="width:40dp;height:40dp;border-radius:10dp">'
            f'<div class="tx"><span class="t-bodyStrong">{esc(title)}</span><span class="t-support">{esc(sub)}</span></div>'
            f'<div class="qr" style="width:{qr}dp;height:{qr}dp">{QR_SVG}</div></div>')


FRAMES = []  # (id, nhãn, ghi chú, html trong .body, là bảng tham chiếu?)


def frame(fid, label, note, body, sheet=False):
    FRAMES.append((fid, label, note, body, sheet))


# ---------------------------------------------------------------- các khung
# 1. Màn chờ giữa lượt
frame("f-wait", "Màn chờ giữa lượt", "breakScr", f"""
{topbar(tag("book", "Buổi học 1"))}
<div class="card hero"><img src="{NINJA_HERO}" alt="" style="width:80dp;height:80dp"><div class="tx">
  <span class="t-title">Đố từ vựng TOEIC</span>{tag("book", "Giờ học")}</div></div>
<div class="count" style="padding:0 20dp"><span class="num">20</span><div class="col"><span class="t-support">giây nữa bắt đầu</span>
  <div class="bar"><div class="fill" style="width:72%"></div></div></div></div>
<div class="card rules">
  <div class="rule"><span class="ico">{ic("chat", 14)}</span><span class="t-support" style="color:var(--textPrimary)">Bình luận để vào lớp</span></div>
  <div class="rule"><span class="ico">{ic("bolt", 14)}</span><span class="t-support" style="color:var(--textPrimary)">Gõ 1-4 chọn nghĩa, nhanh nhất +10</span></div>
  <div class="rule"><span class="ico">{ic("award", 14)}</span><span class="t-support" style="color:var(--textPrimary)">Cuối buổi vinh danh Top 3</span></div>
</div>
{qr_card("Tải app Migii TOEIC", "Ôn lại từ vừa chơi")}
{foot(False)}""")

# 2. Giờ học
frame("f-class", "Giờ học", "class", f"""
{topbar(tag("book", "Giờ học", "1/3"))}
<div class="card lesson" style="align-items:center;text-align:center">
  <div style="display:flex;align-items:center;gap:8dp"><span class="t-label">Basic</span><i class="dot c-primary"></i><span class="t-label">Bài 16</span></div>
  <span class="t-display" style="margin-top:10dp">hear</span>
  <div class="qcard" style="padding:0"><div class="meta"><span class="ipa" style="font-size:18dp;line-height:24dp;color:var(--primaryText)">/hɪə(r)/</span><span class="pos">v</span></div></div>
  <span class="t-title meaning">Nghe</span>
  <span class="t-support ex" style="color:var(--textPrimary)">he doesn't hear well</span>
  <span class="t-support c-hint">anh ta nghe không rõ</span>
  <div class="steps"><i class="on"></i><i></i><i></i></div>
</div>
<div class="teacher"><img src="{NINJA}" alt=""><div class="bubble">Đọc to theo Ninja nào! Lát nữa kiểm tra đó</div></div>
<div class="seats">{av("Ngọc Ánh", 40, 1)}{av("Thu Hà", 40, 2)}{av("Lan Anh", 40, 3)}{av("Tuấn Kiệt", 40, 4)}{av("Khánh Linh", 40, 4)}<span class="seat" style="display:flex;align-items:center;justify-content:center"><span class="t-support">+7</span></span></div>
{foot(False)}""")

# 3. Đố nhanh · đang chơi
QUIZ = ["Sân bay", "Tháng", "Khách hàng", "Đường"]
frame("f-quiz", "Đố nhanh · đang chơi", "quiz", f"""
{topbar(tag("bolt", "Đố nhanh", "1/5"))}
<div class="card sm qcard"><span class="t-display">airport</span>
  <div class="meta"><span class="ipa">/ˈeəpɔːt/</span><span class="pos">n</span></div>{timer(62, 9)}</div>
{options(QUIZ)}
{hint("Gõ số 1-4 vào bình luận")}
{cells(cell(1, "Ngọc Ánh", 10), cell(2, "Thu Hà", 8), cell(3, "Lan Anh", 6))}
{foot()}""")

# 4. Đố nhanh · hết giờ, lộ đáp án
frame("f-quiz-ok", "Đố nhanh · lộ đáp án", "quiz (hết giờ)", f"""
{topbar(tag("bolt", "Đố nhanh", "1/5"))}
<div class="card sm qcard"><span class="t-display">airport</span>
  <div class="meta"><span class="ipa">/ˈeəpɔːt/</span><span class="pos">n</span></div>{timer(0, 0)}</div>
{options(QUIZ, ok=0)}
{hint("Đáp án: sân bay", check=True)}
{cells(cell(1, "Ngọc Ánh", 20), cell(2, "Thu Hà", 16), cell(3, "Lan Anh", 12))}
{foot()}""")

# 5. Ghép chữ
tiles = "".join(f'<div class="tile"><span class="no">{i + 1}</span>{c}</div>' for i, c in enumerate("terrei"))
frame("f-scramble", "Ghép chữ", "scramble", f"""
{topbar(tag("shuffle", "Ghép chữ", "1/5"))}
<div class="card sm qcard"><span class="t-display">Về hưu</span>
  <span class="t-support prompt">Xếp các chữ cái cho đúng thứ tự</span>
  <div class="tiles">{tiles}</div>{timer(80, 12)}</div>
{hint("Gõ số các thẻ theo thứ tự, vd 654321")}
{cells(cell(1, "phuongthao_", 10), cell_empty(), cell_empty())}
{foot()}""")

# 6. Luyện tai
frame("f-listen", "Luyện tai", "listen", f"""
{topbar(tag("headphones", "Luyện tai", "1/5"))}
<div class="card sm qcard" style="gap:8dp"><div class="wave" style="width:64dp;height:64dp;border-radius:32dp"><div class="r2" style="width:48dp;height:48dp;border-radius:24dp"><div class="r3" style="width:34dp;height:34dp;border-radius:17dp">{ic("volume", 18, 2)}</div></div></div>
  <span class="t-heading">Nghe và chọn nghĩa đúng</span>{timer(80, 12)}</div>
{options(["Giúp đỡ", "Bán", "Viết", "Sửa chữa"])}
{cells(cell(1, "Bảo Ngân", 10), cell(2, "Như Quỳnh", 8), cell_empty())}
{foot()}""")

# 8. Chọn từ tiếng Anh
frame("f-reverse", "Chọn từ tiếng Anh", "reverse", f"""
{topbar(tag("repeat", "Chọn từ", "1/5"))}
<div class="card sm qcard"><span class="t-display">Nhận</span>
  <span class="t-support prompt">tiếng Anh là từ nào?</span>{timer(80, 12)}</div>
{options(["receive", "rent", "accept", "include"])}
{hint("Gõ số 1-4 vào bình luận")}
{cells(cell(1, "Như Quỳnh", 10), cell(2, "duyhoang.dev", 8), cell(3, "Hoàng Nam", 6))}
{foot()}""")

# 9. Nghe & gõ chính tả
letters = '<div class="letter" style="width:34dp">v</div>' + '<div class="letter" style="width:34dp"></div>' * 6
frame("f-type", "Nghe & gõ chính tả", "type", f"""
{topbar(tag("pen", "Chính tả", "1/5"))}
<div class="card sm qcard"><span class="t-display">Xe</span>
  <span class="t-support prompt" style="display:flex;align-items:center;gap:6dp">{ic("headphones", 16)}Nghe và gõ từ tiếng Anh</span>
  <div class="letters">{letters}</div>{timer(80, 12)}</div>
{hint("Gõ từ 7 chữ cái vào bình luận")}
{cells(cell(1, "Kim Chi", 10), cell_empty(), cell_empty())}
{foot()}""")

# 10. Vinh danh
frame("f-podium", "Vinh danh top 3", "podiumScr", f"""
{topbar(tag("award", "Hết lượt 1"))}
<div style="display:flex;justify-content:center;padding-top:2dp"><span class="t-title">Vinh danh</span></div>
<div class="podium">
  <div class="pcol">{av("Thu Hà", 40, 2)}<span class="t-support nm">Thu Hà</span>
    <div class="pillar" style="height:76dp;background:var(--ramp4)"><span class="t-title" style="color:var(--rampInk)">2</span><span class="t-support" style="color:var(--rampInk)">8 điểm</span></div></div>
  <div class="pcol"><span class="crown">{ic("crown", 22, 1.8)}</span>{av("Ngọc Ánh", 40, 1)}<span class="t-bodyStrong nm">Ngọc Ánh</span>
    <div class="pillar" style="height:96dp;background:var(--ramp5)"><span class="t-title" style="color:var(--rampInk5)">1</span><span class="t-support" style="color:var(--rampInk5)">10 điểm</span></div></div>
  <div class="pcol">{av("Lan Anh", 40, 3)}<span class="t-support nm">Lan Anh</span>
    <div class="pillar" style="height:64dp;background:var(--ramp3)"><span class="t-title" style="color:var(--rampInk)">3</span><span class="t-support" style="color:var(--rampInk)">6 điểm</span></div></div>
</div>
<div class="row-card"><span class="ico">{ic("bolt", 18)}</span><span class="t-support grow">Nhanh tay nhất</span><span class="t-bodyStrong">Ngọc Ánh</span></div>
{qr_card("Tải app Migii TOEIC", "Ôn lại từ vừa chơi")}
{foot(False)}""")

# 11. Cảm ơn cuối phiên
frame("f-outro", "Cảm ơn cuối phiên", "outro", f"""
{topbar(tag("heart", "Hết phiên"))}
<div style="display:flex;flex-direction:column;gap:4dp;padding-top:2dp"><span class="t-title">Cảm ơn mọi người đã chơi cùng Migii TOEIC!</span>
  <span class="t-support">1 câu, 24 người chơi, 3 lượt trả lời đúng</span></div>
{cells(cell(1, "Thu Hà", 48), cell(2, "Tuấn Kiệt", 42), cell(3, "Khánh Linh", 38))}
<div class="card sm" style="gap:8dp"><span class="t-label" style="display:flex;align-items:center;gap:6dp">{ic("gift", 16, 2)}Cảm ơn những bạn tặng quà</span>
  <div class="chips"><span class="chip">{av("Khánh Linh", 24, 4)}Khánh Linh</span><span class="chip">{av("Tuấn Kiệt", 24, 4)}Tuấn Kiệt</span></div></div>
{qr_card("Tải app Migii TOEIC", "Hẹn gặp lại 20h tối mai")}
{foot(False)}""")

# 12a. Token màu
SW = ["background", "surface", "surfaceInner", "textPrimary", "textSecondary", "textHint", "primary", "primaryText", "primarySurface",
      "accent", "error", "stateCorrect", "ramp1", "ramp2", "ramp3", "ramp4", "ramp5"]
sw_html = "".join(
    f'<div class="sw" style="background:none;padding:0"><div class="chipc" style="height:26dp;background:{TOKENS[n]};border:1dp solid var(--swatchLine)"></div>'
    f'<b>{n}</b><span>{TOKENS[n].upper()}</span></div>' for n in SW)
sw_html += ('<div class="sw" style="background:none;padding:0"><div class="chipc" style="height:26dp;border:1dp solid var(--swatchLine);'
            'background:radial-gradient(ellipse 120% 100% at 50% 120%,var(--glow),rgba(72,188,170,0) 80%),var(--background)"></div>'
            '<b>glow</b><span>#48BCAA ' + ("16%" if THEME == "light" else "18%") + '</span></div>')
frame("f-tokens", f"Token · màu ({'sáng' if THEME == 'light' else 'tối'})", "design-tokens.json", f"""
<div class="sheet-title"><span class="t-title">Màu</span></div>
<div class="swatches" style="gap:12dp 8dp">{sw_html}</div>
<span class="t-support c-hint" style="margin-top:4dp">Không đổ bóng, không viền (viền ô màu chỉ để nhìn rõ trong bảng này). Mỗi màn chỉ một điểm cam.</span>
""", sheet=True)


# 12b. Token chữ + bo góc
def spec(cls, sample, info):
    return f'<div class="specimen"><span class="{cls}">{sample}</span><small>{info}</small></div>'


radius = [("card", 28), ("option", 26), ("button", 20), ("chip", 16), ("sm", 12)]
rad_html = "".join(
    f'<div style="display:flex;flex-direction:column;align-items:center;gap:4dp"><div style="width:48dp;height:48dp;background:var(--surface);border-radius:{r}dp"></div>'
    f'<span class="t-support c-hint" style="font-size:12dp;line-height:16dp">{n} {r}</span></div>' for n, r in radius)
frame("f-type-scale", "Token · chữ và bo góc", "design-tokens.json", f"""
<div class="sheet-title"><span class="t-title">Chữ</span></div>
<div style="display:flex;flex-direction:column;gap:12dp">
{spec("t-display", "Aa airport", "display 40/44 · 700")}
{spec("t-title", "Giờ học", "title 24/30 · Migii Serif")}
{spec("t-heading", "Nghe và chọn", "heading 18/24 · 700")}
{spec("t-body", "Nội dung chính", "body 16/24 · 400")}
{spec("t-bodyStrong", "Nội dung nhấn", "bodyStrong 16/24 · 700")}
{spec("t-support", "Mô tả phụ", "support 14/20 · 400")}
{spec("t-label", "Nhãn đầu khối", "label 12/16 · 700 · HOA")}
</div>
<div class="sheet-title" style="margin-top:12dp"><span class="t-title">Bo góc</span></div>
<div style="display:flex;justify-content:space-between">{rad_html}</div>
""", sheet=True)


# 13. Thành phần
def cap(text):
    return f'<span class="t-label" style="margin-top:2dp">{esc(text)}</span>'


frame("f-components", "Thành phần", "tổng hợp", f"""
{cap("Thanh thương hiệu")}{topbar(tag("bolt", "Đố nhanh", "1/5"))}
{cap("Tag, chip, nhãn")}
<div class="chips"><span class="tag">{ic("book", 16, 2)}<span class="t-label">Giờ học</span></span><span class="pos">n</span><span class="delta">+10</span><span class="chip plain">Chip</span></div>
{cap("Đáp án: mặc định, đúng, mờ")}
<div class="opts">
  <div class="opt"><span class="n">1</span><span class="tx">Mặc định</span></div>
  <div class="opt ok"><span class="n">{ic("check", 18, 2.6)}</span><span class="tx">Đúng</span></div>
  <div class="opt dim" style="grid-column:1 / -1"><span class="n">3</span><span class="tx">Mờ đi (đáp án không đúng khi lộ kết quả)</span></div>
</div>
{cap("Đồng hồ")}{timer(62, 9)}
{cap("Nút chính (cao 48, bo 20)")}
<div class="btn">Bắt đầu</div>
{cap("Thông báo quà")}
<div class="toast"><img src="{NINJA}" alt="" style="width:36dp;height:36dp;border-radius:18dp;background:var(--surfaceInner)"><div class="tx"><div class="t-bodyStrong">Khánh Linh</div><div class="t-support">vừa tặng quà, x2 điểm 3 câu</div></div>{ic("gift", 22, 1.8, "accent")}</div>
{cap("MC Ninja trả lời bình luận")}
<div class="teacher" style="gap:10dp"><img src="{NINJA}" alt="" style="width:40dp;height:40dp;border-radius:20dp"><div class="bubble" style="font:400 14dp/20dp var(--sans);padding:8dp 12dp"><span class="c-hint">Lan Anh hỏi: từ này dùng thế nào?</span><br><b>Ninja: Dùng trước danh từ nhé!</b></div></div>
""", sheet=True)


# ---------------------------------------------------------------- lắp trang
def render_frame(fid, label, note, body, sheet):
    guides = "" if sheet else '<div class="tt-guide top">TikTok che</div><div class="tt-guide bottom">TikTok che</div>'
    cls = "frame sheet" if sheet else "frame"
    return style_dp(f'<section class="slot"><div class="slot-label">{esc(label)}<small>1080 × 1920 · #{fid} · {esc(note)}</small></div>'
                    f'<div class="{cls}" id="{fid}"><div class="glow"></div>{guides}<div class="body">{body}</div></div></section>')


def font_faces():
    face = '@font-face{{font-family:"{fam}";font-weight:{w};font-style:normal;src:url(data:font/ttf;base64,{d}) format("truetype");}}\n'
    return (face.format(fam="SVN-Avo", w=400, d=b64(FONTS / "SVN-AVO.TTF"))
            + face.format(fam="SVN-Avo", w=700, d=b64(FONTS / "SVN-AVO-BOLD.TTF"))
            + face.format(fam="Migii Serif", w=700, d=b64(FONTS / "MigiiSerif-Bold.ttf")))


def stylesheet(board_w):
    css = (SRC / "styles.css").read_text(encoding="utf-8")
    token_css = "\n".join(f"  --{k}: {v};" for k, v in TOKENS.items())
    css = css.replace("{{TOKENS}}", token_css).replace("{{BOARD_W}}", str(board_w))
    left = re.findall(r"\{\{\w+\}\}", css)
    assert not left, left
    return dp(css)


NAME = "sáng" if THEME == "light" else "tối"
HEAD_NOTE = ("Màn live Migii TOEIC dựng lại theo Design System. Khung 1080 × 1920 px = 360 × 640 dp, 1 dp = 3 px, "
             "nên mọi số trong file này chia 3 là ra đúng token. Vùng xám nhạt &quot;TikTok che&quot; là lớp hướng dẫn: ẩn hoặc xoá trước khi xuất.")
HEAD_NOTE2 = ("Font: SVN-Avo (tên nội bộ trong file là UTM Aptima) và Migii Serif Bold. Cần cài cả hai trong Figma. "
              "SVN-Avo không có ký tự phiên âm IPA, ®, dấu chấm giữa, nên các ký tự đó dùng font hệ thống. "
              "Icon là nét 1.8 dạng tạm, thay bằng bộ icon chính thức của app.")


def page(title, frames, board_w, extra_head="", extra_body=""):
    body = "".join(render_frame(*f) for f in frames)
    return f"""<!doctype html>
<html lang="vi" data-theme="{THEME}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width={board_w}">
<title>{esc(title)}</title>
<style>
{font_faces()}
{stylesheet(board_w)}
</style>
{extra_head}
</head>
<body>
<div class="page-head"><h1>{esc(title)}</h1><p>{HEAD_NOTE}</p><p>{HEAD_NOTE2}</p></div>
<div class="board">{body}</div>
{extra_body}
</body>
</html>
"""


# Script đo tràn: chỉ cho bản xem trước
MEASURE = """<script>
addEventListener('load', () => { document.querySelectorAll('.frame').forEach((f) => {
  const fr = f.getBoundingClientRect(); const b = f.querySelector('.body');
  const kids = [...b.children]; let over = 0;
  kids.forEach((k) => { over = Math.max(over, k.getBoundingClientRect().bottom - fr.top - 1600); });
  const lowest = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom - fr.top));
  const cut = [...f.querySelectorAll('*')].filter((k) => k.scrollWidth > k.clientWidth + 2 && getComputedStyle(k).overflow !== 'visible' && k.className).map((k) => k.className).join(',');
  const m = document.createElement('pre'); m.id = 'measure-' + f.id;
  m.textContent = `${f.id}: lowest=${Math.round(lowest / 3)}dp over1600=${Math.round(over / 3)}dp clipped=[${cut}]`;
  document.body.appendChild(m);
}); });
</script>"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    fdir = OUT / f"frames-{SLUG}"
    fdir.mkdir(exist_ok=True)
    for stale in fdir.glob("*.html"):  # bỏ file lẻ của lần dựng trước (số thứ tự đổi khi thêm/bớt khung)
        stale.unlink()
    cols = 4
    board_w = cols * 1080 + (cols - 1) * 96 + 2 * 96
    p = OUT / f"migii-live-figma-{SLUG}.html"
    p.write_text(page(f"Migii TOEIC Live · Figma · {NAME.capitalize()}", FRAMES, board_w), encoding="utf-8")
    print(f"wrote {p} ({p.stat().st_size // 1024} KB, {len(FRAMES)} khung, bảng rộng {board_w}px)")
    for i, fr in enumerate(FRAMES, 1):
        f = fdir / f"{i:02d}-{fr[0][2:]}.html"
        f.write_text(page(f"Migii TOEIC Live · {fr[1]}", [fr], 1080 + 192), encoding="utf-8")
    print(f"wrote {len(FRAMES)} file lẻ trong {fdir}")
    if PREVIEW:
        PREVIEW.mkdir(parents=True, exist_ok=True)
        solo = "<style>.page-head,.slot-label{display:none}.board{padding:0;width:1080px}pre{position:absolute;left:0;top:0;opacity:0}</style>"
        for i, fr in enumerate(FRAMES, 1):
            f = PREVIEW / f"{i:02d}-{fr[0][2:]}.html"
            f.write_text(page(f"preview {fr[1]}", [fr], 1080, extra_head=solo, extra_body=MEASURE), encoding="utf-8")
        print(f"wrote preview vào {PREVIEW}")


main()
