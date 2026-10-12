"""
Serves the showcase's Sub-Agents supervisor (subagents.py) for the Angular harness.

Mounted at `/subagents`, as in the showcase's agent_server.py
(`app.mount("/subagents", subagents_app)`). The runtime in
frontend/server.ts points at `/subagents/` — Starlette redirects the
slash-less form.
"""
from dotenv import load_dotenv

# Before importing the agent: subagents.py builds its LLMConfigs at import
# time, and they need OPENAI_API_KEY. Walks up from here, so the repo-root .env
# or backend/.env is found.
load_dotenv()

from fastapi import FastAPI  # noqa: E402

from subagents import subagents_app  # noqa: E402

app = FastAPI()
app.mount("/subagents", subagents_app)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
