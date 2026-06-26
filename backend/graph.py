import os
import json
import datetime
import time
from typing import Dict, TypedDict, List
from langgraph.graph import StateGraph, END
from backend.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage

class GraphState(TypedDict):
    topic: str
    outline: str
    draft: str
    review: str
    final_post: str
    metadata: Dict

def generate_outline(state: GraphState):
    print("---GENERATING OUTLINE---")
    topic = state["topic"]
    llm = get_llm()
    prompt = f"Create a comprehensive outline for a technical blog post about: {topic}. Include an introduction, 3-4 main sections with subsections, and a conclusion. Format as a bulleted list."
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"outline": response.content}

def generate_draft(state: GraphState):
    print("---GENERATING DRAFT---")
    # Sleep to respect TPM limit
    time.sleep(10)
    topic = state["topic"]
    outline = state["outline"]
    llm = get_llm()
    prompt = f"Write a full technical blog post based on this topic: '{topic}' and this outline:\n{outline}\n\nThe tone should be professional, engaging, and highly informative. Format the output in Markdown."
    response = llm.invoke([SystemMessage(content="You are an expert technical writer and AI/ML engineer."), HumanMessage(content=prompt)])
    return {"draft": response.content}

def review_draft(state: GraphState):
    print("---EDITORIAL REVIEW---")
    # Sleep to respect TPM limit
    time.sleep(10)
    draft = state["draft"]
    llm = get_llm()
    prompt = f"You are a Senior Technical Editor. Review this technical blog post draft and provide actionable improvement critiques:\n\n{draft}\n\nFocus on technical depth, flow, clarity, and formatting (make sure code blocks are correct). Output only the critiques in bullet points."
    response = llm.invoke([SystemMessage(content="You are a strict, senior technical blog editor."), HumanMessage(content=prompt)])
    return {"review": response.content}

def refine_draft(state: GraphState):
    print("---REFINING DRAFT---")
    # Sleep to respect TPM limit
    time.sleep(10)
    draft = state["draft"]
    review = state["review"]
    llm = get_llm()
    prompt = f"You are a Technical Writer. Revise this blog post draft:\n\n{draft}\n\nIncorporate the following editorial feedback to make the final post highly polished and accurate:\n\n{review}\n\nOutput only the revised blog post in Markdown."
    response = llm.invoke([SystemMessage(content="You are an expert technical writer specializing in AI/ML."), HumanMessage(content=prompt)])
    return {"draft": response.content}

def format_and_save(state: GraphState):
    print("---FORMATTING AND SAVING---")
    # Sleep to respect TPM limit
    time.sleep(10)
    draft = state["draft"]
    topic = state["topic"]
    
    # Generate metadata
    llm = get_llm()
    meta_prompt = f"Generate a short, catchy title, a 2-sentence summary, and 3 relevance tags (e.g. 'machine-learning', 'python') for a blog post about {topic}. Return ONLY a JSON object with keys 'title', 'summary', and 'tags' (which should be an array of strings)."
    meta_response = llm.invoke([HumanMessage(content=meta_prompt)])
    
    try:
        # Strip potential markdown code block formatting from LLM JSON response
        cleaned_json = meta_response.content.strip()
        if cleaned_json.startswith("```json"):
            cleaned_json = cleaned_json[7:]
        if cleaned_json.endswith("```"):
            cleaned_json = cleaned_json[:-3]
        metadata = json.loads(cleaned_json.strip())
    except Exception as e:
        print(f"Failed to parse metadata JSON: {e}. Using fallback.")
        metadata = {
            "title": f"Deep Dive: {topic}",
            "summary": "An in-depth exploration of the topic.",
            "tags": ["ai", "tech"]
        }
        
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    metadata["date"] = date_str
    
    # Calculate reading time (words / 200)
    words = len(draft.split())
    reading_time = max(1, round(words / 200))
    metadata["reading_time"] = f"{reading_time} min read"
    
    # Create frontend posts directory if it doesn't exist
    posts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "posts")
    os.makedirs(posts_dir, exist_ok=True)
    
    # Format file name
    safe_title = metadata['title'].lower().replace(' ', '-').replace(':', '').replace('--', '-').replace('/', '-')
    filename = f"{date_str}-{safe_title}.md"
    filepath = os.path.join(posts_dir, filename)
    
    # Add frontmatter
    tags_str = ", ".join(metadata.get('tags', []))
    post_content = f"---\ntitle: {metadata['title']}\ndate: {metadata['date']}\nsummary: {metadata['summary']}\ntags: {tags_str}\nreading_time: {metadata['reading_time']}\n---\n\n{draft}"
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(post_content)
        
    print(f"Saved post to {filepath}")
    
    # Update manifest.json
    manifest_path = os.path.join(posts_dir, "manifest.json")
    posts_manifest = []
    
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                posts_manifest = json.load(f)
        except Exception as e:
            print(f"Failed to load existing manifest.json: {e}. Creating new one.")
            
    # Check if file already exists in manifest, update it; otherwise append
    new_entry = {
        "title": metadata["title"],
        "summary": metadata["summary"],
        "date": metadata["date"],
        "tags": metadata.get("tags", []),
        "reading_time": metadata["reading_time"],
        "filename": filename
    }
    
    # Filter out existing entries with same filename to avoid duplicates
    posts_manifest = [entry for entry in posts_manifest if entry.get("filename") != filename]
    posts_manifest.insert(0, new_entry) # Put newest first
    
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(posts_manifest, f, indent=2, ensure_ascii=False)
        
    print(f"Updated posts manifest at {manifest_path}")
    
    return {"final_post": post_content, "metadata": metadata}

def build_graph():
    workflow = StateGraph(GraphState)
    
    workflow.add_node("generate_outline", generate_outline)
    workflow.add_node("generate_draft", generate_draft)
    workflow.add_node("review_draft", review_draft)
    workflow.add_node("refine_draft", refine_draft)
    workflow.add_node("format_and_save", format_and_save)
    
    workflow.set_entry_point("generate_outline")
    workflow.add_edge("generate_outline", "generate_draft")
    workflow.add_edge("generate_draft", "review_draft")
    workflow.add_edge("review_draft", "refine_draft")
    workflow.add_edge("refine_draft", "format_and_save")
    workflow.add_edge("format_and_save", END)
    
    return workflow.compile()
