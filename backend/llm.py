import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

def get_llm():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set. Please set it in .env")
    
    # Using Llama 3.1 8b as a default, fast and capable model
    return ChatGroq(temperature=0.7, model_name="llama-3.1-8b-instant", groq_api_key=api_key)
