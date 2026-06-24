document.addEventListener('DOMContentLoaded', () => {
    // We are serving this statically without a real backend API for listing posts.
    // In a real scenario, we'd have an endpoint to list files in /posts/.
    // For this demonstration, we'll try to fetch a known manifest if it exists,
    // or just simulate a list if we can't do a directory listing.
    
    const postListEl = document.getElementById('post-list');
    const contentEl = document.getElementById('post-content');
    
    // Since we are running a simple HTTP server, we cannot easily list directories
    // without a custom handler. So, for the frontend to work nicely out-of-the-box,
    // we'll attempt to fetch a "manifest.json" which we could hypothetically generate,
    // but instead let's just create a hardcoded example and provide instructions, 
    // OR try to fetch a specific post if passed in URL.
    
    // As a workaround for local development without an API, we will just show a sample card
    // and instruct the user how to view generated files.
    
    // Let's create a utility to parse frontmatter from markdown
    function parseFrontmatter(mdContent) {
        const regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = mdContent.match(regex);
        
        if (match) {
            const frontmatterStr = match[1];
            const content = match[2];
            
            const metadata = {};
            frontmatterStr.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                    metadata[key.trim()] = valueParts.join(':').trim();
                }
            });
            
            return { metadata, content };
        }
        
        return { metadata: {}, content: mdContent };
    }

    // Function to render a markdown file
    async function loadPost(filename) {
        try {
            contentEl.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><h3>Loading...</h3></div>';
            
            const response = await fetch(`posts/${filename}`);
            if (!response.ok) throw new Error('Post not found');
            
            const mdText = await response.text();
            const { metadata, content } = parseFrontmatter(mdText);
            
            // Parse markdown using marked.js
            const htmlContent = marked.parse(content);
            
            // Render
            let html = '<div class="markdown-body">';
            if (metadata.title) html += `<h1>${metadata.title}</h1>`;
            if (metadata.date) html += `<div class="meta-date">${metadata.date}</div>`;
            html += htmlContent;
            html += '</div>';
            
            contentEl.innerHTML = html;
            
            // Update active state in sidebar
            document.querySelectorAll('.post-card').forEach(c => c.classList.remove('active'));
            const activeCard = document.querySelector(`.post-card[data-file="${filename}"]`);
            if (activeCard) activeCard.classList.add('active');
            
        } catch (error) {
            console.error('Error loading post:', error);
            contentEl.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <h3>Error</h3>
                    <p>Could not load the article. Make sure you have generated it using the backend.</p>
                </div>
            `;
        }
    }

    // Initialize sidebar
    function initSidebar() {
        postListEl.innerHTML = `
            <div class="post-card" data-file="example.md" onclick="loadSample()">
                <div class="post-date">System</div>
                <h3>Welcome to BlogBoard</h3>
                <p>Run the backend python script to generate real articles. They will be saved in the /posts directory.</p>
            </div>
            
            <div style="padding: 1rem; color: #94a3b8; font-size: 0.85rem; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; margin-top: 1rem;">
                <strong>Developer Note:</strong><br/>
                When you run <code>python backend/run.py</code>, it saves a .md file in <code>frontend/posts/</code>.<br/>
                Manually enter the URL <code>?post=filename.md</code> to view it, or implement a backend API to list the files!
            </div>
        `;
        
        // Expose loadSample to window
        window.loadSample = () => {
            contentEl.innerHTML = `
                <div class="markdown-body">
                    <h1>Welcome to BlogBoard</h1>
                    <div class="meta-date">Just now</div>
                    <p>This is a fully automated blogging platform. To generate a real article:</p>
                    <ol>
                        <li>Make sure your <code>.env</code> file is set up with <code>GROQ_API_KEY</code>.</li>
                        <li>Run the backend workflow: <code>python backend/run.py</code></li>
                        <li>The script will use LangGraph to plan, draft, and format a new markdown file.</li>
                        <li>The file will be saved in <code>frontend/posts/</code>.</li>
                        <li>Serve this frontend using <code>python -m http.server 8000 --directory frontend</code></li>
                    </ol>
                    <h3>Architecture</h3>
                    <p>The system uses a state graph to iterate through the writing process, ensuring high-quality output without human intervention.</p>
                </div>
            `;
            
            document.querySelectorAll('.post-card').forEach(c => c.classList.remove('active'));
            document.querySelector('.post-card').classList.add('active');
        };
        
        // Check if URL has a post parameter
        const urlParams = new URLSearchParams(window.location.search);
        const postParam = urlParams.get('post');
        
        if (postParam) {
            loadPost(postParam);
        } else {
            window.loadSample();
        }
    }

    initSidebar();
});
