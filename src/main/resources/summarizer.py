from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import time
from datetime import datetime

app = Flask(__name__)

# Load the T5-small model and tokenizer
model_name = "t5-small"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

@app.route('/ping', methods=['GET'])
def ping():
    """
    REST endpoint to return the current server time.
    """
    # Get the current time in ISO 8601 format
    current_time = datetime.utcnow().isoformat() + "Z"

    # Return the current time as a JSON response
    return jsonify({"current_time": current_time})
    
@app.route('/ai', methods=['GET'])
def summarize():
    """
    REST endpoint to summarize a given prompt using the T5-small model.
    """
    # Get the 'prompt' query parameter
    prompt = request.args.get('prompt')
    if not prompt:
        return jsonify({"error": "Please include the 'prompt' query parameter."}), 400

    try:
        # Prepend the task prefix for summarization
        input_text = "summarize this text in one sentence: " + prompt

        # Tokenize the input text
        inputs = tokenizer.encode(input_text, return_tensors="pt", max_length=512, truncation=False)

        # Generate the summary
        outputs = model.generate(inputs, max_length=100, num_beams=6, early_stopping=True, temperature=0.2)

        # Decode the generated tokens
        summary = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Return the summary as a JSON response
        return jsonify({"summary": summary})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000)