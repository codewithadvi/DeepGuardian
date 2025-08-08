# File: processors/text/text_processor.py

from processors.text.text_model import text_fakenews_process

def process_text(text):
    """
    Run fake news detection on input text.

    Returns:
        dict: {
            'text_model': {
                'label': 'real' | 'fake' | 'unknown',
                'confidence': float [0.0, 1.0],
                'sources': list of dicts with 'link' and 'snippet'
            }
        }
    """
    label, confidence, sources = text_fakenews_process(text)

    return {
        'text_model': {
            'label': label,
            'confidence': confidence,
            'sources': sources
        }
    }
