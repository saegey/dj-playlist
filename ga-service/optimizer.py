import random
import numpy as np
import json


def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def score_transition(t1, t2):
    # print("Scoring transition between tracks:")
    # print("Track 1:", t1)
    # print("Track 2:", t2)
    try:
        emb1 = json.loads(t1["embedding"])
    except Exception as e:
        print(f"Failed to load embedding for t1 (track id: {t1.get('track_id', 'unknown')}): {e}")
        raise
    try:
        emb2 = json.loads(t2["embedding"])
    except Exception as e:
        print(f"Failed to load embedding for t2 (track id: {t2.get('track_id', 'unknown')}): {e}")
        raise
    sim = cosine_similarity(emb1, emb2)
    bpm_diff = abs(t1.get("bpm", 0) - t2.get("bpm", 0)) / 10
    return sim - bpm_diff
    return sim - bpm_diff


def score_playlist(playlist):
    return sum(score_transition(playlist[i], playlist[i + 1]) for i in range(len(playlist) - 1))


def crossover(p1, p2):
    slice_size = len(p1) // 2
    start = random.randint(0, len(p1) - slice_size)
    slice_ = p1[start:start + slice_size]
    rest = [t for t in p2 if t not in slice_]
    return slice_ + rest


def mutate(playlist, rate=0.05):
    if random.random() < rate:
        i, j = random.sample(range(len(playlist)), 2)
        playlist[i], playlist[j] = playlist[j], playlist[i]
    return playlist


def run_genetic_algorithm(tracks, generations=50, pop_size=100):
    population = [random.sample(tracks, len(tracks)) for _ in range(pop_size)]

    for _ in range(generations):
        scored = sorted(population, key=score_playlist, reverse=True)
        top = scored[:10]
        new_gen = top[:2]  # elitism

        while len(new_gen) < pop_size:
            p1, p2 = random.sample(top, 2)
            child = mutate(crossover(p1, p2))
            new_gen.append(child)

        population = new_gen

    best = max(population, key=score_playlist)
    return best
