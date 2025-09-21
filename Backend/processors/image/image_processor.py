import threading
from processors.image.zeroshot_model import analyze_image
from processors.image.cnn_model import predict_image

def process_image(image_path):
    results = {}

    def run_model(name, func, output_dict):
        try:
            label, confidence, reason = func(image_path)

            # Normalize output format based on model type
            if name == "cnn":
                output_dict[name] = {
                    'label': label,
                    'confidence': confidence,
                    'reason': reason  # string
                }
            elif name == "zeroshot":
                output_dict[name] = {
                    'label': label,
                    'confidence': confidence,
                    'reason': {
                        'classification_scores': reason  # dict of scores
                    }
                }
        except Exception as e:
            output_dict[name] = {
                'label': 'error',
                'confidence': 0.0,
                'reason': f'Exception: {str(e)}'
            }

    threads = []
    output = {}

    models = {
        "zeroshot": analyze_image,
        "cnn": predict_image
    }

    for name, func in models.items():
        t = threading.Thread(target=run_model, args=(name, func, output))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    # Tally votes
    fake_votes = [m for m in output if output[m]['label'].lower() == 'fake']
    real_votes = [m for m in output if output[m]['label'].lower() == 'real']

    overall_label = "fake" if len(fake_votes) > len(real_votes) else "real"

    results['overall'] = {
        'label': overall_label,
        'model_confidences': {
            model: {
                'label': info['label'],
                'confidence': info['confidence'],
                'reason': info['reason']
            } for model, info in output.items()
        },
        'fake_by': fake_votes,
        'real_by': real_votes
    }

    results['image_models'] = output
    return results
