# Bước 1 (python của VieNeu): sinh từng câu tiếng Việt của bài thành wav riêng.
#   ~/.venvs/vieneu/bin/python 1-sinh.py <bài.json> <thư mục tạm> [số bước cần sinh lại, cách nhau dấu phẩy]
# Mỗi lần sinh ra hơi khác nhau: câu nào bước 2 chép lại sai chữ thì sinh lại riêng câu đó.
# Trong lời: *chữ cần nhấn*. Chữ nhấn xử lý ở bước 3, ở đây chỉ bỏ dấu *.
import sys, json, os, warnings
warnings.filterwarnings("ignore")
import numpy as np
from vieneu import Vieneu
from vieneu_utils.core_utils import trim_and_fade
bai, out = json.load(open(sys.argv[1], encoding="utf-8")), sys.argv[2]
os.makedirs(out, exist_ok=True)
lai = {int(x) for x in sys.argv[3].split(",")} if len(sys.argv) > 3 else None
v = Vieneu(); sr = v.sample_rate; ds = []
for i, b in enumerate(bai["buoc"]):
    if b["l"] != "vi": continue
    f = f"{out}/{i:02d}.wav"
    if lai is not None and i not in lai:
        ds.append({"i": i, "file": f, "text": b["t"]}); continue
    w = trim_and_fade(np.asarray(v.infer(b["t"].replace("*", ""), voice=bai["giong"]), dtype=np.float32), sr)
    v.save(w, f); ds.append({"i": i, "file": f, "text": b["t"]})
    print(i, round(len(w) / sr, 2), b["t"], flush=True)
json.dump({"sr": sr, "cau": ds}, open(f"{out}/cau.json", "w"), ensure_ascii=False, indent=1)
