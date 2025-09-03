-- BLOG SYSTEM DATABASE SETUP
-- Run this SQL in your Supabase dashboard to set up the blog system

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    slug TEXT UNIQUE,
    author_name TEXT DEFAULT 'Yashraj Dudhe',
    author_email TEXT DEFAULT 'yashraj@example.com',
    featured_image TEXT,
    seo_title TEXT,
    seo_description TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_tags ON blogs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to update slug and updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    -- Generate slug if not provided or if title changed
    IF NEW.slug IS NULL OR (OLD.title IS DISTINCT FROM NEW.title) THEN
        NEW.slug = generate_slug(NEW.title);
        
        -- Ensure slug is unique
        WHILE EXISTS (SELECT 1 FROM blogs WHERE slug = NEW.slug AND id != NEW.id) LOOP
            NEW.slug = NEW.slug || '-' || extract(epoch from NOW())::integer;
        END LOOP;
    END IF;
    
    -- Set published_at when status changes to published
    IF NEW.status = 'published' AND (OLD.status != 'published' OR OLD.published_at IS NULL) THEN
        NEW.published_at = NOW();
    END IF;
    
    -- Generate SEO fields if not provided
    IF NEW.seo_title IS NULL OR NEW.seo_title = '' THEN
        NEW.seo_title = NEW.title;
    END IF;
    
    IF NEW.seo_description IS NULL OR NEW.seo_description = '' THEN
        NEW.seo_description = NEW.excerpt;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metadata updates
DROP TRIGGER IF EXISTS update_blog_metadata_trigger ON blogs;
CREATE TRIGGER update_blog_metadata_trigger
    BEFORE INSERT OR UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_metadata();

-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON blogs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON blogs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON blogs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON blogs;
DROP POLICY IF EXISTS "public_read_published_blogs" ON blogs;
DROP POLICY IF EXISTS "admin_full_access" ON blogs;

-- Policy: Anyone can read published blogs
CREATE POLICY "public_read_published_blogs" ON blogs
FOR SELECT 
TO anon, authenticated
USING (status = 'published');

-- Policy: Authenticated users can read all blogs (for admin dashboard)
CREATE POLICY "authenticated_read_all_blogs" ON blogs
FOR SELECT 
TO authenticated
USING (true);

-- Policy: Authenticated users can insert blogs
CREATE POLICY "authenticated_insert_blogs" ON blogs
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update their blogs
CREATE POLICY "authenticated_update_blogs" ON blogs
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can delete blogs
CREATE POLICY "authenticated_delete_blogs" ON blogs
FOR DELETE 
TO authenticated
USING (true);

-- Create blog_views table for analytics
CREATE TABLE IF NOT EXISTS blog_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for blog_views
ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert views
CREATE POLICY "public_insert_blog_views" ON blog_views
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Policy: Authenticated users can read views
CREATE POLICY "authenticated_read_blog_views" ON blog_views
FOR SELECT 
TO authenticated
USING (true);

-- Create blog_likes table
CREATE TABLE IF NOT EXISTS blog_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    ip_address INET,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blog_id, ip_address)
);

-- Enable RLS for blog_likes
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can like/unlike blogs
CREATE POLICY "public_manage_blog_likes" ON blog_likes
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_views(blog_id_param UUID, ip_addr INET DEFAULT NULL, user_agent_param TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Insert view record
    INSERT INTO blog_views (blog_id, ip_address, user_agent)
    VALUES (blog_id_param, ip_addr, user_agent_param);
    
    -- Update view count
    UPDATE blogs 
    SET view_count = view_count + 1 
    WHERE id = blog_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle blog like
CREATE OR REPLACE FUNCTION toggle_blog_like(blog_id_param UUID, ip_addr INET)
RETURNS BOOLEAN AS $$
DECLARE
    like_exists BOOLEAN;
    new_like_count INTEGER;
BEGIN
    -- Check if like exists
    SELECT EXISTS(SELECT 1 FROM blog_likes WHERE blog_id = blog_id_param AND ip_address = ip_addr) INTO like_exists;
    
    IF like_exists THEN
        -- Remove like
        DELETE FROM blog_likes WHERE blog_id = blog_id_param AND ip_address = ip_addr;
        
        -- Update like count
        SELECT COUNT(*) INTO new_like_count FROM blog_likes WHERE blog_id = blog_id_param;
        UPDATE blogs SET like_count = new_like_count WHERE id = blog_id_param;
        
        RETURN FALSE; -- Unliked
    ELSE
        -- Add like
        INSERT INTO blog_likes (blog_id, ip_address) VALUES (blog_id_param, ip_addr);
        
        -- Update like count
        SELECT COUNT(*) INTO new_like_count FROM blog_likes WHERE blog_id = blog_id_param;
        UPDATE blogs SET like_count = new_like_count WHERE id = blog_id_param;
        
        RETURN TRUE; -- Liked
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert sample blogs for testing
INSERT INTO blogs (title, excerpt, content, tags, status) VALUES 
(
    'Optimizing JSON Query Performance in Large Datasets',
    'Deep dive into advanced JSON query optimization techniques for handling massive datasets efficiently.',
    '# Optimizing JSON Query Performance in Large Datasets

When working with large JSON datasets, query performance can become a significant bottleneck. In this comprehensive guide, I''ll share proven techniques for optimizing JSON queries.

## 1. Index Strategy for JSON Fields

The first step in optimization is creating proper indexes:

```sql
-- Create GIN index for JSONB columns
CREATE INDEX idx_data_gin ON table_name USING GIN (json_column);

-- Create specific path indexes
CREATE INDEX idx_data_path ON table_name USING GIN ((json_column -> ''specific_path''));
```

## 2. Query Optimization Techniques

### Use JSONB over JSON
Always prefer JSONB over JSON for better performance:
- JSONB supports indexing
- Faster processing due to binary format
- Supports containment operators

### Avoid Complex Nested Queries
Instead of deep nesting, flatten your data structure when possible.

## 3. Real-world Example

Here''s an optimization I implemented that reduced query time from 15s to 200ms:

```javascript
// Before: Slow nested query
const slowQuery = `
  SELECT * FROM products 
  WHERE json_extract(metadata, ''$.category.subcategory.name'') = ?
`;

// After: Optimized with proper indexing
const fastQuery = `
  SELECT * FROM products 
  WHERE metadata->>''category_name'' = ?
`;
```

## 4. Performance Monitoring

Use these tools to monitor your JSON query performance:
- EXPLAIN ANALYZE for query plans
- pg_stat_statements for PostgreSQL
- Query performance insights

## Conclusion

JSON query optimization is crucial for modern applications. By following these techniques, you can achieve significant performance improvements.',
    ARRAY['JSON', 'Database', 'Performance', 'Optimization', 'PostgreSQL'],
    'published'
),
(
    'Building Intelligent Agents with MCP: A Complete Guide',
    'Learn how to build powerful AI agents using the Model Context Protocol (MCP) for seamless system integration.',
    '# Building Intelligent Agents with MCP: A Complete Guide

The Model Context Protocol (MCP) is revolutionizing how we build AI agents that can understand and interact with complex systems. In this guide, I''ll walk you through creating your first MCP-powered agent.

## What is MCP?

MCP (Model Context Protocol) is a standardized way for AI models to interact with external tools and data sources. It provides:

- Standardized tool calling interface
- Context management
- Secure execution environment
- Extensible architecture

## Setting Up Your First MCP Agent

### 1. Installation

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Basic Agent Structure

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "my-agent",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    prompts: {},
    resources: {}
  }
});
```

## Advanced Features

### Tool Integration
MCP agents can integrate with various tools:
- File systems
- Databases
- APIs
- Custom services

### Context Management
Proper context management ensures your agent maintains state across interactions.

## Best Practices

1. **Security First**: Always validate inputs
2. **Error Handling**: Implement robust error handling
3. **Performance**: Optimize for speed and efficiency
4. **Documentation**: Document your tools and capabilities

## Real-world Applications

I''ve successfully implemented MCP agents for:
- Code analysis and refactoring
- Database management
- API integration testing
- Content generation workflows

## Conclusion

MCP provides a powerful foundation for building intelligent agents. Start with simple tools and gradually add complexity as you learn the patterns.',
    ARRAY['MCP', 'AI Agents', 'Automation', 'JavaScript', 'Tools'],
    'published'
),
(
    'Advanced LangChain Patterns for Enterprise Applications',
    'Explore enterprise-grade LangChain patterns and architectures for building production-ready AI applications.',
    '# Advanced LangChain Patterns for Enterprise Applications

As LangChain adoption grows in enterprise environments, it''s crucial to understand advanced patterns that ensure scalability, reliability, and maintainability.

## Enterprise Architecture Patterns

### 1. Chain Composition Pattern

```python
from langchain.chains import LLMChain, SequentialChain
from langchain.prompts import PromptTemplate

# Modular chain design
analysis_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("Analyze: {input}")
)

summary_chain = LLMChain(
    llm=llm, 
    prompt=PromptTemplate.from_template("Summarize: {analysis}")
)

# Compose chains
overall_chain = SequentialChain(
    chains=[analysis_chain, summary_chain],
    input_variables=["input"],
    output_variables=["summary"]
)
```

### 2. Error Handling and Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def robust_chain_call(chain, input_data):
    try:
        return chain.run(input_data)
    except Exception as e:
        logger.error(f"Chain execution failed: {e}")
        raise
```

## Performance Optimization

### Caching Strategies
Implement intelligent caching for expensive operations:
- LLM response caching
- Embedding caching
- Vector store optimization

### Batch Processing
Handle multiple requests efficiently:

```python
async def batch_process(chains, inputs):
    tasks = [chain.arun(input_data) for chain, input_data in zip(chains, inputs)]
    return await asyncio.gather(*tasks)
```

## Security Considerations

1. **Input Sanitization**: Always validate and sanitize inputs
2. **Rate Limiting**: Implement proper rate limiting
3. **API Key Management**: Secure API key handling
4. **Output Filtering**: Filter sensitive information from outputs

## Monitoring and Observability

### LangSmith Integration

```python
from langsmith import traceable

@traceable
def enterprise_chain(input_data):
    # Your chain logic here
    return chain.run(input_data)
```

### Custom Metrics

Track important metrics:
- Token usage
- Response times
- Error rates
- User satisfaction

## Deployment Patterns

### Microservices Architecture
Deploy chains as independent microservices for better scalability.

### Container Orchestration
Use Kubernetes for managing LangChain applications at scale.

## Conclusion

Enterprise LangChain applications require careful consideration of architecture, performance, security, and monitoring. These patterns provide a solid foundation for building production-ready AI applications.',
    ARRAY['LangChain', 'Enterprise', 'AI', 'Python', 'Architecture'],
    'draft'
);

-- Create search function for blogs
CREATE OR REPLACE FUNCTION search_blogs(search_query TEXT DEFAULT '')
RETURNS TABLE(
    id UUID,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    tags TEXT[],
    status TEXT,
    slug TEXT,
    author_name TEXT,
    view_count INTEGER,
    like_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.title, b.excerpt, b.content, b.tags, b.status, b.slug,
        b.author_name, b.view_count, b.like_count, b.created_at, b.updated_at, b.published_at
    FROM blogs b
    WHERE 
        (search_query = '' OR 
         b.title ILIKE '%' || search_query || '%' OR
         b.excerpt ILIKE '%' || search_query || '%' OR
         b.content ILIKE '%' || search_query || '%' OR
         EXISTS (SELECT 1 FROM unnest(b.tags) AS tag WHERE tag ILIKE '%' || search_query || '%'))
        AND (b.status = 'published' OR current_setting('role') = 'authenticated')
    ORDER BY 
        CASE WHEN b.status = 'published' THEN b.published_at ELSE b.updated_at END DESC;
END;
$$ LANGUAGE plpgsql;

-- Verify the setup
SELECT 'Blog database setup complete!' as status;

-- Show sample data
SELECT 
    title, 
    status, 
    array_length(tags, 1) as tag_count,
    view_count,
    like_count,
    created_at
FROM blogs 
ORDER BY created_at DESC;
