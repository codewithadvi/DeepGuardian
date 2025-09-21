# File: processors/video/video_processor.py
import threading
from processors.video.rppg_model import rppg_process
from processors.video.lipsync_model import lipsync_process
 # Add other models similarly

def process_video(video_path):
    results = {}

    def run_model(name, func, output_dict):
        label, confidence, reason = func(video_path)
        output_dict[name] = {
            'label': label,
            'confidence': confidence,
            'reason': reason
        }

    threads = []
    output = {}

    models = {
        "rppg": rppg_process,
        "lipsync": lipsync_process,
        # Add more models here
    }

    for name, func in models.items():
        t = threading.Thread(target=run_model, args=(name, func, output))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    # Determine overall label based on consensus or priority
    fake_votes = [m for m in output if output[m]['label'].lower() == 'fake']
    real_votes = [m for m in output if output[m]['label'].lower() == 'real']

    if len(fake_votes) > len(real_votes):
        overall_label = "fake"
    else:
        overall_label = "real"

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

    results['video_models'] = output
    return results
