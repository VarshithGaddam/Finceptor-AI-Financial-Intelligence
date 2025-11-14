#!/usr/bin/env python3
import sec_edgar_downloader
from bs4 import BeautifulSoup
import re
import json
import os
import glob
from nltk.tokenize import sent_tokenize
import logging
import nltk
import sys

# Ensure NLTK punkt is downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of large-cap stocks that typically have complex filings
LARGE_CAP_TICKERS = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'BRK.A', 'BRK.B', 
    'JPM', 'V', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'DIS', 'NVDA', 'PYPL',
    'ADBE', 'INTC', 'CMCSA', 'PFE', 'WMT', 'CRM', 'NFLX', 'VZ', 'ABT', 'KO'
]

def fetch_sec_filing(ticker, form_type, year):
    download_dir = "sec-edgar"
    os.makedirs(download_dir, exist_ok=True)
    dl = sec_edgar_downloader.Downloader("Finceptor", "noreply@finceptor.com", download_dir)
    try:
        year = int(year)
        # Broaden the date range to increase the chance of finding the filing
        after_date = f"{year-1}-01-01"  # Start from the previous year
        before_date = f"{year+1}-06-30"  # Extend to mid-next year
        logger.info("Fetching %s %s for %d, date range: %s to %s", ticker, form_type, year, after_date, before_date)
        dl.get(form_type, ticker, limit=1, after=after_date, before=before_date)
        path = os.path.join(download_dir, "sec-edgar-filings", ticker, form_type, "*", "full-submission.txt")
        txt_files = glob.glob(path)
        if not txt_files:
            logger.error("No filing found for %s %s %d in date range %s to %s", ticker, form_type, year, after_date, before_date)
            return None, None
        txt_file = max(txt_files, key=os.path.getctime)
        logger.info("Found filing at %s", txt_file)
        with open(txt_file, 'r', encoding='utf-8', errors='ignore') as f:
            full_content = f.read()
        
        is_large_cap = ticker.upper() in LARGE_CAP_TICKERS
        
        if ticker.upper() == 'TSLA':
            logger.info("Special handling for TSLA filing")
            return handle_special_filing(full_content, form_type, ticker)
        
        elif is_large_cap:
            logger.info("Enhanced handling for large-cap stock: %s", ticker.upper())
            return handle_large_cap_filing(full_content, form_type, ticker)
            
        html_start = full_content.find("<HTML>")
        html_end = full_content.rfind("</HTML>") + len("</HTML>")
        if html_start != -1 and html_end > html_start:
            logger.info("Extracted HTML content from %s", txt_file)
            return full_content[html_start:html_end], full_content
        documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", full_content, re.DOTALL | re.IGNORECASE)
        for doc in documents:
            if f"<TYPE>{form_type}" in doc:
                text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
                if text_match:
                    logger.info("Extracted TEXT section for %s", form_type)
                    return text_match.group(1), full_content
        logger.error("No valid HTML or TEXT section found in %s", txt_file)
        return None, None
    except Exception as e:
        logger.error("Error fetching filing for %s %s %d: %s", ticker, form_type, year, str(e))
        return None, None

def handle_special_filing(full_content, form_type, ticker):
    logger.info("Processing %s filing with special handler", ticker)
    
    # Clean XBRL and other tags upfront
    content = re.sub(r'<ix:[^>]*>', '<div>', full_content)
    content = re.sub(r'</ix:[^>]*>', '</div>', content)
    content = re.sub(r'<!\[CDATA\[.*?\]\]>', '', content, flags=re.DOTALL)
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    # Find the document with the exact form type
    documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", content, re.DOTALL | re.IGNORECASE)
    for doc in documents:
        type_match = re.search(r"<TYPE>(.*?)</TYPE>", doc, re.DOTALL | re.IGNORECASE)
        if type_match and type_match.group(1).strip() == form_type:
            text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
            if text_match:
                doc_content = text_match.group(1)
                logger.info("Found exact %s document for %s", form_type, ticker)
                return doc_content, full_content
    
    # Fallback for 10-K/10-Q: Look for key sections
    for doc in documents:
        doc_content = doc.lower()
        if ('item 1' in doc_content and 'business' in doc_content) or ('item 1' in doc_content and 'financial statements' in doc_content):
            text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
            if text_match:
                doc_content = text_match.group(1)
                logger.info("Found likely %s content for %s based on section markers", form_type, ticker)
                return doc_content, full_content
    
    # Fallback to HTML
    html_start = content.find("<HTML>")
    html_end = content.rfind("</HTML>") + len("</HTML>")
    if html_start != -1 and html_end > html_start:
        html_content = content[html_start:html_end]
        logger.info("Extracted HTML content for %s as fallback", ticker)
        return html_content, full_content
    
    logger.warning("Could not find proper HTML/TEXT section for %s, using cleaned content", ticker)
    return content, full_content

def handle_large_cap_filing(full_content, form_type, ticker):
    logger.info("Processing %s filing with large-cap handler", ticker)
    
    # Clean XBRL and other tags upfront
    content = re.sub(r'<ix:[^>]*>', '<div>', full_content)
    content = re.sub(r'</ix:[^>]*>', '</div>', content)
    content = re.sub(r'<!\[CDATA\[.*?\]\]>', '', content, flags=re.DOTALL)
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    html_start = content.find("<HTML>")
    html_end = content.rfind("</HTML>") + len("</HTML>")
    if html_start != -1 and html_end > html_start:
        html_content = content[html_start:html_end]
        return html_content, full_content
    
    documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", content, re.DOTALL | re.IGNORECASE)
    for doc in documents:
        if f"<TYPE>{form_type}" in doc:
            text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
            if text_match:
                doc_content = text_match.group(1)
                if "<HTML>" in doc_content:
                    html_start = doc_content.find("<HTML>")
                    html_end = doc_content.rfind("</HTML>") + len("</HTML>")
                    if html_end > html_start:
                        return doc_content[html_start:html_end], full_content
                return doc_content, full_content
    
    logger.warning("Could not extract specific content for %s, using cleaned content", ticker)
    return content, full_content

def clean_text(text):
    if not text:
        return ""
    # Remove XBRL and other tags
    text = re.sub(r'<ix:.*?>.*?</ix:.*?>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    # Remove page numbers and separators
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\*+\s*$', '', text, flags=re.MULTILINE)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def chunk_text(text, max_tokens=200, overlap=1):
    try:
        sentences = sent_tokenize(text)
        if not sentences:
            logger.warning("No sentences tokenized, falling back to simple split: %s", text[:50])
            sentences = text.split('. ')
            sentences = [s + '.' for s in sentences if s]
        chunks = []
        current_chunk = []
        current_tokens = 0
        for sentence in sentences:
            token_count = len(sentence.split())
            if current_tokens + token_count > max_tokens:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = current_chunk[-overlap:] if overlap > 0 else []
                    current_tokens = sum(len(s.split()) for s in current_chunk)
            current_chunk.append(sentence)
            current_tokens += token_count
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        logger.info("Chunked text into %d chunks, first chunk: %s", len(chunks), chunks[0][:50] if chunks else "None")
        return chunks
    except Exception as e:
        logger.error("Error chunking text: %s, input: %s", str(e), text[:50])
        return [text] if text.strip() else []

def parse_sections(html_content, full_content, form_type, ticker):
    try:
        soup = BeautifulSoup(html_content, 'lxml')
        metadata = {
            "cik": "Not Found",
            "company": "Not Found",
            "ticker": ticker,
            "form": form_type
        }

        # Extract metadata from SEC-HEADER
        sec_header = re.search(r'<SEC-HEADER>(.*?)</SEC-HEADER>', full_content, re.DOTALL | re.IGNORECASE)
        header_text = ""
        if sec_header:
            header_text = re.sub(r'<ix:.*?>|</ix:.*?>', '', sec_header.group(1), flags=re.DOTALL)
            logger.info("SEC-HEADER found: %s", header_text[:200])
            cik_match = re.search(r'(?:CENTRAL INDEX KEY|CIK|CIK Number):\s*0*(\d{1,10})', header_text, re.I)
            if cik_match:
                metadata["cik"] = cik_match.group(1).zfill(10)
            company_match = re.search(r'(?:COMPANY CONFORMED NAME|COMPANY NAME):\s*(.*?)(?:\n|$)', header_text, re.I)
            if company_match:
                company_name = clean_text(company_match.group(1).strip())
                if not re.match(r'.*-\d{8}$', company_name) and len(company_name) > 3:
                    metadata["company"] = company_name

        # Fallback for metadata
        if metadata["cik"] == "Not Found":
            cover_page = soup.find(string=re.compile(r'Cover Page|Form 10-K Summary|Exact name of registrant', re.I))
            if cover_page:
                parent = cover_page.find_parent(['div', 'p', 'table', 'section'])
                if parent:
                    cik_search = parent.find(string=re.compile(r'\b0*\d{1,10}\b', re.I))
                    if cik_search and re.match(r'0*\d{1,10}', cik_search.strip()):
                        metadata["cik"] = cik_search.strip().zfill(10)

        if metadata["company"] == "Not Found":
            title_tag = soup.find('title') or soup.find(string=re.compile(r'\b(?:Company|Registrant)\b', re.I))
            if title_tag:
                company_name = clean_text(title_tag.text).split('Form')[0].strip()
                if not re.match(r'.*-\d{8}$', company_name) and len(company_name) > 3:
                    metadata["company"] = company_name

        # Parse table of contents
        toc_sections = []
        toc_candidates = soup.find_all(string=re.compile(r'Table of Contents', re.I))
        if not toc_candidates:
            toc_candidates = soup.find_all(['h1', 'h2', 'h3', 'h4', 'div', 'p', 'td'], 
                                          string=re.compile(r'^\s*(?:TABLE OF CONTENTS|INDEX TO|INDEX|CONTENTS|Form 10-K)\s*$', re.I))
        
        item_pattern = re.compile(r'^\s*ITEM\s+(\d+[A-Za-z]?)[.\s]+(.+)$', re.I)
        for toc in toc_candidates:
            toc_container = toc.find_parent(['div', 'p', 'table', 'section', 'ul', 'ol', 'td', 'tr'])
            if toc_container:
                elements_to_check = toc_container.find_all(['p', 'a', 'tr', 'li', 'div', 'td'], recursive=True)
                for element in elements_to_check:
                    text = element.get_text(strip=True)
                    match = item_pattern.match(text)
                    if match:
                        item_key = f"item_{match.group(1).lower()}"
                        title = clean_text(match.group(2).strip())
                        if title and len(title) < 100:
                            toc_sections.append({"item": item_key, "title": title})

        # Fallback: Generate TOC based on form type
        if not toc_sections:
            logger.warning("No TOC found, generating generic structure for %s", form_type)
            if form_type == "10-Q":
                toc_sections = [
                    {"item": "item_1", "title": "Financial Statements"},
                    {"item": "item_2", "title": "Management's Discussion and Analysis"},
                    {"item": "item_3", "title": "Quantitative and Qualitative Disclosures About Market Risk"},
                    {"item": "item_4", "title": "Controls and Procedures"}
                ]
            elif form_type == "10-K":
                toc_sections = [
                    {"item": "item_1", "title": "Business"},
                    {"item": "item_1a", "title": "Risk Factors"},
                    {"item": "item_7", "title": "Management's Discussion and Analysis"},
                    {"item": "item_8", "title": "Financial Statements and Supplementary Data"}
                ]

        # Extract sections
        section_pattern = re.compile(r'ITEM\s+(\d+[A-Z]?)\s*[.:]?\s*(.*)', re.I)
        sections = {}
        current_section = None
        section_content = []
        text_elements = soup.find_all(string=True)
        for element in text_elements:
            text = element.strip()
            if not text:
                continue
            match = section_pattern.match(text)
            if match:
                if current_section and section_content:
                    cleaned_text = clean_text(' '.join(section_content))
                    if cleaned_text:
                        sections[f"item_{current_section.lower()}"] = {"text": cleaned_text}
                section_content = []
                current_section = match.group(1)
                section_content.append(text)
            elif current_section:
                section_content.append(text)
        if current_section and section_content:
            cleaned_text = clean_text(' '.join(section_content))
            if cleaned_text:
                sections[f"item_{current_section.lower()}"] = {"text": cleaned_text}

        # Fallback: If no sections are parsed, create generic sections
        if not sections:
            logger.warning("No sections parsed, creating generic structure for %s", form_type)
            full_text = clean_text(soup.get_text())
            text_length = len(full_text)
            if text_length > 1000:
                num_sections = 4 if form_type == "10-Q" else 8
                chunk_size = text_length // num_sections
                for i in range(num_sections):
                    start = i * chunk_size
                    end = (i + 1) * chunk_size if i < num_sections - 1 else text_length
                    section_key = f"item_{i + 1}" if form_type == "10-Q" else f"item_{i + 1}{chr(96 + i) if i > 0 else ''}"
                    sections[section_key] = {"text": full_text[start:end]}

        return metadata, sections, toc_sections
    except Exception as e:
        logger.error("Error parsing sections: %s", str(e))
        return metadata, {}, []

def parse_filing(ticker, form_type, year):
    try:
        html_content, full_content = fetch_sec_filing(ticker, form_type, year)
        if not html_content or not full_content:
            return {"error": "Filing could not be processed. Check ticker, form type, or year."}
        
        metadata, sections, toc_sections = parse_sections(html_content, full_content, form_type, ticker)
        
        structured_output = {
            **metadata,
            "table_of_contents": toc_sections,
            **{k: {'text': v['text']} for k, v in sections.items() if k.startswith('item_')}
        }

        chunks = []
        for item, content in sections.items():
            if not item.startswith('item_'):
                continue
            chunk_list = chunk_text(content["text"], max_tokens=200, overlap=1)
            for i, chunk in enumerate(chunk_list):
                # Skip empty or invalid chunks
                if not chunk or not isinstance(chunk, str) or len(chunk.strip()) < 10:
                    logger.warning("Skipping empty or too-short chunk for %s: %s", item, chunk[:50] if chunk else "None")
                    continue
                chunk_data = {
                    "id": f"{item}_{i}",
                    "text": chunk,
                    "ticker": ticker,
                    "section": item,
                    "source": f"{ticker}_{form_type}_{year}",
                    "tokens": len(chunk.split())
                }
                logger.info("Generated chunk: %s", json.dumps(chunk_data, ensure_ascii=False))
                chunks.append(chunk_data)

        chunked_output = {"metadata": metadata, "chunks": chunks}
        
        return {
            "structured": structured_output,
            "chunked": chunked_output
        }
    except Exception as e:
        logger.error("Error in parse_filing: %s", str(e))
        return {"error": f"Error processing SEC filing: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python sec_parser.py <ticker> <form_type> <year>")
        sys.exit(1)
    
    ticker = sys.argv[1]
    form_type = sys.argv[2]
    year = sys.argv[3]
    
    result = parse_filing(ticker, form_type, year)
    print(json.dumps(result))