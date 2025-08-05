from flask import Flask, request, jsonify
from optimizer import run_genetic_algorithm

app = Flask(__name__)

@app.route("/optimize", methods=["POST"])
def optimize():
    data = request.json
    optimized = run_genetic_algorithm(data["tracks"])
    return jsonify(optimized)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8003)