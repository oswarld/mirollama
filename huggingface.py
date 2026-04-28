from datasets import load_dataset

print("데이터셋 다운로드 중...")
# 데이터셋을 다운로드하고 메모리에 로드합니다.
dataset = load_dataset("nvidia/Nemotron-Personas-Korea")

# 지정한 로컬 경로에 저장합니다.
dataset.save_to_disk("./Nemotron-Personas-Korea")
print("다운로드 및 저장 완료!")