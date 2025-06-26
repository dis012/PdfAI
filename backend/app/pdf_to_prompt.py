import pymupdf

def convert_pdf_to_text(file, concatenate=True):
    document_content = {}
    
    try:
        document = pymupdf.open(file)
        
        for i, page in enumerate(document):
            document_content[f"Page number {i}"] = page.get_text()
            
        if concatenate:
            document_content = "\n".join(document_content.values())
            
    except Exception as e:
        print(f"Error reading the file: {str(e)}")
        return None if concatenate else {}
        
    return document_content

# if __name__ == "__main__":
#     text = convert_pdf_to_text(r"C:\WolfsAI\backend\TestCases\Zdruzeno.pdf")
#     print(text)