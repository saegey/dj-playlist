import random
import numpy as np
import json


def cosine_similarity(a, b, norm_a, norm_b):
    return np.dot(a, b) / (norm_a * norm_b)


def score_transition(i, j, embeddings, norms, bpms):
    sim = np.dot(embeddings[i], embeddings[j]) / (norms[i] * norms[j])
    bpm_diff = abs(bpms[i] - bpms[j]) / 10
    return sim - bpm_diff


def score_playlist(order, embeddings, norms, bpms):
    return sum(
        score_transition(order[k], order[k+1], embeddings, norms, bpms)
        for k in range(len(order)-1)
    )


def crossover(p1, p2):
    size = len(p1)
    slice_size = size // 2
    start = random.randint(0, size - slice_size)
    slice_ = p1[start:start + slice_size]
    rest = [x for x in p2 if x not in slice_]
    return slice_ + rest


def mutate(order, rate=0.05):
    if random.random() < rate:
        i, j = random.sample(range(len(order)), 2)
        order[i], order[j] = order[j], order[i]
    return order


def run_genetic_algorithm(tracks, generations=20, pop_size=40, seed=None, seed_idx=None):
    """
    Runs a genetic algorithm to order tracks by embedding similarity and BPM continuity.

    Args:
        tracks (list[dict]): Each dict must have keys 'embedding' (JSON string) and optional 'bpm'.
        generations (int): Number of evolution cycles.
        pop_size (int): Population size.
        seed (int, optional): Seed for reproducibility.
        seed_idx (int, optional): Index of track to pin as first in playlist.

    Returns:
        list[dict]: Ordered list of track dicts.
    """
    n = len(tracks)
    # Seed RNGs
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    # Prepare arrays
    embeddings = np.array([json.loads(t['embedding'])
                          for t in tracks], dtype=np.float32)
    norms = np.linalg.norm(embeddings, axis=1)
    bpms = np.array([t.get('bpm', 0) for t in tracks], dtype=np.float32)
    # Initialize population
    if seed_idx is None:
        population = [random.sample(range(n), n) for _ in range(pop_size)]
    else:
        rest = list(range(n))
        rest.remove(seed_idx)
        population = [[seed_idx] +
                      random.sample(rest, n-1) for _ in range(pop_size)]
    # Evolve
    for _ in range(generations):
        scored = sorted(
            population,
            key=lambda order: score_playlist(order, embeddings, norms, bpms),
            reverse=True
        )
        top = scored[:10]
        new_gen = top[:2]  # elitism
        while len(new_gen) < pop_size:
            p1, p2 = random.sample(top, 2)
            child = mutate(crossover(p1[:], p2[:]))
            new_gen.append(child)
        population = new_gen
    # Select best and tie-break reverse
    best = max(population, key=lambda o: score_playlist(
        o, embeddings, norms, bpms))
    rev = list(reversed(best))
    canonical = min(best, rev)
    return [tracks[i] for i in canonical]


# Example usage:
if __name__ == '__main__':
    # Example track list (replace with real embeddings/BPMs)
    my_tracks = [
        {'embedding': json.dumps([0.1, 0.2, 0.3]), 'bpm': 120},
        {'embedding': json.dumps([0.2, 0.1, 0.4]), 'bpm': 128},
        {'embedding': json.dumps([0.4, 0.3, 0.2]), 'bpm': 115},
        # add more tracks...
    ]
    ordered = run_genetic_algorithm(
        my_tracks,
        generations=30,
        pop_size=60,
        seed=123,
        seed_idx=0
    )
    # Print the ordered BPMs to verify
    for idx, track in enumerate(ordered, 1):
        print(
            f"{idx:2d}: BPM={track.get('bpm')} | Embedding={track['embedding']}")
