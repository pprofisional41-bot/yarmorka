import asyncio
import json
import random
import time
import urllib.request
from typing import List
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8228978987:AAEKndZqTzu4pdHVa-2ZvA1QGYoo2_6qHa4")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "7217442345")

app = FastAPI(title="Ярмарка Меленки API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

products_db = [
    {"id": 1, "title": "Плетёный корж-корзинка для котов", "description": "Эко-лежанка из лозы.", "price": 2500, "badge": "Хит ярмарки 🔥", "category": "home", "stock": 3},
    {"id": 2, "title": "Деревянная кружка викинга", "description": "Из сувеля березы.", "price": 1800, "badge": "Ручная работа 🪵", "category": "craft", "stock": 5},
    {"id": 3, "title": "Ароматная свеча с травами", "description": "Пахнет лесом и уютом.", "price": 900, "badge": "Уют 🌿", "category": "home", "stock": 8},
    {"id": 4, "title": "Вязаный свитер «Озверин»", "description": "Теплый и стильный.", "price": 4200, "badge": "Эксклюзив ✨", "category": "clothes", "stock": 2},
]

orders_db = {}


def find_order(order_id: str):
    """Ищем заказ и по полному id (МЕЛ-1234), и по цифрам (1234)"""
    order_id = str(order_id)
    if order_id in orders_db:
        return orders_db[order_id]

    clean = "".join(c for c in order_id if c.isdigit())
    if not clean:
        return None

    for oid, order in orders_db.items():
        if "".join(c for c in oid if c.isdigit()) == clean:
            return order
    return None


def clean_expired_orders():
    current_time = time.time()
    for order_id, order in list(orders_db.items()):
        if order["status"] == "pending" and current_time > order["expires_at"]:
            order["status"] = "expired"
            order["is_active"] = False
            for item in order["items"]:
                for prod in products_db:
                    if prod["id"] == item["id"]:
                        prod["stock"] += item["quantity"]


def send_telegram_alert(order):
    if not TELEGRAM_BOT_TOKEN:
        return

    items_text = "\n".join([f"• {i['title']} ({i['quantity']} шт)" for i in order["items"]])
    message = (
        f"⏱️ *НОВАЯ БРОНЬ (на 30 минут)!*\n\n"
        f"🎟 *Код:* `{order['id']}`\n"
        f"👤 *Имя:* {order['user']['name']}\n"
        f"📞 *Тел:* {order['user']['phone']}\n\n"
        f"📦 *Товары:*\n{items_text}\n\n"
        f"💰 *Сумма:* *{order['total']} ₽*"
    )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown",
        "reply_markup": {
            "inline_keyboard": [[{"text": "✅ ВЫПОЛНЕНО (Товар выдан)", "callback_data": f"done_{order['id']}"}]]
        },
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req)
    except Exception as e:
        print(f"Ошибка отправки Telegram: {e}")


async def telegram_polling_loop():
    if not TELEGRAM_BOT_TOKEN:
        return

    try:
        del_req = urllib.request.Request(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook")
        await asyncio.to_thread(urllib.request.urlopen, del_req)
    except Exception:
        pass

    offset = 0
    while True:
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates?offset={offset}&timeout=10"

            def fetch():
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req) as resp:
                    return json.loads(resp.read().decode())

            res = await asyncio.to_thread(fetch)

            if res.get("ok"):
                for update in res.get("result", []):
                    offset = update["update_id"] + 1

                    if "callback_query" in update:
                        cb = update["callback_query"]
                        cb_id = cb["id"]
                        chat_id = cb["message"]["chat"]["id"]
                        msg_id = cb["message"]["message_id"]
                        action = cb.get("data", "")

                        if action.startswith("done_"):
                            order_id = action.replace("done_", "")
                            order = find_order(order_id)

                            if order and order["status"] == "pending":
                                # ВАЖНО: статус completed, stock НЕ возвращаем
                                order["status"] = "completed"
                                order["is_active"] = False

                                edit_payload = {
                                    "chat_id": chat_id,
                                    "message_id": msg_id,
                                    "text": f"✅ *ЗАКАЗ {order['id']} ВЫДАН И ЗАКРЫТ!*",
                                    "parse_mode": "Markdown",
                                }
                                edit_req = urllib.request.Request(
                                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/editMessageText",
                                    data=json.dumps(edit_payload).encode("utf-8"),
                                    headers={"Content-Type": "application/json"},
                                )
                                await asyncio.to_thread(urllib.request.urlopen, edit_req)

                        ans_payload = {"callback_query_id": cb_id}
                        ans_req = urllib.request.Request(
                            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/answerCallbackQuery",
                            data=json.dumps(ans_payload).encode("utf-8"),
                            headers={"Content-Type": "application/json"},
                        )
                        await asyncio.to_thread(urllib.request.urlopen, ans_req)

        except Exception as e:
            print(f"Ошибка polling: {e}")

        await asyncio.sleep(1)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(telegram_polling_loop())


class OrderItemInput(BaseModel):
    id: int
    quantity: int


class UserInput(BaseModel):
    name: str
    phone: str


class CreateOrderInput(BaseModel):
    user: UserInput
    items: List[OrderItemInput]


@app.get("/api/products")
def get_products():
    clean_expired_orders()
    return products_db


@app.post("/api/orders")
def create_order(data: CreateOrderInput):
    clean_expired_orders()

    for item in data.items:
        product = next((p for p in products_db if p["id"] == item.id), None)
        if not product or product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail="Товара недостаточно на складе!")

    order_items = []
    total_price = 0
    for item in data.items:
        product = next(p for p in products_db if p["id"] == item.id)
        product["stock"] -= item.quantity
        order_items.append({
            "id": product["id"],
            "title": product["title"],
            "price": product["price"],
            "quantity": item.quantity,
        })
        total_price += product["price"] * item.quantity

    order_id = f"МЕЛ-{random.randint(1000, 9999)}"
    now = time.time()
    expires_at = now + 30 * 60  # 30 минут

    user_data = data.user.model_dump() if hasattr(data.user, "model_dump") else data.user.dict()

    order = {
        "id": order_id,
        "user": user_data,
        "items": order_items,
        "total": total_price,
        "status": "pending",
        "is_active": True,
        "created_at": now,
        "expires_at": expires_at,
    }

    orders_db[order_id] = order
    send_telegram_alert(order)
    return order


@app.get("/api/orders/{order_id}")
def get_order(order_id: str):
    clean_expired_orders()
    order = find_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    return {
        "id": order["id"],
        "status": order["status"],
        "is_active": order.get("is_active", order["status"] == "pending"),
        "expires_at": order["expires_at"],
    }


@app.post("/api/orders/{order_id}/cancel")
def cancel_order(order_id: str):
    order = find_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if order["status"] == "pending":
        order["status"] = "cancelled"
        order["is_active"] = False
        for item in order["items"]:
            for prod in products_db:
                if prod["id"] == item["id"]:
                    prod["stock"] += item["quantity"]

    return {"status": "ok", "message": "Заказ отменён, товары возвращены"}


@app.post("/api/orders/{order_id}/complete")
def complete_order(order_id: str):
    order = find_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if order["status"] == "pending":
        order["status"] = "completed"
        order["is_active"] = False
        # stock НЕ возвращаем — товар выдан

    return {"status": "ok", "message": "Заказ выполнен"}