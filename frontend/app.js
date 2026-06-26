document.addEventListener('DOMContentLoaded', () => {
    const postListEl = document.getElementById('post-list');
    const contentEl = document.getElementById('post-content');
    const searchInput = document.getElementById('search-input');
    const tagFilterContainer = document.getElementById('tag-filter-container');
    
    let allPosts = [];
    let selectedTag = null;
    let searchQuery = '';

    // Parse frontmatter from markdown
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

    // Load post content
    async function loadPost(filename) {
        try {
            contentEl.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><h3>Loading article...</h3></div>';
            
            const response = await fetch(`posts/${filename}`);
            if (!response.ok) throw new Error('Post not found');
            
            const mdText = await response.text();
            const { metadata, content } = parseFrontmatter(mdText);
            
            const htmlContent = marked.parse(content);
            
            let html = '<div class="markdown-body">';
            if (metadata.title) html += `<h1>${metadata.title}</h1>`;
            
            // Render detailed meta row (date, reading time, tags)
            html += '<div class="article-meta-row">';
            if (metadata.date) html += `<span class="meta-date">${metadata.date}</span>`;
            if (metadata.reading_time) html += `<span class="post-reading-time">• ${metadata.reading_time}</span>`;
            if (metadata.tags) {
                html += '<div class="meta-tags">';
                metadata.tags.split(',').forEach(tag => {
                    html += `<span class="meta-tag">#${tag.trim()}</span>`;
                });
                html += '</div>';
            }
            html += '</div>';
            
            html += htmlContent;
            html += '</div>';
            
            contentEl.innerHTML = html;
            
            // Mark active card
            document.querySelectorAll('.post-card').forEach(c => c.classList.remove('active'));
            const activeCard = document.querySelector(`.post-card[data-file="${filename}"]`);
            if (activeCard) activeCard.classList.add('active');
            
            // Set URL parameter without reloading
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('post', filename);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            
        } catch (error) {
            console.error('Error loading post:', error);
            contentEl.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <h3>Error Loading Post</h3>
                    <p>Could not load the article. Ensure the backend pipeline has run successfully.</p>
                </div>
            `;
        }
    }

    // Render filter tag pills
    function renderTagFilters() {
        // Collect all unique tags
        const tags = new Set();
        allPosts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => tags.add(tag.trim().toLowerCase()));
            }
        });

        if (tags.size === 0) {
            tagFilterContainer.style.display = 'none';
            return;
        }

        tagFilterContainer.style.display = 'flex';
        let html = `<span class="tag-pill ${!selectedTag ? 'active' : ''}" data-tag="all">All</span>`;
        tags.forEach(tag => {
            html += `<span class="tag-pill ${selectedTag === tag ? 'active' : ''}" data-tag="${tag}">#${tag}</span>`;
        });
        tagFilterContainer.innerHTML = html;

        // Add event listeners
        tagFilterContainer.querySelectorAll('.tag-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const tag = pill.getAttribute('data-tag');
                selectedTag = tag === 'all' ? null : tag;
                renderTagFilters();
                filterAndRenderPosts();
            });
        });
    }

    // Filter and render sidebar cards
    function filterAndRenderPosts() {
        const filtered = allPosts.filter(post => {
            const matchesSearch = searchQuery === '' || 
                post.title.toLowerCase().includes(searchQuery) ||
                post.summary.toLowerCase().includes(searchQuery) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchQuery));
            
            const matchesTag = !selectedTag || post.tags.some(tag => tag.toLowerCase() === selectedTag);
            
            return matchesSearch && matchesTag;
        });

        if (filtered.length === 0) {
            postListEl.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem;">No posts found.</div>';
            return;
        }

        postListEl.innerHTML = filtered.map(post => `
            <div class="post-card" data-file="${post.filename}">
                <div class="post-meta-row">
                    <span class="post-date">${post.date}</span>
                    <span class="post-reading-time">${post.reading_time || ''}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.summary}</p>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');

        // Add click events to cards
        postListEl.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                const filename = card.getAttribute('data-file');
                loadPost(filename);
            });
        });
    }

    // Initialize application
    async function init() {
        try {
            // Attempt to load manifest.json
            const response = await fetch('posts/manifest.json');
            if (!response.ok) throw new Error('Manifest not found');
            
            allPosts = await response.json();
            
            if (allPosts.length > 0) {
                renderTagFilters();
                filterAndRenderPosts();
                
                // Load default post (from URL parameter or the latest post)
                const urlParams = new URLSearchParams(window.location.search);
                const postParam = urlParams.get('post');
                if (postParam && allPosts.some(p => p.filename === postParam)) {
                    loadPost(postParam);
                } else {
                    loadPost(allPosts[0].filename);
                }
            } else {
                showWelcomeState();
            }
        } catch (error) {
            console.log('Manifest not found, loading welcome demo state:', error);
            showWelcomeState();
        }
    }

    function showWelcomeState() {
        tagFilterContainer.style.display = 'none';
        postListEl.innerHTML = `
            <div class="post-card active" data-file="example.md">
                <div class="post-meta-row">
                    <span class="post-date">System</span>
                    <span class="post-reading-time">1 min read</span>
                </div>
                <h3>Welcome to BlogBoard</h3>
                <p>Generate high-quality ML/AI technical articles automatically.</p>
                <div class="post-tags">
                    <span class="post-tag">#welcome</span>
                    <span class="post-tag">#demo</span>
                </div>
            </div>
        `;
        
        contentEl.innerHTML = `
            <div class="markdown-body">
                <h1>Welcome to BlogBoard</h1>
                <div class="article-meta-row">
                    <span class="meta-date">Just now</span>
                    <span class="post-reading-time">• 1 min read</span>
                    <div class="meta-tags">
                        <span class="meta-tag">#welcome</span>
                        <span class="meta-tag">#demo</span>
                    </div>
                </div>
                <p>BlogBoard features a multi-agent workflow that designs, reviews, refines, and publishes blog posts completely autonomously.</p>
                <h3>How to use:</h3>
                <ol>
                    <li>Set up your <code>GROQ_API_KEY</code> in the <code>.env</code> file.</li>
                    <li>Run the writer: <code>python backend/run.py</code></li>
                    <li>The system will run through the outline creation, drafting, editor review, and refining stages.</li>
                    <li>It will save the post in <code>frontend/posts/</code> and update the <code>manifest.json</code> database.</li>
                    <li>Refresh this page to see the post dynamically load in the sidebar!</li>
                </ol>
            </div>
        `;

        document.querySelector('.post-card').addEventListener('click', showWelcomeState);
    }

    // Search input listener
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterAndRenderPosts();
    });

    init();
});
