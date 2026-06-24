import os
import json
import datetime
from typing import Dict, TypedDict, List
from langgraph.graph import StateGraph, END
from backend.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage

class GraphState(TypedDict):
    topic: str
    outline: str
    draft: str
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
    topic = state["topic"]
    outline = state["outline"]
    llm = get_llm()
    prompt = f"Write a full technical blog post based on this topic: '{topic}' and this outline:\n{outline}\n\nThe tone should be professional, engaging, and highly informative. Format the output in Markdown."
    response = llm.invoke([SystemMessage(content="You are an expert technical writer and AI/ML engineer."), HumanMessage(content=prompt)])
    return {"draft": response.content}

def format_and_save(state: GraphState):
    print("---FORMATTING AND SAVING---")
    draft = state["draft"]
    topic = state["topic"]
    
    # Generate metadata
    llm = get_llm()
    meta_prompt = f"Generate a short, catchy title and a 2-sentence summary for a blog post about {topic}. Return ONLY a JSON object with keys 'title' and 'summary'."
    meta_response = llm.invoke([HumanMessage(content=meta_prompt)])
    
    try:
        metadata = json.loads(meta_response.content)
    except:
        # Fallback if LLM doesn't return pure JSON
        metadata = {
            "title": f"Deep Dive: {topic}",
            "summary": "An in-depth exploration of the topic."
        }
        
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    metadata["date"] = date_str
    
    # Create frontend posts directory if it doesn't exist
    posts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "posts")
    os.makedirs(posts_dir, exist_ok=True)
    
    # Format file name
    safe_title = metadata['title'].lower().replace(' ', '-').replace(':', '').replace('--', '-')
    filename = f"{date_str}-{safe_title}.md"
    filepath = os.path.join(posts_dir, filename)
    
    # Add frontmatter
    post_content = f"---\ntitle: {metadata['title']}\ndate: {metadata['date']}\nsummary: {metadata['summary']}\n---\n\n{draft}"
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(post_content)
        
    print(f"Saved post to {filepath}")
    
    return {"final_post": post_content, "metadata": metadata}

def build_graph():
    workflow = StateGraph(GraphState)
    
    workflow.add_node("generate_outline", generate_outline)
    workflow.add_node("generate_draft", generate_draft)
    workflow.add_node("format_and_save", format_and_save)
    
    workflow.set_entry_point("generate_outline")
    workflow.add_edge("generate_outline", "generate_draft")
    workflow.add_edge("generate_draft", "format_and_save")
    workflow.add_edge("format_and_save", END)
    
    return workflow.compile()
