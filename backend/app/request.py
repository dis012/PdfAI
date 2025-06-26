import requests
import json
from pdf_to_prompt import convert_pdf_to_text

def send_prompt_to_ollama(prompt, model="gemma3:4b", stream=False, system=None, many_emails = False):
    """
    Send a prompt to Ollama API and get the response
    
    Args:
        prompt (str): The prompt to send
        model (str): The model to use
        stream (bool): Whether to stream the response
        system (str): System prompt to set context
    
    Returns:
        Response from Ollama API
    """
    url = "http://host.docker.internal:11434/api/generate"
    
    if many_emails:
        payload = {
            "model": model,
            "prompt": f"""You are an expert language model that extracts detailed, structured information from business emails. I will provide you with the raw text of multiple emails.
                    Your task is to extract all relevant business and contextual information from each email and return the result in clean, valid JSON. Each email should be represented as a JSON object, and the result should be a JSON array.
                    For each email, extract the following fields:
                    - "from": Sender name and email
                    - "to": Recipient name(s) and email(s)
                    - "cc": CC list (if any)
                    - "subject": Subject line of the email
                    - "date": Date and time the email was sent
                    - "body_summary": A concise 1–3 sentence summary of the email’s purpose or message
                    - "key_entities":
                        "people": List of full names mentioned (not just senders/recipients)
                        "organizations": Company or team names mentioned
                        "locations": Places mentioned
                        "dates": All significant dates mentioned (deadlines, meetings, etc.)
                        "amounts": Money amounts, percentages, or other quantities
                        "products_or_services": Items, products, or services being discussed
                        "events": Meetings, deadlines, launches, or other events
                    - "action_items": List of any to-dos, next steps, requests, or follow-ups
                    - "attachments": Mentioned attachments or filenames, if any
                    As an expert you can add other relevant data you find important.
                    Your output should be a **JSON array** of email objects, with cleanly formatted and complete data. If any field is not available, use `null` or an empty array as appropriate.
                    Do not include quoted previous emails, signature lines, or irrelevant disclaimers in summaries or action items. Focus only on the current message's core content.
                    Now process the following email text: {prompt}""",
            "stream": stream
        }
    else:
        payload = {
            "model": model,
            "prompt": f"""Extract all relevant data and key details from the following text. Return the extracted information in a well-structured and
                    valid JSON format. Ensure the JSON includes clearly named fields that reflect the meaning and context of the information (e.g., names, dates, locations, events, values, quantities, descriptions, etc.).
                    Only return the JSON—do not include any explanations, commentary, or additional text. Text to extract from: {prompt}""",
            "stream": stream
        }
    
    if system:
        payload["system"] = system
    
    headers = {
        "Content-Type": "application/json"
    }
    
    # Print request details for debugging
    # print(f"Sending request to {url}")
    # print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"Request failed with status code {response.status_code}: {response.text}")
    
    if stream:
        # Process streaming response
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                print(data.get("response", ""), end="")
                if data.get("done", False):
                    print("\n--- Generation complete ---")
                    break
        return None
    else:
        # Process normal response
        return response.json()

# Example usage
if __name__ == "__main__":
    try:
        # my_pdf = convert_pdf_to_text(r"C:\WolfsAI\backend\TestCases\email.pdf")
        
        # response = send_prompt_to_ollama(
        #     prompt=my_pdf,
        #     model="gemma3:4b",  
        #     stream=False
        # )
        # print(f"Response: {response.get('response', '')}")
        my_pdf = convert_pdf_to_text(r"C:\WolfsAI\backend\TestCases\Zdruzeno.pdf")
        
        response = send_prompt_to_ollama(
            prompt=my_pdf,
            model="gemma3:4b",  
            stream=False,
            many_emails = True
        )
        print(f"Response: {response.get('response', '')}")
    except Exception as e:
        print(f"Error: {str(e)}")