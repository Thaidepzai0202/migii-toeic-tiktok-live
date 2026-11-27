# Bước 2 (python của mlx-whisper): mốc giờ từng chữ của mỗi câu, để bước 3 biết chữ cần nhấn nằm ở đâu.
#   ~/.venvs/whisper/bin/python 2-moc.py <thư mục tạm>
import sys, json, mlx_whisper
d = sys.argv[1]; m = json.load(open(f"{d}/cau.json", encoding="utf-8"))
for c in m["cau"]:
    r = mlx_whisper.transcribe(c["file"], path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="vi",
                               condition_on_previous_text=False, word_timestamps=True)
    c["nghe"] = r["text"].strip()
    c["chu"] = [[w["word"].strip(), round(float(w["start"]), 3), round(float(w["end"]), 3)] for s in r["segments"] for w in s.get("words", [])]
    print(c["i"], c["nghe"], flush=True)
json.dump(m, open(f"{d}/cau.json", "w"), ensure_ascii=False, indent=1)
