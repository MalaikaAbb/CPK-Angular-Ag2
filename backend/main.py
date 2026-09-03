"""
AG2 weather agent, served over AG-UI for the Angular harness.

Shape follows `weather.py` in the AG2 samples repo
(https://github.com/ag2ai/ag2-samples) — an `Agent` with tools, wrapped in
`AGUIStream` and mounted on a FastAPI app — reduced to the single tool the
frontend renders. The sample's Open-Meteo geocoding and forecast tools are not
carried over; this harness only needs a tool call it can observe end to end.
"""
import os
import time
from textwrap import dedent

from ag2 import Agent, tool
from ag2.ag_ui import AGUIStream
from ag2.config import OpenAIConfig
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


# `name="getWeather"` is the wire contract: the frontend's registerRenderToolCall
# (frontend/src/app/features/tools/tools-chat.component.ts) matches the agent's
# tool by exact string, including case, and its args schema expects `city`.
@tool(name="getWeather", description="Get the weather for a given city.")
def get_weather(city: str) -> str:
    # Measured without this sleep, TOOL_CALL_START -> TOOL_CALL_RESULT took a
    # few milliseconds — about one frame — so the renderer's "in-progress"
    # branch was never painted and only the completed card was ever visible. A
    # real weather API would take this long anyway; the delay is what makes the
    # tool renderer's non-complete states observable in the harness.
    # Set WEATHER_TOOL_DELAY=0 to remove it.
    time.sleep(float(os.getenv("WEATHER_TOOL_DELAY", "1.5")))
    return f"The weather for {city} is 70 degrees."


agent = Agent(
    "WeatherAgent",
    prompt=dedent("""
        You are a helpful weather assistant. Be helpful and friendly, and format
        your responses using markdown where appropriate.

        When the user asks about the weather, call the getWeather tool with the
        city they named. After the tool returns, reply with a single short
        sentence summarising the result — the UI renders the tool result as a
        card, so keep the text answer concise.

        When an action is consequential or destructive, call the requestApproval
        frontend tool and wait for the user's decision before proceeding."""),
    config=OpenAIConfig(
        model=os.getenv("OPENAI_CHAT_MODEL_ID", "gpt-4o-mini"),
        streaming=True,
    ),
    tools=[get_weather],
)

stream = AGUIStream(agent)

app = FastAPI()

# Allow the Angular app to call this server from the browser.
#
# The chat does not need this: the browser only ever talks to the Copilot
# Runtime, which reaches this agent server-side, where CORS does not apply.
# It is here so the harness's connection check can read /status directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  # ng serve
        "http://localhost:4000",  # SSR build — npm run serve:ssr:frontend
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/status")
def status() -> dict[str, str]:
    """Liveness probe for the harness's connection check; the AG-UI mount is POST-only."""
    return {"status": "ok", "agent": "WeatherAgent", "agui": "/weather/"}


# AG-UI over SSE. Starlette redirects `/weather` to `/weather/`, so the runtime
# is pointed at the trailing-slash form (frontend/server.ts).
app.mount("/weather", stream.build_asgi())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
