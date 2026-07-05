import json
import time
from datetime import datetime, timezone
from pathlib import Path
import redis
from backend.core.config import settings
from backend.db.session import SessionLocal
from backend.models.project import Project
from backend.models.pipeline import PipelineRun
from backend.jobs.celery_app import celery_app
from backend.core.logger import logger


def _infer_project_pattern(requirement_text: str) -> str:
    text = requirement_text.lower()
    if any(keyword in text for keyword in ["scrap", "scraper", "web scrape", "beautifulsoup", "requests"]):
        return "scraper"
    if any(keyword in text for keyword in ["api", "endpoint", "fastapi", "server", "http", "rest"]):
        return "api"
    if any(keyword in text for keyword in ["cli", "command", "argparse", "utility", "tool"]):
        return "cli"
    if any(keyword in text for keyword in ["database", "sqlite", "postgres", "mysql", "mongodb", "db"]):
        return "database"
    if any(keyword in text for keyword in ["calculator", "math", "compute", "sum", "average", "statistics"]):
        return "calculator"
    return "general"


def _write_python_project(project_dir: Path, requirement_text: str, project_type: str) -> list[str]:
    files = []
    if project_type == "scraper":
        content = (
            "import json\n"
            "import requests\n"
            "from bs4 import BeautifulSoup\n\n"
            "def fetch_page(url: str) -> str:\n"
            "    response = requests.get(url, timeout=15)\n"
            "    response.raise_for_status()\n"
            "    return response.text\n\n"
            "def parse_weather(html: str) -> list[dict]:\n"
            "    soup = BeautifulSoup(html, 'html.parser')\n"
            "    data = []\n"
            "    for card in soup.select('.weather-card'):\n"
            "        location = card.select_one('h2')\n"
            "        temperature = card.select_one('.temp')\n"
            "        condition = card.select_one('.condition')\n"
            "        data.append({\n"
            "            'location': location.text.strip() if location else '',\n"
            "            'temperature': temperature.text.strip() if temperature else '',\n"
            "            'condition': condition.text.strip() if condition else '',\n"
            "        })\n"
            "    return data\n\n"
            "def main():\n"
            "    url = 'https://example.com/weather'\n"
            "    html = fetch_page(url)\n"
            "    weather = parse_weather(html)\n"
            "    print(json.dumps(weather, indent=2))\n\n"
            "if __name__ == '__main__':\n"
            "    main()\n"
        )
        entrypoint = project_dir / "main.py"
        entrypoint.write_text(content, encoding="utf-8")
        (project_dir / "requirements.txt").write_text("requests>=2.31.0\nbeautifulsoup4>=4.12.3\n", encoding="utf-8")
        files.extend(["main.py", "requirements.txt"])
    elif project_type == "api":
        content = (
            "from fastapi import FastAPI\n"
            "\n"
            "app = FastAPI()\n\n"
            "@app.get('/')\n"
            "def read_root():\n"
            "    return {'message': 'API generated from requirements'}\n\n"
            "@app.get('/status')\n"
            "def status():\n"
            "    return {'status': 'ok'}\n"
        )
        entrypoint = project_dir / "main.py"
        entrypoint.write_text(content, encoding="utf-8")
        (project_dir / "requirements.txt").write_text("fastapi>=0.110.0\nuvicorn>=0.26.0\n", encoding="utf-8")
        files.extend(["main.py", "requirements.txt"])
    elif project_type == "database":
        content = (
            "import sqlite3\n"
            "from pathlib import Path\n\n"
            "DB_PATH = Path('app.db')\n\n"
            "def init_db() -> None:\n"
            "    with sqlite3.connect(DB_PATH) as conn:\n"
            "        conn.execute('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT, value REAL)')\n"
            "        conn.commit()\n\n"
            "def add_item(name: str, value: float) -> None:\n"
            "    with sqlite3.connect(DB_PATH) as conn:\n"
            "        conn.execute('INSERT INTO items (name, value) VALUES (?, ?)', (name, value))\n"
            "        conn.commit()\n\n"
            "def main():\n"
            "    init_db()\n"
            "    add_item('sample', 42.0)\n"
            "    print('Inserted sample item into app.db')\n\n"
            "if __name__ == '__main__':\n"
            "    main()\n"
        )
        entrypoint = project_dir / "main.py"
        entrypoint.write_text(content, encoding="utf-8")
        files.append("main.py")
    elif project_type == "calculator":
        content = (
            "def calculate(values: list[float]) -> float:\n"
            "    return sum(values)\n\n"
            "def main():\n"
            "    numbers = [10.0, 20.5, 30.25]\n"
            "    result = calculate(numbers)\n"
            "    print(f'Result: {result}')\n\n"
            "if __name__ == '__main__':\n"
            "    main()\n"
        )
        entrypoint = project_dir / "main.py"
        entrypoint.write_text(content, encoding="utf-8")
        files.append("main.py")
    else:
        content = (
            "def main() -> None:\n"
            f"    print('Generated Python project for: {requirement_text}')\n\n"
            "if __name__ == '__main__':\n"
            "    main()\n"
        )
        entrypoint = project_dir / "main.py"
        entrypoint.write_text(content, encoding="utf-8")
        files.append("main.py")

    readme = project_dir / "README.md"
    readme.write_text(
        f"# Generated Python Project\n\n"
        f"Requirements: {requirement_text}\n\n"
        f"Run `python main.py` after installing requirements if provided.\n",
        encoding="utf-8",
    )
    files.append("README.md")
    return files


def _write_typescript_project(project_dir: Path, requirement_text: str, project_type: str) -> list[str]:
    files = []
    if project_type == "scraper":
        entrypoint = project_dir / "main.ts"
        entrypoint.write_text(
            "import fetch from 'node-fetch';\n"
            "import { load } from 'cheerio';\n\n"
            "async function main() {\n"
            "  const response = await fetch('https://example.com/weather');\n"
            "  const html = await response.text();\n"
            "  const $ = load(html);\n"
            "  const data: Array<{location: string; temperature: string}> = [];\n"
            "  $('.weather-card').each((_, elem) => {\n"
            "    const location = $(elem).find('h2').text().trim();\n"
            "    const temperature = $(elem).find('.temp').text().trim();\n"
            "    data.push({ location, temperature });\n"
            "  });\n"
            "  console.log(JSON.stringify(data, null, 2));\n"
            "}\n\n"
            "main().catch((error) => console.error(error));\n",
            encoding="utf-8",
        )
        pkg = project_dir / "package.json"
        pkg.write_text(
            '{\n'
            '  "name": "generated-scraper",\n'
            '  "type": "module",\n'
            '  "dependencies": {\n'
            '    "cheerio": "^1.0.0-rc.12",\n'
            '    "node-fetch": "^3.4.0"\n'
            '  }\n'
            '}',
            encoding="utf-8",
        )
        files.extend(["main.ts", "package.json"])
    elif project_type == "api":
        entrypoint = project_dir / "main.ts"
        entrypoint.write_text(
            "import express from 'express';\n\n"
            "const app = express();\n"
            "const port = Number(process.env.PORT || 3000);\n\n"
            "app.get('/', (req, res) => {\n"
            "  res.json({ message: 'Generated TypeScript API for your requirements' });\n"
            "});\n\n"
            "app.listen(port, () => {\n"
            "  console.log(`Server listening on http://localhost:${port}`);\n"
            "});\n",
            encoding="utf-8",
        )
        pkg = project_dir / "package.json"
        pkg.write_text(
            '{\n'
            '  "name": "generated-api",\n'
            '  "type": "module",\n'
            '  "dependencies": {\n'
            '    "express": "^4.18.2"\n'
            '  }\n'
            '}',
            encoding="utf-8",
        )
        files.extend(["main.ts", "package.json"])
    elif project_type == "cli":
        entrypoint = project_dir / "main.ts"
        entrypoint.write_text(
            "const args = process.argv.slice(2);\n"
            "const command = args[0] || 'help';\n\n"
            "if (command === 'help') {\n"
            "  console.log('Usage: npm run start -- <command> [options]');\n"
            "} else {\n"
            "  console.log(`Running command: ${command}`);\n"
            "}\n",
            encoding="utf-8",
        )
        pkg = project_dir / "package.json"
        pkg.write_text(
            '{\n'
            '  "name": "generated-cli",\n'
            '  "type": "module",\n'
            '  "scripts": {\n'
            '    "start": "node main.ts"\n'
            '  }\n'
            '}',
            encoding="utf-8",
        )
        files.extend(["main.ts", "package.json"])
    else:
        entrypoint = project_dir / "main.ts"
        entrypoint.write_text(
            f"console.log('Generated TypeScript for: {requirement_text}');\n",
            encoding="utf-8",
        )
        files.append("main.ts")

    readme = project_dir / "README.md"
    readme.write_text(
        f"# Generated TypeScript Project\n\n"
        f"Requirements: {requirement_text}\n",
        encoding="utf-8",
    )
    files.append("README.md")
    return files


def _write_go_project(project_dir: Path, requirement_text: str, project_type: str) -> list[str]:
    files = []
    if project_type == "api":
        content = (
            "package main\n\n"
            "import (\n"
            "  \"fmt\"\n"
            "  \"log\"\n"
            "  \"net/http\"\n"
            ")\n\n"
            "func handler(w http.ResponseWriter, r *http.Request) {\n"
            "  fmt.Fprint(w, \"Generated Go API response\")\n"
            "}\n\n"
            "func main() {\n"
            "  http.HandleFunc(\"/\", handler)\n"
            "  port := \"8080\"\n"
            "  log.Printf(\"Listening on %s\", port)\n"
            "  log.Fatal(http.ListenAndServe(port, nil))\n"
            "}\n"
        )
        (project_dir / "main.go").write_text(content, encoding="utf-8")
        files.append("main.go")
    elif project_type == "scraper":
        content = (
            "package main\n\n"
            "import (\n"
            "  \"fmt\"\n"
            "  \"io\"\n"
            "  \"net/http\"\n"
            ")\n\n"
            "func main() {\n"
            "  resp, err := http.Get(\"https://example.com/weather\")\n"
            "  if err != nil {\n"
            "    panic(err)\n"
            "  }\n"
            "  defer resp.Body.Close()\n\n"
            "  body, err := io.ReadAll(resp.Body)\n"
            "  if err != nil {\n"
            "    panic(err)\n"
            "  }\n"
            "  fmt.Println(string(body))\n"
            "}\n"
        )
        (project_dir / "main.go").write_text(content, encoding="utf-8")
        files.append("main.go")
    elif project_type == "cli":
        content = (
            "package main\n\n"
            "import (\n"
            "  \"fmt\"\n"
            "  \"os\"\n"
            ")\n\n"
            "func main() {\n"
            "  if len(os.Args) < 2 {\n"
            "    fmt.Println(\"Usage: go run main.go <command>\")\n"
            "    return\n"
            "  }\n"
            "  fmt.Println(\"Command:\", os.Args[1])\n"
            "}\n"
        )
        (project_dir / "main.go").write_text(content, encoding="utf-8")
        files.append("main.go")
    else:
        content = (
            "package main\n\n"
            "import \"fmt\"\n\n"
            "func main() {\n"
            f"  fmt.Println(\"Generated Go for: {requirement_text}\")\n"
            "}\n"
        )
        (project_dir / "main.go").write_text(content, encoding="utf-8")
        files.append("main.go")

    readme = project_dir / "README.md"
    readme.write_text(
        f"# Generated Go Project\n\n"
        f"Requirements: {requirement_text}\n",
        encoding="utf-8",
    )
    files.append("README.md")
    return files


def generate_project_artifacts(project_id: int, requirement_text: str, target_language: str, workspace_root: Path | None = None) -> list[str]:
    """Generate a small language-specific project scaffold from the given requirement text."""
    root = workspace_root or Path(__file__).resolve().parent.parent.parent
    project_dir = root / "generated_projects" / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)

    project_pattern = _infer_project_pattern(requirement_text)
    target_language = target_language.lower()

    if target_language == "typescript":
        generated_files = _write_typescript_project(project_dir, requirement_text, project_pattern)
    elif target_language == "go":
        generated_files = _write_go_project(project_dir, requirement_text, project_pattern)
    else:
        generated_files = _write_python_project(project_dir, requirement_text, project_pattern)

    return [str(project_dir.joinpath(path).relative_to(root)) for path in generated_files]

# Synchronous redis client for Celery worker pub/sub broadcasts
redis_client = redis.from_url(settings.REDIS_URL)

def publish_pipeline_event(project_id: int, status: str, stage: str, message: str, attempt: int = 1, error: str = None):
    """Publishes a JSON state update over Redis pub/sub to notify active WebSockets, with a local memory fallback."""
    payload = {
        "project_id": project_id,
        "status": status,
        "stage": stage,
        "message": message,
        "attempt_number": attempt,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    redis_success = False
    try:
        redis_client.publish("project_updates", json.dumps(payload))
        redis_success = True
    except Exception as exc:
        logger.warning("Failed to publish pubsub event to Redis, relying on local memory broadcast fallback", error=str(exc))

    # Trigger local memory broadcast fallback in the active event loop
    try:
        import asyncio
        from backend.websocket.manager import manager
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(manager.broadcast_to_project(project_id, payload), loop)
        except RuntimeError:
            # If no event loop is running in this thread, we are in a pure Celery worker or sub-thread without a loop.
            pass
    except Exception as local_exc:
        logger.error("Failed to broadcast locally in orchestrator fallback", error=str(local_exc))


@celery_app.task(name="run_pipeline")
def run_pipeline(project_id: int):
    """
    Asynchronous task driving the 10-stage project pipeline.
    Applies incremental mock processing, database logs, and live status broadcasts.
    """
    logger.info("Starting pipeline execution", project_id=project_id)
    db = SessionLocal()
    
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.error("Project not found, aborting pipeline", project_id=project_id)
            return False
            
        # 1. State: CREATED
        project.status = "CREATED"
        db.commit()
        publish_pipeline_event(project_id, "CREATED", "INIT", "Initializing workflow pipeline")
        time.sleep(0.5)

        # Helper to execute a standard pipeline stage
        def run_stage(stage_name: str, start_msg: str, success_msg: str, duration: float) -> bool:
            project.status = stage_name
            db.commit()
            
            # Record start of stage
            run_log = PipelineRun(
                project_id=project_id,
                stage=stage_name,
                status="RUNNING",
                started_at=datetime.now(timezone.utc)
            )
            db.add(run_log)
            db.commit()
            
            publish_pipeline_event(project_id, stage_name, stage_name, start_msg)
            time.sleep(duration) # Simulate processing
            
            # Record success of stage
            run_log.status = "SUCCESS"
            run_log.finished_at = datetime.now(timezone.utc)
            db.commit()
            return True

        # 2. Stage: ANALYZING
        run_stage("ANALYZING", "Analyzing requirement prompt text...", "Requirements deconstruction complete", 1.0)
        project.status = "ANALYZED"
        db.commit()
        
        # 3. Stage: GENERATING_CODE
        generated_files = generate_project_artifacts(
            project_id=project_id,
            requirement_text=project.requirement_text,
            target_language=project.target_language,
        )
        publish_pipeline_event(
            project_id,
            "GENERATING_CODE",
            "GENERATING_CODE",
            f"Generated {project.target_language} scaffold with {len(generated_files)} files",
        )
        project.status = "CODE_GENERATED"
        db.commit()

        # 4. Stage: REVIEWING
        run_stage("REVIEWING", "Analyzing code quality and security checks...", "Static audit code review complete", 1.0)
        project.status = "REVIEWED"
        db.commit()

        # 5. Stage: GENERATING_TESTS
        run_stage("GENERATING_TESTS", "Writing unit test suites...", "Test generation complete", 1.0)
        project.status = "TESTS_GENERATED"
        db.commit()

        # 6. EXECUTING_TESTS / AUTO_FIXING self-healing loop
        max_attempts = 3
        test_success = False
        
        for attempt in range(1, max_attempts + 1):
            project.status = "EXECUTING_TESTS"
            db.commit()
            
            run_log = PipelineRun(
                project_id=project_id,
                stage="EXECUTING_TESTS",
                status="RUNNING",
                attempt_number=attempt,
                started_at=datetime.now(timezone.utc)
            )
            db.add(run_log)
            db.commit()
            
            publish_pipeline_event(
                project_id, 
                "EXECUTING_TESTS", 
                "EXECUTING_TESTS", 
                f"Executing test cases inside sandbox (attempt {attempt}/{max_attempts})",
                attempt=attempt
            )
            time.sleep(1.0)
            
            # Simulate a failure on the first attempt to trigger self-healing
            if attempt == 1:
                run_log.status = "FAILED"
                run_log.error = "AssertionError: test_calculate_total failed. Expected 100, got 0."
                run_log.finished_at = datetime.now(timezone.utc)
                db.commit()
                
                # Transition to AUTO_FIXING
                project.status = "AUTO_FIXING"
                db.commit()
                
                fix_log = PipelineRun(
                    project_id=project_id,
                    stage="AUTO_FIXING",
                    status="RUNNING",
                    attempt_number=attempt,
                    started_at=datetime.now(timezone.utc)
                )
                db.add(fix_log)
                db.commit()
                
                publish_pipeline_event(
                    project_id, 
                    "AUTO_FIXING", 
                    "AUTO_FIXING", 
                    "Tests failed. Prompting self-healing loop...",
                    attempt=attempt,
                    error=run_log.error
                )
                time.sleep(1.5)
                
                fix_log.status = "SUCCESS"
                fix_log.finished_at = datetime.now(timezone.utc)
                db.commit()
            else:
                # Tests pass on attempt 2
                run_log.status = "SUCCESS"
                run_log.finished_at = datetime.now(timezone.utc)
                db.commit()
                test_success = True
                break
                
        if not test_success:
            project.status = "FIX_EXHAUSTED"
            db.commit()
            publish_pipeline_event(project_id, "FIX_EXHAUSTED", "TESTS", "Self-healing loops exhausted without success")
            return False

        # 7. Stage: COMPLETED
        project.status = "COMPLETED"
        db.commit()
        
        # Log final pipeline run
        final_run = PipelineRun(
            project_id=project_id,
            stage="COMPLETED",
            status="SUCCESS",
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc)
        )
        db.add(final_run)
        db.commit()
        
        publish_pipeline_event(project_id, "COMPLETED", "COMPLETED", "Project generation completed successfully")
        logger.info("Pipeline completed successfully", project_id=project_id)
        return True
        
    except Exception as exc:
        logger.exception("Pipeline crashed due to internal error", project_id=project_id, error=str(exc))
        try:
            project.status = "FAILED"
            db.commit()
            publish_pipeline_event(project_id, "FAILED", "CRASHED", f"Pipeline crashed: {str(exc)}")
        except Exception:
            pass
        return False
    finally:
        db.close()
