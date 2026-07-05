# Quick Start Guide - Code Generation Feature

## 🚀 Getting Started (5 minutes)

### Step 1: Install Dependencies
```bash
cd c:\Users\HP\Desktop\Project-Logitha
pip install -r requirements.txt
```

### Step 2: Get Anthropic API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Create an API key
4. Copy the key

### Step 3: Configure Environment
Create or update `.env` file in project root:
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

### Step 4: Start Backend
```bash
cd backend
python -m uvicorn main:app --reload
```

### Step 5: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 6: Try It Out!
1. Open http://localhost:5173 in your browser
2. Go to "Code Generator" page
3. Enter a description like:
   - "Create a function to validate email addresses"
   - "Build a REST API for user management with FastAPI"
   - "Write a web scraper for weather data"
4. Select language and framework
5. Click "Generate Code"

## ✨ Features to Try

### 1. **Basic Code Generation**
```
Description: Create a Python function that reverses a string
Language: Python
Framework: None
```

### 2. **Framework-Specific Code**
```
Description: Create a FastAPI endpoint for user login
Language: Python
Framework: FastAPI
```

### 3. **Multi-Language Generation**
Will generate the same functionality in multiple languages

### 4. **Code Refinement**
- Generate code
- Add feedback like "Add type hints" or "Add error handling"
- Click "Refine Code"

## 📊 What Gets Logged

Every code generation is logged with:
- Timestamp
- User who requested it
- Description
- Language/Framework used
- Code generated
- Dependencies needed

View in database: `AIUsageLog` table

## 🔧 Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Claude API key

Optional:
- `API_V1_STR` - API route prefix (default: /api/v1)
- `CORS_ORIGINS` - CORS allowed origins
- `DATABASE_URL` - Database connection string

## 📝 Example Descriptions

**Simple Functions:**
- "Create a function to check if a number is prime"
- "Write a function to validate credit card numbers"

**Web Scraping:**
- "Create a web scraper for news headlines"
- "Write a scraper that collects product data from e-commerce"

**APIs:**
- "Build a REST API for a todo application"
- "Create an API for blog post management"

**CLI Tools:**
- "Create a command-line tool for file organization"
- "Build a CLI for database backups"

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not configured" | Add ANTHROPIC_API_KEY to .env |
| "Module not found" | Run `pip install -r requirements.txt` |
| "Cannot connect to API" | Check internet connection, verify API key |
| "Generated code looks incomplete" | Try a more detailed description |
| "CORS error" | Ensure frontend URL is in CORS_ORIGINS |

## 📚 API Documentation

### Generate Code Endpoint
```
POST /api/v1/code-generation/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "description": "What you want to generate",
  "language": "python",
  "framework": "fastapi"
}
```

### Refine Code Endpoint
```
POST /api/v1/code-generation/refine
Content-Type: application/json
Authorization: Bearer {token}

{
  "code": "existing code here",
  "feedback": "improvements you want",
  "language": "python"
}
```

## 💡 Pro Tips

1. **Be Specific**: More detailed descriptions = better code
2. **Include Requirements**: Mention libraries/frameworks explicitly
3. **Provide Context**: Explain the purpose and use case
4. **Iterative Refinement**: Generate → Refine → Refine → Done
5. **Check Dependencies**: Always review required packages

## 🎯 Next Steps

1. ✅ Generate your first code snippet
2. ✅ Try different languages
3. ✅ Test code refinement
4. ✅ Review generated dependencies
5. ✅ Copy code to your projects

## 📞 Support

- Check `CODE_GENERATION_IMPLEMENTATION.md` for detailed documentation
- Review API response errors for specific issues
- Check backend logs for detailed error messages

---

**Ready to generate code?** Start the application and visit the Code Generator page! 🎉
