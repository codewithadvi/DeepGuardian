import re
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForSequenceClassification, pipeline
from googleapiclient.discovery import build
import os
from dotenv import load_dotenv
from pathlib import Path

# ======================
# CONFIGURATION
# ======================
dotenv_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path)

HF_TOKEN = os.getenv("HF_TOKEN")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID")

# ======================
# LOAD MODELS
# ======================

def get_claim_extractor():
    tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base", token=HF_TOKEN)
    model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base", token=HF_TOKEN)
    return pipeline("text2text-generation", model=model, tokenizer=tokenizer, max_new_tokens=200)

def get_fact_checker():
    tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-mnli", token=HF_TOKEN)
    model = AutoModelForSequenceClassification.from_pretrained("facebook/bart-large-mnli", token=HF_TOKEN)
    return pipeline("zero-shot-classification", model=model, tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1)

claim_extractor = get_claim_extractor()
fact_checker = get_fact_checker()

# ======================
# HELPER FUNCTIONS
# ======================

def extract_claims(text):
    prompt = f"Extract numbered factual claims from text. Text: {text}"
    result = claim_extractor(prompt)
    claims_text = result[0]['generated_text']
    claims = []
    for line in claims_text.split('\n'):
        if re.match(r'\d+\.\s+', line):
            claims.append(line.split('.', 1)[1].strip())
    return claims or [claims_text.strip()]

def get_search_context(query, num_results=2):
    try:
        service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)
        res = service.cse().list(q=query, cx=SEARCH_ENGINE_ID, num=num_results).execute()
        context = ""
        for i, item in enumerate(res.get('items', [])[:2], 1):
            context += f"Source {i} ({item['link']}): {item['snippet']}\n"
        return context
    except Exception as e:
        return f"[SEARCH ERROR] {str(e)[:100]}"

# ======================
# MAIN BACKEND FUNCTION (STRUCTURED OUTPUT)
# ======================

def text_fakenews_process(article_text):
    """
    Returns a structured tuple: (label, confidence, reason)
    label: 'real' or 'fake'
    confidence: float (0–1)
    reason: short explanation
    """
    try:
        claims = extract_claims(article_text)

        if not claims or (len(claims) == 1 and claims[0].strip() == ""):
            return "unknown", 0.0, "No factual claims found in text."

        label_scores = {"true": 0, "false": 0, "misleading": 0}
        confidence_total = 0.0

        for claim in claims:
            context = get_search_context(claim)[:500]
            input_text = f"Claim: {claim}\nContext: {context}"

            result = fact_checker(
                input_text,
                candidate_labels=["true", "false", "misleading"],
                multi_label=False,
                hypothesis_template="This statement is {}."
            )

            top_label = result["labels"][0]
            confidence = result["scores"][0]

            label_scores[top_label] += 1
            confidence_total += confidence

        final_label = max(label_scores, key=label_scores.get)
        avg_confidence = confidence_total / len(claims)

        readable = f"Top verdict: {final_label} ({avg_confidence:.2f} confidence) based on {len(claims)} extracted claim"
        if len(claims) > 1:
            readable += "s"

        output_label = "real" if final_label == "true" and avg_confidence > 0.7 else "fake"
        return output_label, round(avg_confidence, 2), readable

    except Exception as e:
        return "unknown", 0.0, f"Text fact-checking error: {str(e)}"

# ======================
# VERBOSE TEXT OUTPUT (PRINT-STYLE LOG)
# ======================

def text_fakenews_process(article_text):
    """
    Returns:
        label (str): 'real', 'fake', or 'unknown'
        confidence (float): confidence score between 0 and 1
        sources (list): list of source dicts {'link': ..., 'snippet': ...}
    """
    try:
        claims = extract_claims(article_text)

        if not claims or (len(claims) == 1 and claims[0].strip() == ""):
            return "unknown", 0.0, []

        label_scores = {"true": 0, "false": 0, "misleading": 0}
        confidence_total = 0.0
        collected_sources = []

        for claim in claims:
            service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)
            res = service.cse().list(q=claim, cx=SEARCH_ENGINE_ID, num=2).execute()
            items = res.get('items', [])[:2]

            context = ""
            for item in items:
                context += f"{item['snippet']}\n"
                collected_sources.append({
                    'link': item.get('link', ''),
                    'snippet': item.get('snippet', '')
                })

            input_text = f"Claim: {claim}\nContext: {context[:500]}"

            result = fact_checker(
                input_text,
                candidate_labels=["true", "false", "misleading"],
                multi_label=False,
                hypothesis_template="This statement is {}."
            )

            top_label = result["labels"][0]
            confidence = result["scores"][0]

            label_scores[top_label] += 1
            confidence_total += confidence

        final_label = max(label_scores, key=label_scores.get)
        avg_confidence = confidence_total / len(claims)

        output_label = "real" if final_label == "true" and avg_confidence > 0.7 else "fake"

        return output_label, round(avg_confidence, 2), collected_sources

    except Exception as e:
        return "unknown", 0.0, [{"error": str(e)}]


# ======================
# EXAMPLE USAGE
# ======================