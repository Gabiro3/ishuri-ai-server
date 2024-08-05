import json
import os
import base64

import google.generativeai as genai
from flask import Flask, jsonify, request, send_file, send_from_directory

API_KEY = 'YOUR_API_KEY_HERE'  # Update with your actual API key

genai.configure(api_key=API_KEY)

app = Flask(__name__)

@app.route("/")
def index():
    return send_file('web/index.html')

@app.route("/api/generate", methods=["POST"])
def generate_api():
    if request.method == "POST":
        if API_KEY == 'TODO':
            return jsonify({ "error": '''
                To get started, get an API key at
                https://g.co/ai/idxGetGeminiKey and enter it in
                main.py
                '''.replace('\n', '') })
        try:
            req_body = request.form
            content = req_body.get("contents")
            image_prompt = request.files.get("image_prompt")

            if image_prompt:
                image_data = base64.b64encode(image_prompt.read()).decode('utf-8')
                content = json.loads(content)
                content[0]['parts'][0]['inline_data']['data'] = image_data

            model = genai.GenerativeModel(model_name=req_body.get("model"))
            response = model.generate_content(content, stream=True)

            def stream():
                for chunk in response:
                    yield 'data: %s\n\n' % json.dumps({ "text": chunk.text })

            return stream(), {'Content-Type': 'text/event-stream'}

        except Exception as e:
            return jsonify({ "error": str(e) })

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('web', path)

if __name__ == "__main__":
    app.run(port=int(os.environ.get('PORT', 80)))

