import argparse
from datasets import load_from_disk

def main() -> None:
    parser = argparse.ArgumentParser(description='Sample personas from the local Hugging Face dataset.')
    parser.add_argument('--input', type=str, default='./Nemotron-Personas-Korea', help='Path to the local dataset directory')
    parser.add_argument('--output', type=str, default='personas_sample.jsonl', help='Output JSONL file path')
    parser.add_argument('--count', type=int, default=100, help='Number of personas to sample')
    parser.add_argument('--min-age', type=int, default=0, help='Minimum age')
    parser.add_argument('--max-age', type=int, default=100, help='Maximum age')
    
    args = parser.parse_args()

    print("Loading local dataset...")
    try:
        dataset = load_from_disk(args.input)
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    ds = dataset['train'] if 'train' in dataset else dataset

    print(f"Total records found: {len(ds)}")

    if args.min_age > 0 or args.max_age < 100:
        print(f"Filtering by age: {args.min_age} to {args.max_age}...")
        ds = ds.filter(lambda x: args.min_age <= x['age'] <= args.max_age)
        print(f"Records after filtering: {len(ds)}")

    sample_size = min(args.count, len(ds))
    print(f"Sampling {sample_size} records...")
    
    ds = ds.shuffle(seed=42).select(range(sample_size))

    print(f"Exporting to {args.output}...")
    ds.to_json(args.output, force_ascii=False)
    print("Done!")

if __name__ == '__main__':
    main()
