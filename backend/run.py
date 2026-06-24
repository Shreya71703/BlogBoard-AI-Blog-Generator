import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.graph import build_graph

def main():
    print("Welcome to BlogBoard Generator!")
    try:
        topic = input("Enter the topic for your technical blog post (or press Enter for a random AI topic): ")
    except (EOFError, RuntimeError):
        topic = ""
    
    if not topic.strip():
        topic = "The Future of Local LLMs and Agentic Workflows"
        
    print(f"\nStarting workflow for topic: {topic}\n")
    
    app = build_graph()
    
    # Run the graph
    inputs = {"topic": topic}
    try:
        for output in app.stream(inputs):
            # stream() yields dictionaries with node names as keys
            for key, value in output.items():
                pass # print statements in nodes will show progress
                
        print("\nWorkflow completed successfully!")
    except Exception as e:
        print(f"\nError executing workflow: {e}")
        print("Please make sure your GROQ_API_KEY is set correctly in the .env file.")

if __name__ == "__main__":
    main()
