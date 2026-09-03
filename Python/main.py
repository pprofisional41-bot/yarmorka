from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import time

# Создаем файл базы данных SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- МОДЕЛИ БАЗЫ ДАННЫХ ---

class DBProduct(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(Integer)
    stock = Column(Integer)

class DBOrder(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    status = Column(String, default="active") # active, completed, cancelled
    is_active = Column(Boolean, default=True)
    expires_at = Column(Integer)
    items = relationship("DBOrderItem", cascade="all, delete-orphan")

class DBOrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer)
    quantity = Column(Integer)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Заполним начальными товарами, если база пустая
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    if db.query(DBProduct).count() == 0:
        initial_products = [
            DBProduct(id=1, title="Эко-лежанка из лозы", price=1500, stock=10),
            DBProduct(id=2, title="Кружка из березы", price=800, stock=15),
            DBProduct(id=3, title="Свеча с травами", price=500, stock=20),
            DBProduct(id=4, title="Вязаный свитер", price=3500, stock=5),
        ]
        db.add_all(initial_products)
        db.commit()
    db.close()

# --- PYDANTIC СХЕМЫ ---
class OrderItemSchema(BaseModel):
    id: int
    quantity: int

class OrderCreateSchema(BaseModel):
    user: dict
    items: list[OrderItemSchema]

# --- ЭНДПОИНТЫ ---

@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(DBProduct).all()

@app.post("/api/orders")
def create_order(payload: OrderCreateSchema, db: Session = Depends(get_db)):
    # 1. Проверяем и списываем со склада
    for item in payload.items:
        product = db.query(DBProduct).filter(DBProduct.id == item.id).first()
        if not product or product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Товар с id {item.id} закончился или недоступен")
        product.stock -= item.quantity # Списание

    # 2. Создаем заказ (время жизни, например, 5 минут)
    expires_at = int(time.time()) + 300
    db_order = DBOrder(status="active", is_active=True, expires_at=expires_at)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 3. Добавляем товары в заказ
    for item in payload.items:
        order_item = DBOrderItem(order_id=db_order.id, product_id=item.id, quantity=item.quantity)
        db.add(order_item)
    
    db.commit()
    
    return {
        "id": db_order.id,
        "status": db_order.status,
        "expires_at": db_order.expires_at,
        "is_active": db_order.is_active
    }

@app.get("/api/orders/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return {
        "id": order.id,
        "status": order.status,
        "is_active": order.is_active,
        "expires_at": order.expires_at
    }

# Эндпоинт для отмены / удаления заказа с автоматическим возвратом товаров на склад!
@app.post("/api/orders/{order_id}/cancel")
@app.delete("/api/orders/{order_id}")
def cancel_or_delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    # ВАЖНО: Возвращаем товары обратно на склад, если заказ еще не был завершен
    if order.is_active:
        for item in order.items:
            product = db.query(DBProduct).filter(DBProduct.id == item.product_id).first()
            if product:
                product.stock += item.quantity # Возврат товара!

    # Удаляем заказ из базы
    db.delete(order)
    db.commit()
    return {"message": "Заказ удален, товары возвращены на склад"}