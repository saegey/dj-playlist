import sys
import json
import essentia
import essentia.standard as es

def analyze(file_path):
    loader = es.MonoLoader(filename=file_path)
    audio = loader()
    # BPM and beat analysis
    rhythm = es.RhythmExtractor2013()(audio)
    bpm = rhythm[0]
    # Key
    key, scale, strength = es.KeyExtractor()(audio)
    # Danceability
    # danceability = es.Danceability()(audio)
    danceability_value, confidence = es.Danceability()(audio)
    # Energy
    energy = es.Energy()(audio)
    # Spectral centroid
    centroid = es.SpectralCentroidTime()(audio)
    # Mood estimation (simple)
    norm_energy = min(energy / 0.5, 1)
    norm_centroid = min(centroid / 5000, 1)
    mood = {
        'aggressive': norm_energy * norm_centroid,
        'happy': norm_energy * (1 - norm_centroid),
        'sad': (1 - norm_energy) * norm_centroid,
        'relaxed': (1 - norm_energy) * (1 - norm_centroid)
    }
    result = {
        'bpm': round(bpm),
        'key': key,
        'scale': scale,
        'danceability': round(danceability_value, 2),
        'mood_happy': round(mood['happy'], 2),
        'mood_sad': round(mood['sad'], 2),
        'mood_relaxed': round(mood['relaxed'], 2),
        'mood_aggressive': round(mood['aggressive'], 2)
    }
    print(json.dumps(result))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)
    analyze(sys.argv[1])
