# ================================
# Server — FastAPI
# ================================

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import json

from database import (
    init_db, create_user, get_user_by_username, get_user_by_id,
    get_all_users_except, create_session, get_session, delete_session,
    save_message, get_conversation
)
from auth import (
    hash_password, verify_password, generate_token,
    validate_username, validate_password
)

app = FastAPI()
init_db()


# ================================
# WebSocket manager
# ================================

class WSManager:
    def __init__(self):
        # user_id -> list of WebSockets (multiple tabs)
        self.clients: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.clients.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: int, ws: WebSocket):
        if user_id in self.clients:
            if ws in self.clients[user_id]:
                self.clients[user_id].remove(ws)
            if not self.clients[user_id]:
                del self.clients[user_id]

    async def send_to(self, user_id: int, payload: dict):
        for ws in list(self.clients.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                pass

    def is_online(self, user_id: int) -> bool:
        return user_id in self.clients and len(self.clients[user_id]) > 0


manager = WSManager()


# ================================
# Pydantic models
# ================================

class AuthBody(BaseModel):
    username: str
    password: str


class MessageBody(BaseModel):
    receiver_id: int
    text: str


# ================================
# Auth helper
# ================================

def current_user(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "").strip()
    sess = get_session(token)
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_id(sess["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ================================
# API — AUTH
# ================================

@app.post("/api/register")
async def register(body: AuthBody):
    ok, err = validate_username(body.username)
    if not ok:
        raise HTTPException(status_code=400, detail=err)

    ok, err = validate_password(body.password)
    if not ok:
        raise HTTPException(status_code=400, detail=err)

    username = body.username.strip()

    if get_user_by_username(username):
        raise HTTPException(status_code=400, detail="Username already taken")

    pw_hash = hash_password(body.password)
    user_id = create_user(username, pw_hash)
    if not user_id:
        raise HTTPException(status_code=500, detail="Could not create user")

    token = generate_token()
    create_session(token, user_id)

    return {
        "token": token,
        "user": {"id": user_id, "username": username}
    }


@app.post("/api/login")
async def login(body: AuthBody):
    user = get_user_by_username(body.username.strip())
    if not user:
        raise HTTPException(status_code=401, detail="Galat username ya password")

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Galat username ya password")

    token = generate_token()
    create_session(token, user["id"])

    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"]}
    }


@app.post("/api/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        delete_session(token)
    return {"ok": True}


@app.get("/api/me")
async def me(authorization: Optional[str] = Header(None)):
    user = current_user(authorization)
    return {"user": {"id": user["id"], "username": user["username"]}}


# ================================
# API — USERS
# ================================

@app.get("/api/users")
async def list_users(authorization: Optional[str] = Header(None)):
    user = current_user(authorization)
    users = get_all_users_except(user["id"])
    return {"users": users}


# ================================
# API — MESSAGES
# ================================

@app.get("/api/messages/{other_id}")
async def get_messages(other_id: int, authorization: Optional[str] = Header(None)):
    user = current_user(authorization)
    other = get_user_by_id(other_id)
    if not other:
        raise HTTPException(status_code=404, detail="User not found")
    msgs = get_conversation(user["id"], other_id)
    return {"messages": msgs}


@app.post("/api/messages")
async def post_message(body: MessageBody, authorization: Optional[str] = Header(None)):
    user = current_user(authorization)

    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message khali hai")
    if len(text) > 1000:
        raise HTTPException(status_code=400, detail="Message bahut lamba")

    other = get_user_by_id(body.receiver_id)
    if not other:
        raise HTTPException(status_code=404, detail="User not found")

    msg_id, ts = save_message(user["id"], body.receiver_id, text)

    msg = {
        "id": msg_id,
        "sender_id": user["id"],
        "sender_name": user["username"],
        "receiver_id": body.receiver_id,
        "text": text,
        "timestamp": ts
    }

    # Send to receiver via WebSocket
    await manager.send_to(body.receiver_id, {"type": "message", "message": msg})
    # Send to sender (for other tabs)
    await manager.send_to(user["id"], {"type": "message", "message": msg})

    return {"message": msg}


# ================================
# WebSocket
# ================================

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    # Auth
    sess = get_session(token)
    if not sess:
        await ws.close(code=4001)
        return

    user = get_user_by_id(sess["user_id"])
    if not user:
        await ws.close(code=4001)
        return

    user_id = user["id"]
    await manager.connect(user_id, ws)

    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue

            mtype = data.get("type")

            # ---- New message ----
            if mtype == "message":
                receiver_id = data.get("receiver_id")
                text = (data.get("text") or "").strip()
                if not receiver_id or not text:
                    continue
                if len(text) > 1000:
                    continue

                other = get_user_by_id(receiver_id)
                if not other:
                    continue

                msg_id, ts = save_message(user_id, receiver_id, text)
                msg = {
                    "id": msg_id,
                    "sender_id": user_id,
                    "sender_name": user["username"],
                    "receiver_id": receiver_id,
                    "text": text,
                    "timestamp": ts
                }

                await manager.send_to(receiver_id, {"type": "message", "message": msg})
                await manager.send_to(user_id, {"type": "message", "message": msg})

            # ---- Typing indicator ----
            elif mtype == "typing":
                receiver_id = data.get("receiver_id")
                if receiver_id:
                    await manager.send_to(receiver_id, {
                        "type": "typing",
                        "from_user_id": user_id
                    })

    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)
    except Exception as e:
        print("WS error:", e)
        manager.disconnect(user_id, ws)


# ================================
# Static files + pages
# ================================

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return FileResponse("index.html")


@app.get("/chat.html")
def chat_page():
    return FileResponse("chat.html")