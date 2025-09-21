# ✍️ TextGuard: AI-Powered Misinformation & Fake News Detector

TextGuard is a sophisticated, multi-stage pipeline designed to dissect and verify text-based content in real-time. It goes beyond simple classification by actively extracting factual claims from an article and cross-referencing them against live web search results to deliver a transparent, evidence-based verdict.

This system acts as an automated fact-checker, providing a crucial layer of defense against the rapid spread of online misinformation.



---

## 🌍 Why TextGuard?

In today's information ecosystem, false narratives can spread in minutes. Manually fact-checking every article is impossible. TextGuard automates this process using a powerful three-step pipeline: **Extract, Verify, and Decide**. It provides users not just with a label, but with the sources and reasoning needed to make their own informed judgments.

---

## ✨ Key Features

* **🔍 Automatic Claim Extraction**: Utilizes `google/flan-t5-base` to intelligently deconstruct a news article or text block into its core, verifiable statements.
* **🌐 Real-Time Web Verification**: Employs the **Google Custom Search API** to fetch live, relevant context for each extracted claim from across the web, ensuring verification is based on the most current information available.
* **🧠 Advanced Fact-Checking (NLI)**: Leverages the powerful `facebook/bart-large-mnli` Natural Language Inference model to determine if the web context supports, contradicts, or is neutral to each claim.
* **📊 Transparent & Actionable Results**: Delivers a clear final verdict (`real`, `fake`, or `unknown`), an overall confidence score, and a browsable list of the source URLs and snippets used in its analysis.

---

## ⚙️ How It Works: The Verification Pipeline

TextGuard processes information in a logical, step-by-step workflow to ensure accuracy and transparency.

1.  **Input Text**: A user submits a block of text, such as a news article, blog post, or social media update.

2.  **Claim Extraction (`FLAN-T5`)**: The text is fed into the `FLAN-T5` model, which is prompted to identify and list all distinct, factual claims.
    > *Example Claim: "Tesla has achieved full Level 5 autonomy."*

3.  **Context Gathering (Google Search)**: For each individual claim, TextGuard performs a targeted search using the Google Custom Search API to retrieve the top-ranking web pages and their descriptive snippets.
    > *Example Snippet: "Reuters.com - Experts say no car company has yet achieved Level 5 autonomy..."*

4.  **Fact-Checking (`BART-MNLI`)**: This is the core verification step. The Natural Language Inference model treats the original claim as a **premise** and the web snippet as a **hypothesis**. It then classifies the relationship into one of three categories:
    * **Entailment**: The web context supports the claim (evidence of being `true`).
    * **Contradiction**: The web context refutes the claim (evidence of being `false`).
    * **Neutral**: The web context is related but does not directly support or refute the claim.

5.  **Verdict Aggregation**: The results from all the individual claim verifications are aggregated. The system calculates a final verdict (`real` or `fake`) based on the proportion of supported vs. contradicted claims, along with an overall confidence score. If a majority of claims are neutral or cannot be verified, the verdict is `unknown`.

---

## 🛠️ Technology Stack

* **Claim Extraction Model**: `google/flan-t5-base`
* **Fact-Checking Model**: `facebook/bart-large-mnli`
* **Web Context API**: Google Custom Search API
* **Core Frameworks**: Hugging Face Transformers, PyTorch

---

## 📜 License

This project is licensed under the MIT License.
