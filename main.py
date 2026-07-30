from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any, Union
import psycopg2
import psycopg2.extras
import psycopg2.errors
import os
import uuid
import time
from werkzeug.security import generate_password_hash, check_password_hash
from decimal import Decimal

# Cloudinary setup — uses env vars CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
# If not set, falls back to local disk storage (for local dev)
_CLOUDINARY_ENABLED = bool(
    os.environ.get("CLOUDINARY_CLOUD_NAME") and
    os.environ.get("CLOUDINARY_API_KEY") and
    os.environ.get("CLOUDINARY_API_SECRET")
)
if _CLOUDINARY_ENABLED:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )

# Simple in-memory cache
_cache = {}
_cache_ttl = {}
CACHE_SECONDS = 30

def cache_get(key):
    if key in _cache and time.time() < _cache_ttl.get(key, 0):
        return _cache[key]
    return None

def cache_set(key, value, ttl=CACHE_SECONDS):
    _cache[key] = value
    _cache_ttl[key] = time.time() + ttl

def cache_clear(pattern=None):
    if pattern is None:
        _cache.clear()
        _cache_ttl.clear()
    else:
        keys = [k for k in _cache if pattern in k]
        for k in keys:
            del _cache[k]
            _cache_ttl.pop(k, None)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    username: str
    password: str

class UserCreate(UserBase):
    role: str

class LoginResponse(BaseModel):
    status: str
    message: str
    user: Dict[str, Any]

class RoomUpdate(BaseModel):
    status: str
    room_type: Optional[str] = None
    selected: Optional[bool] = None
    room_number: Optional[str] = None

class GuestBooking(BaseModel):
    id: str
    name: str
    mobileNo: str
    idType: Optional[str] = ""
    idNo: Optional[str] = ""
    whatsappNo: Optional[str] = None
    emailID: Optional[str] = None
    otherIdName: Optional[str] = None
    idPhotoUrl: Optional[str] = None
    userPhotoUrl: Optional[str] = None
    vehicleType: Optional[str] = None
    vehicleNo: Optional[str] = None

class BookingCreate(BaseModel):
    checkInDate: str
    checkOutDate: str
    numberOfDays: Union[int, float, str]
    bookingRef: str
    numOfRooms: Union[int, str]
    selectedRooms: List[str]
    roomBedType: List[Dict[str, str]]
    guestDetails: List[GuestBooking]
    guestType: str
    guestOccupancy: List[Dict[str, Any]]
    corporateName: Optional[str] = None
    breakfast: Optional[str] = None
    anyDiscountAmt: Optional[Union[float, str]] = 0
    anyDiscountCmt: Optional[str] = None
    roomAmount: Union[float, str]
    gst: Union[float, str]
    advanceAmount: Union[float, str]
    netPayable: Union[float, str]
    paymentAmount: Union[float, str]
    paymentMethod: str
    balanceAmnt: Union[float, str]

    @field_validator("numberOfDays", "numOfRooms", mode="before")
    @classmethod
    def coerce_int(cls, v):
        try:
            return int(float(str(v)))
        except Exception:
            return 1

    @field_validator("roomAmount", "gst", "advanceAmount", "netPayable", "paymentAmount", "balanceAmnt", "anyDiscountAmt", mode="before")
    @classmethod
    def coerce_float(cls, v):
        if v is None or v == "":
            return 0.0
        try:
            return float(str(v))
        except Exception:
            return 0.0

class AdvanceBookingCreate(BaseModel):
    guestName: str
    guestMobile: str
    guestWhatsapp: str
    guestEmail: Optional[str] = None
    guestType: str
    corporateName: Optional[str] = None
    checkInDate: str
    checkOutDate: str
    numberOfNights: int
    roomType: str
    numberOfRooms: int
    ratePerRoom: float
    totalAmount: float
    discountAmt: Optional[float] = 0
    finalAmount: float
    advanceAmount: float
    paidVia: str
    paidReference: Optional[str] = None
    balanceAmount: float
    remarks: Optional[str] = None
    bookingRef: Optional[str] = None
    previousRef: Optional[str] = None

class FileUploadResponse(BaseModel):
    status: str
    message: str
    file_path: str

class ExtraChargeCreate(BaseModel):
    amount: float
    reason: str

class MoneyEntryCreate(BaseModel):
    amount: float
    payment_method: str
    reference_number: Optional[str] = None

class ExtendBooking(BaseModel):
    newCheckOutDate: str

class RoomShiftCreate(BaseModel):
    newRoomNumber: str
    reason: str
    oldRoomStatus: str  # "Cleaning Process" | "Maintenance"

class AddGuestCreate(BaseModel):
    name: str
    mobileNo: str
    idType: str
    idNo: str
    whatsappNo: Optional[str] = None
    emailID: Optional[str] = None
    idPhotoUrl: Optional[str] = None

# ---------------------------------------------------------------------------
# Account Module — Pydantic Models
# ---------------------------------------------------------------------------

class ExpenseEntryCreate(BaseModel):
    category: str
    amount: float
    reference_number: Optional[str] = None
    attachment_url: Optional[str] = None
    notes: Optional[str] = None
    entry_date: Optional[str] = None

class AccountBalanceCreate(BaseModel):
    bank_name: str
    entry_date: str
    amount: float
    notes: Optional[str] = None

class CreditCardCreate(BaseModel):
    card_name: str
    entry_date: str
    amount: float
    notes: Optional[str] = None

class GuestReturnCreate(BaseModel):
    return_type: str  # advance_cancel | early_checkout | other
    booking_id: Optional[int] = None
    return_date: str
    amount: float
    reason: Optional[str] = None

# ---------------------------------------------------------------------------
# App & middleware
# ---------------------------------------------------------------------------

app = FastAPI(title="BnbHomes API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bnbhomes-inky.vercel.app",
        "https://bnbhomes-git-main-waitnots-projects.vercel.app",
        "https://bnbhomes-ndnlqfhb8-waitnots-projects.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    import logging
    logging.error(f"422 Validation Error on {request.url}: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors(), "body": str(exc.body)})


@app.on_event("startup")
async def create_tables():
    import asyncio
    import logging
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, _create_tables_sync)

def _create_tables_sync():
    import logging
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # Core tables (created here if not already present via setup_db.py)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS floors (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rooms (
                    id SERIAL PRIMARY KEY,
                    floor_id INT NOT NULL REFERENCES floors(id),
                    room_number VARCHAR(20) UNIQUE NOT NULL,
                    room_type VARCHAR(100),
                    status VARCHAR(50) DEFAULT 'Vacant',
                    selected BOOLEAN DEFAULT FALSE
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bookings (
                    id SERIAL PRIMARY KEY,
                    check_in_date DATE,
                    check_out_date DATE,
                    check_in_time TIMESTAMP,
                    check_out_time TIMESTAMP,
                    number_of_days INT,
                    booking_ref VARCHAR(50),
                    num_of_rooms INT,
                    guest_type VARCHAR(100),
                    corporate_name VARCHAR(255),
                    breakfast VARCHAR(50),
                    any_discount_amt DECIMAL(10,2) DEFAULT 0,
                    any_discount_cmt TEXT,
                    room_amount DECIMAL(10,2),
                    gst DECIMAL(10,2),
                    advance_amount DECIMAL(10,2),
                    net_payable DECIMAL(10,2),
                    payment_amount DECIMAL(10,2),
                    payment_method VARCHAR(100),
                    balance_amount DECIMAL(10,2)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS guests (
                    id SERIAL PRIMARY KEY,
                    booking_id INT NOT NULL REFERENCES bookings(id),
                    guest_id VARCHAR(100),
                    name VARCHAR(255),
                    mobile_no VARCHAR(20),
                    whatsapp_no VARCHAR(20),
                    email_id VARCHAR(255),
                    id_type VARCHAR(100),
                    other_id_name VARCHAR(100),
                    id_no VARCHAR(100),
                    id_photo_url TEXT,
                    user_photo_url TEXT,
                    vehicle_type VARCHAR(100),
                    vehicle_no VARCHAR(50)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS selected_rooms (
                    id SERIAL PRIMARY KEY,
                    booking_id INT NOT NULL REFERENCES bookings(id),
                    room_number VARCHAR(20) NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS room_bed_types (
                    id SERIAL PRIMARY KEY,
                    booking_id INT NOT NULL REFERENCES bookings(id),
                    room_number VARCHAR(20),
                    bed_type VARCHAR(100)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS guest_occupancy (
                    id SERIAL PRIMARY KEY,
                    booking_id INT NOT NULL REFERENCES bookings(id),
                    room_number VARCHAR(20),
                    num_of_adults INT DEFAULT 1,
                    num_of_children INT DEFAULT 0
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS extra_charges (
                    id SERIAL PRIMARY KEY,
                    booking_id INT NOT NULL REFERENCES bookings(id),
                    amount DECIMAL(10,2) NOT NULL,
                    reason VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS money_entries (
                    id SERIAL PRIMARY KEY,
                    booking_id INT NOT NULL REFERENCES bookings(id),
                    amount DECIMAL(10,2) NOT NULL,
                    payment_method VARCHAR(50) NOT NULL,
                    reference_number VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS room_shift_history (
                    id SERIAL PRIMARY KEY,
                    booking_id INT NOT NULL REFERENCES bookings(id),
                    old_room_number VARCHAR(20) NOT NULL,
                    new_room_number VARCHAR(20) NOT NULL,
                    reason TEXT NOT NULL,
                    old_room_status VARCHAR(50) NOT NULL,
                    shift_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    duration_hours DECIMAL(10,2)
                )
            """)
            conn.commit()
            logging.info("DB tables verified/created successfully.")
        finally:
            conn.close()
    except Exception as e:
        logging.warning(f"create_tables background task failed (tables may already exist): {e}")

# ---------------------------------------------------------------------------
# DB config
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_Yg3cvwMIG6WZ@ep-broad-glade-ayxm7jro-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    conn.autocommit = False
    return conn


def _date_str(val):
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)


def _decimal_str(val):
    if val is None:
        return "0"
    return str(val)

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
async def index():
    return {"message": "Welcome to BnbHome v2.0.0 - FastAPI + PostgreSQL"}

@app.get("/debug-login")
async def debug_login():
    """Temporary debug endpoint — remove after fixing login."""
    import werkzeug
    from werkzeug.security import check_password_hash
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, password_hash, role FROM users WHERE username = 'admin'")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"error": "admin user not found"}
    pw_ok = check_password_hash(row["password_hash"], "Admin@123")
    return {
        "username": row["username"],
        "role": row["role"],
        "hash_prefix": row["password_hash"][:40],
        "hash_method": row["password_hash"].split(":")[0],
        "pw_check": pw_ok,
        "werkzeug_version": getattr(werkzeug, "__version__", "unknown"),
    }

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/register")
async def register_user(user: UserCreate):
    if user.role not in ["admin", "account", "audit", "employee"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    password_hash = generate_password_hash(user.password)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s) RETURNING id",
            (user.username, password_hash, user.role),
        )
        conn.commit()
        return {"status": "success", "message": "User registered successfully"}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Username already exists")
    finally:
        conn.close()


@app.post("/login", response_model=LoginResponse)
async def login_user(user: UserBase):
    import logging
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = %s", (user.username,))
        db_user = cursor.fetchone()
        if not db_user:
            logging.warning(f"Login failed: user '{user.username}' not found")
            raise HTTPException(status_code=401, detail="Invalid username or password")
        pw_ok = check_password_hash(db_user["password_hash"], user.password)
        logging.warning(f"Login attempt: user={user.username} hash_method={db_user['password_hash'].split(':')[0]} pw_ok={pw_ok}")
        if not pw_ok:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        return {
            "status": "success",
            "message": "Login successful",
            "user": {"id": db_user["id"], "username": db_user["username"], "role": db_user["role"]},
        }
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Rooms
# ---------------------------------------------------------------------------

@app.get("/rooms")
async def get_rooms():
    cached = cache_get("rooms")
    if cached is not None:
        return cached
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors ORDER BY id")
    floors = [dict(r) for r in cursor.fetchall()]
    cursor.execute("""
        SELECT * FROM rooms
        ORDER BY floor_id,
                 CASE WHEN room_number ~ '^[0-9]+$' THEN LPAD(room_number, 10, '0') ELSE room_number END
    """)
    rooms = [dict(r) for r in cursor.fetchall()]
    conn.close()
    result = {}
    for floor in floors:
        result[floor["name"]] = [r for r in rooms if r["floor_id"] == floor["id"]]
    cache_set("rooms", result)
    return result


@app.post("/rooms")
async def update_rooms_bulk(rooms: Dict[str, List[RoomUpdate]]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        for floor_name, room_list in rooms.items():
            cursor.execute("SELECT id FROM floors WHERE name = %s", (floor_name,))
            floor = cursor.fetchone()
            if not floor:
                continue
            floor_id = floor["id"]
            for room in room_list:
                cursor.execute(
                    "UPDATE rooms SET room_type = %s, status = %s, selected = %s WHERE room_number = %s AND floor_id = %s",
                    (room.room_type, room.status, room.selected, room.room_number, floor_id),
                )
        conn.commit()
        cache_clear("rooms")
        return {"status": "success"}
    finally:
        conn.close()


@app.patch("/rooms/{room_number}")
async def update_room_status(room_number: str, room: RoomUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM rooms WHERE room_number = %s", (room_number,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Room not found")
        new_type = room.room_type if room.room_type is not None else existing["room_type"]
        new_selected = room.selected if room.selected is not None else existing["selected"]
        cursor.execute(
            "UPDATE rooms SET room_type = %s, status = %s, selected = %s WHERE room_number = %s",
            (new_type, room.status, new_selected, room_number),
        )
        conn.commit()
        cache_clear("rooms")
        return {"status": "success"}
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# File upload
# ---------------------------------------------------------------------------

@app.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    ext = file.filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}")

    contents = await file.read()

    if _CLOUDINARY_ENABLED:
        # Upload to Cloudinary — returns a permanent HTTPS URL
        try:
            import io
            result = cloudinary.uploader.upload(
                io.BytesIO(contents),
                folder="bnbhomes",
                resource_type="auto",
            )
            public_url = result["secure_url"]
            return FileUploadResponse(status="success", message="File uploaded successfully", file_path=public_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {e}")
    else:
        # Fallback: local disk (development only — not persistent on Render)
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        try:
            with open(file_path, "wb") as f:
                f.write(contents)
            return FileUploadResponse(status="success", message="File uploaded successfully", file_path=filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/files")
async def fetch_file(path: str):
    absolute_path = os.path.join(UPLOAD_FOLDER, path)
    if not os.path.isfile(absolute_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(absolute_path)

# ---------------------------------------------------------------------------
# Bookings — helpers
# ---------------------------------------------------------------------------

def _fetch_booking_full(cursor, booking_id):
    cursor.execute("SELECT * FROM bookings WHERE id = %s", (booking_id,))
    booking = cursor.fetchone()
    if not booking:
        return None
    cursor.execute("SELECT room_number FROM selected_rooms WHERE booking_id = %s", (booking_id,))
    selected_rooms = [r["room_number"] for r in cursor.fetchall()]
    cursor.execute("SELECT room_number, bed_type FROM room_bed_types WHERE booking_id = %s", (booking_id,))
    room_bed_type = cursor.fetchall()
    cursor.execute("SELECT * FROM guests WHERE booking_id = %s", (booking_id,))
    guests = cursor.fetchall()
    cursor.execute("SELECT room_number, num_of_adults, num_of_children FROM guest_occupancy WHERE booking_id = %s", (booking_id,))
    occupancy = cursor.fetchall()
    return {
        "id": booking["id"],
        "checkInDate": _date_str(booking["check_in_date"]),
        "checkOutDate": _date_str(booking["check_out_date"]),
        "checkInTime": _date_str(booking.get("check_in_time")),
        "checkOutTime": _date_str(booking.get("check_out_time")),
        "numberOfDays": booking["number_of_days"],
        "bookingRef": booking["booking_ref"],
        "numOfRooms": booking["num_of_rooms"],
        "selectedRooms": selected_rooms,
        "roomBedType": room_bed_type,
        "guestDetails": guests,
        "guestType": booking["guest_type"],
        "corporateName": booking["corporate_name"],
        "guestOccupancy": occupancy,
        "breakfast": booking["breakfast"],
        "anyDiscountAmt": _decimal_str(booking["any_discount_amt"]),
        "anyDiscountCmt": booking["any_discount_cmt"],
        "roomAmount": _decimal_str(booking["room_amount"]),
        "gst": _decimal_str(booking["gst"]),
        "advanceAmount": _decimal_str(booking["advance_amount"]),
        "netPayable": _decimal_str(booking["net_payable"]),
        "paymentAmount": _decimal_str(booking["payment_amount"]),
        "paymentMethod": booking["payment_method"],
        "balanceAmnt": _decimal_str(booking["balance_amount"]),
    }

# ---------------------------------------------------------------------------
# Bookings — CRUD
# ---------------------------------------------------------------------------

@app.get("/bookings/guestDetail/{room_number}")
async def get_guest_detail_by_room(room_number: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT booking_id FROM selected_rooms WHERE room_number = %s ORDER BY booking_id DESC LIMIT 1",
            (room_number,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No active booking for this room")
        data = _fetch_booking_full(cursor, row["booking_id"])
        if not data:
            raise HTTPException(status_code=404, detail="Booking not found")
        return data
    finally:
        conn.close()


@app.get("/bookings/getCheckout/{room_number}")
async def get_checkout_data(room_number: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT booking_id FROM selected_rooms WHERE room_number = %s ORDER BY booking_id DESC LIMIT 1",
            (room_number,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No active booking for this room")
        data = _fetch_booking_full(cursor, row["booking_id"])
        if not data:
            raise HTTPException(status_code=404, detail="Booking not found")
        return data
    finally:
        conn.close()


@app.get("/bookings/{booking_id}")
async def get_booking(booking_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = _fetch_booking_full(cursor, booking_id)
        if not data:
            raise HTTPException(status_code=404, detail="Booking not found")
        return data
    finally:
        conn.close()


@app.post("/bookings")
async def create_booking(booking: BookingCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO bookings (check_in_date, check_out_date, number_of_days, booking_ref, num_of_rooms, guest_type, corporate_name, breakfast, any_discount_amt, any_discount_cmt, room_amount, gst, advance_amount, net_payable, payment_amount, payment_method, balance_amount) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (booking.checkInDate, booking.checkOutDate, booking.numberOfDays, booking.bookingRef,
             booking.numOfRooms, booking.guestType, booking.corporateName, booking.breakfast,
             booking.anyDiscountAmt, booking.anyDiscountCmt, booking.roomAmount, booking.gst,
             booking.advanceAmount, booking.netPayable, booking.paymentAmount, booking.paymentMethod,
             booking.balanceAmnt),
        )
        booking_id = cursor.fetchone()["id"]
        for guest in booking.guestDetails:
            cursor.execute(
                "INSERT INTO guests (booking_id, guest_id, name, mobile_no, whatsapp_no, email_id, id_type, other_id_name, id_no, id_photo_url, user_photo_url, vehicle_type, vehicle_no) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (booking_id, guest.id, guest.name, guest.mobileNo, guest.whatsappNo, guest.emailID,
                 guest.idType, guest.otherIdName, guest.idNo, guest.idPhotoUrl, guest.userPhotoUrl,
                 guest.vehicleType, guest.vehicleNo),
            )
        for room in booking.selectedRooms:
            cursor.execute("INSERT INTO selected_rooms (booking_id, room_number) VALUES (%s,%s) RETURNING id", (booking_id, room))
        for bed in booking.roomBedType:
            cursor.execute(
                "INSERT INTO room_bed_types (booking_id, room_number, bed_type) VALUES (%s,%s,%s) RETURNING id",
                (booking_id, bed.get("roomNum", bed.get("room_number", "")), bed.get("bedType", bed.get("bed_type", ""))),
            )
        for occ in booking.guestOccupancy:
            cursor.execute(
                "INSERT INTO guest_occupancy (booking_id, room_number, num_of_adults, num_of_children) VALUES (%s,%s,%s,%s) RETURNING id",
                (
                    booking_id,
                    occ.get("roomNum", occ.get("room_number", "")),
                    int(occ.get("numOfAdults") or occ.get("num_of_adults") or 1),
                    int(occ.get("numOfChildren") or occ.get("num_of_children") or 0),
                ),
            )
        # Mark room as Just Occupied
        for room_num in booking.selectedRooms:
            cursor.execute("UPDATE rooms SET status = 'Just Occupied' WHERE room_number = %s", (room_num,))
        conn.commit()
        cache_clear("rooms")
        return {"status": "success", "booking_id": booking_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.patch("/bookings/stayback/{room_number}")
async def update_to_stayback(room_number: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Only update if currently Just Occupied and checkout date is in future
        cursor.execute("SELECT * FROM rooms WHERE room_number = %s", (room_number,))
        room = cursor.fetchone()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room["status"] != "Just Occupied":
            return {"status": "skipped", "message": f"Room is {room['status']}, not Just Occupied"}
        # Check checkout date via booking
        cursor.execute(
            "SELECT b.check_out_date FROM bookings b JOIN selected_rooms sr ON b.id = sr.booking_id WHERE sr.room_number = %s ORDER BY b.id DESC LIMIT 1",
            (room_number,),
        )
        booking_row = cursor.fetchone()
        if not booking_row:
            return {"status": "skipped", "message": "No booking found"}
        from datetime import date
        if booking_row["check_out_date"] > date.today():
            cursor.execute("UPDATE rooms SET status = 'Stay Back' WHERE room_number = %s", (room_number,))
            conn.commit()
            cache_clear("rooms")
            return {"status": "success", "message": "Status updated to Stay Back"}
        return {"status": "skipped", "message": "Checkout date not in future"}
    finally:
        conn.close()


@app.patch("/bookings/overstay/{room_number}")
async def update_to_overstay(room_number: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM rooms WHERE room_number = %s", (room_number,))
        room = cursor.fetchone()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room["status"] != "Stay Back":
            return {"status": "skipped", "message": f"Room is {room['status']}, not Stay Back"}
        from datetime import date
        cursor.execute(
            "SELECT b.check_out_date FROM bookings b JOIN selected_rooms sr ON b.id = sr.booking_id WHERE sr.room_number = %s ORDER BY b.id DESC LIMIT 1",
            (room_number,),
        )
        booking_row = cursor.fetchone()
        if booking_row and booking_row["check_out_date"] <= date.today():
            cursor.execute("UPDATE rooms SET status = 'Over Stay' WHERE room_number = %s", (room_number,))
            conn.commit()
            cache_clear("rooms")
            return {"status": "success", "message": "Status updated to Over Stay"}
        return {"status": "skipped", "message": "Checkout date still in future"}
    finally:
        conn.close()


@app.patch("/bookings/doCheckout/{booking_id}")
async def do_checkout(booking_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM bookings WHERE id = %s", (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        from datetime import datetime
        cursor.execute(
            "UPDATE bookings SET check_out_time = %s WHERE id = %s",
            (datetime.now(), booking_id),
        )
        # Set all rooms in this booking to Cleaning Process
        cursor.execute("SELECT room_number FROM selected_rooms WHERE booking_id = %s", (booking_id,))
        rooms = cursor.fetchall()
        for r in rooms:
            cursor.execute("UPDATE rooms SET status = 'Cleaning Process' WHERE room_number = %s", (r["room_number"],))
        conn.commit()
        cache_clear("all_booking_data")
        cache_clear("rooms")
        return {"status": "success", "message": "Checkout completed"}
    finally:
        conn.close()


@app.get("/bookings/guestData/{booking_id}")
async def get_guest_data_by_booking(booking_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = _fetch_booking_full(cursor, booking_id)
        if not data:
            raise HTTPException(status_code=404, detail="Booking not found")
        return data
    finally:
        conn.close()


@app.get("/all/bookingData")
async def get_all_booking_data():
    cached = cache_get("all_booking_data")
    if cached is not None:
        return cached
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT DISTINCT ON (b.id) b.id, g.name AS guest_name, g.email_id, b.check_in_date, b.check_out_date, b.guest_type AS booking_status, b.booking_ref, b.num_of_rooms, b.room_amount, b.balance_amount FROM bookings b LEFT JOIN guests g ON b.id = g.booking_id ORDER BY b.id DESC"""
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            row["check_in_date"] = _date_str(row["check_in_date"])
            row["check_out_date"] = _date_str(row["check_out_date"])
            row["room_amount"] = _decimal_str(row["room_amount"])
            row["balance_amount"] = _decimal_str(row["balance_amount"])
            result.append(row)
        cache_set("all_booking_data", result, ttl=60)
        return result
    finally:
        conn.close()


@app.get("/all/calendarData")
async def get_calendar_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT DISTINCT ON (b.id) b.id, b.check_in_date, b.check_out_date, b.number_of_days, b.booking_ref, b.guest_type, b.num_of_rooms, g.name AS guest_name, g.mobile_no, sr.room_number FROM bookings b LEFT JOIN guests g ON b.id = g.booking_id LEFT JOIN selected_rooms sr ON b.id = sr.booking_id ORDER BY b.id DESC"""
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            row["check_in_date"] = _date_str(row["check_in_date"])
            row["check_out_date"] = _date_str(row["check_out_date"])
            result.append(row)
        return result
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Advance Bookings
# ---------------------------------------------------------------------------

@app.get("/lookup/bookingRef")
async def lookup_booking_ref(ref: str):
    """Search both advance_bookings and bookings tables for a reference, return guest details."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Try advance_bookings first
        cursor.execute("SELECT to_regclass('public.advance_bookings') IS NOT NULL AS tbl_exists")
        if cursor.fetchone()["tbl_exists"]:
            cursor.execute("SELECT * FROM advance_bookings WHERE booking_ref = %s", (ref,))
            row = cursor.fetchone()
            if row:
                row["check_in_date"] = _date_str(row["check_in_date"])
                row["check_out_date"] = _date_str(row["check_out_date"])
                return {
                    "found": True,
                    "source": "advance",
                    "guest_name": row.get("guest_name", ""),
                    "mobile_num": row.get("guest_mobile", ""),
                    "whatsapp_num": row.get("guest_whatsapp", ""),
                    "email_id": row.get("guest_email", ""),
                    "guest_type": row.get("guest_type", ""),
                    "checkin_date": row.get("check_in_date", ""),
                    "checkout_date": row.get("check_out_date", ""),
                    "num_of_nights": row.get("number_of_nights", 1),
                    "room_type": row.get("room_type", ""),
                    "num_of_rooms": row.get("number_of_rooms", 1),
                    "room_with_gst": str(row.get("rate_per_room", 0)),
                    "total_amount": str(row.get("total_amount", 0)),
                    "discount_any": str(row.get("discount_amt", 0)),
                    "final_amount": str(row.get("final_amount", 0)),
                    "advance_amount": str(row.get("advance_amount", 0)),
                    "paid_via": row.get("paid_via", ""),
                    "paid_reference": row.get("paid_reference", ""),
                    "balance_amount": str(row.get("balance_amount", 0)),
                    "remarks": row.get("remarks", ""),
                    "booking_ref": row.get("booking_ref", ""),
                }
        # 2. Try bookings table
        cursor.execute("SELECT b.*, g.name, g.mobile_no, g.whatsapp_no, g.email_id FROM bookings b LEFT JOIN guests g ON b.id = g.booking_id WHERE b.booking_ref = %s LIMIT 1", (ref,))
        row = cursor.fetchone()
        if row:
            return {
                "found": True,
                "source": "checkin",
                "guest_name": row.get("name", ""),
                "mobile_num": row.get("mobile_no", ""),
                "whatsapp_num": row.get("whatsapp_no", ""),
                "email_id": row.get("email_id", ""),
                "guest_type": row.get("guest_type", ""),
                "checkin_date": _date_str(row.get("check_in_date")),
                "checkout_date": _date_str(row.get("check_out_date")),
                "booking_ref": row.get("booking_ref", ""),
            }
        return {"found": False}
    finally:
        conn.close()


@app.get("/latest/checkinBooking")
async def get_latest_checkin_booking_ref():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        from datetime import datetime
        year = str(datetime.now().year)[-2:]
        cursor.execute("SELECT booking_ref FROM bookings ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if not row or not row["booking_ref"]:
            return {"nextRef": f"BNB001/{year}"}
        last_ref = row["booking_ref"]
        # Extract numeric part — supports formats like BNB001/26, DC001/26, etc.
        try:
            num = int(''.join(filter(str.isdigit, last_ref.split('/')[0]))) + 1
        except Exception:
            num = 1
        return {"nextRef": f"BNB{str(num).zfill(3)}/{year}"}
    finally:
        conn.close()


@app.get("/latest/advanceBooking")
async def get_latest_advance_booking_ref():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT to_regclass('public.advance_bookings') IS NOT NULL AS tbl_exists")
        row = cursor.fetchone()
        if not row or not row["tbl_exists"]:
            return {"nextRef": "AD001/25"}
        from datetime import datetime
        year = str(datetime.now().year)[-2:]
        cursor.execute("SELECT booking_ref FROM advance_bookings ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if not row or not row["booking_ref"]:
            return {"nextRef": f"AD001/{year}"}
        last_ref = row["booking_ref"]
        try:
            num = int(last_ref.split("AD")[1].split("/")[0]) + 1
        except Exception:
            num = 1
        return {"nextRef": f"AD{str(num).zfill(3)}/{year}"}
    finally:
        conn.close()


@app.post("/advanceBooking")
async def create_advance_booking(booking: AdvanceBookingCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """CREATE TABLE IF NOT EXISTS advance_bookings (
            id SERIAL PRIMARY KEY,
            guest_name VARCHAR(255), guest_mobile VARCHAR(20), guest_whatsapp VARCHAR(20),
            guest_email VARCHAR(255), guest_type VARCHAR(50), corporate_name VARCHAR(255),
            check_in_date DATE, check_out_date DATE, number_of_nights INT,
            room_type VARCHAR(100), number_of_rooms INT, rate_per_room DECIMAL(10,2),
            total_amount DECIMAL(10,2), discount_amt DECIMAL(10,2) DEFAULT 0,
            final_amount DECIMAL(10,2), advance_amount DECIMAL(10,2),
            paid_via VARCHAR(100), paid_reference VARCHAR(255), balance_amount DECIMAL(10,2),
            remarks TEXT, booking_ref VARCHAR(50), previous_ref VARCHAR(50),
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
        )
        conn.commit()
        cursor.execute(
            "INSERT INTO advance_bookings (guest_name, guest_mobile, guest_whatsapp, guest_email, guest_type, corporate_name, check_in_date, check_out_date, number_of_nights, room_type, number_of_rooms, rate_per_room, total_amount, discount_amt, final_amount, advance_amount, paid_via, paid_reference, balance_amount, remarks, booking_ref, previous_ref) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (booking.guestName, booking.guestMobile, booking.guestWhatsapp, booking.guestEmail,
             booking.guestType, booking.corporateName, booking.checkInDate, booking.checkOutDate,
             booking.numberOfNights, booking.roomType, booking.numberOfRooms, booking.ratePerRoom,
             booking.totalAmount, booking.discountAmt, booking.finalAmount, booking.advanceAmount,
             booking.paidVia, booking.paidReference, booking.balanceAmount, booking.remarks,
             booking.bookingRef, booking.previousRef),
        )
        conn.commit()
        return {"status": "success", "id": cursor.fetchone()["id"], "bookingRef": booking.bookingRef}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/advanceBooking/{booking_id}")
async def get_advance_booking_by_id(booking_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT to_regclass('public.advance_bookings') IS NOT NULL AS tbl_exists")
        row = cursor.fetchone()
        if not row or not row["tbl_exists"]:
            raise HTTPException(status_code=404, detail="No advance bookings found")
        cursor.execute("SELECT * FROM advance_bookings WHERE id = %s", (booking_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Advance booking not found")
        row["check_in_date"] = _date_str(row["check_in_date"])
        row["check_out_date"] = _date_str(row["check_out_date"])
        row["created_at"] = _date_str(row.get("created_at"))
        for key in ["rate_per_room", "total_amount", "discount_amt", "final_amount", "advance_amount", "balance_amount"]:
            row[key] = _decimal_str(row.get(key))
        return row
    finally:
        conn.close()


@app.put("/advanceBooking/{booking_id}")
async def update_advance_booking(booking_id: int, booking: AdvanceBookingCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT to_regclass('public.advance_bookings') IS NOT NULL AS tbl_exists")
        row = cursor.fetchone()
        if not row or not row["tbl_exists"]:
            raise HTTPException(status_code=404, detail="No advance bookings found")
        cursor.execute("SELECT id FROM advance_bookings WHERE id = %s", (booking_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Advance booking not found")
        cursor.execute(
            "UPDATE advance_bookings SET guest_name=%s, guest_mobile=%s, guest_whatsapp=%s, guest_email=%s, guest_type=%s, corporate_name=%s, check_in_date=%s, check_out_date=%s, number_of_nights=%s, room_type=%s, number_of_rooms=%s, rate_per_room=%s, total_amount=%s, discount_amt=%s, final_amount=%s, advance_amount=%s, paid_via=%s, paid_reference=%s, balance_amount=%s, remarks=%s, booking_ref=%s, previous_ref=%s WHERE id=%s",
            (booking.guestName, booking.guestMobile, booking.guestWhatsapp, booking.guestEmail,
             booking.guestType, booking.corporateName, booking.checkInDate, booking.checkOutDate,
             booking.numberOfNights, booking.roomType, booking.numberOfRooms, booking.ratePerRoom,
             booking.totalAmount, booking.discountAmt, booking.finalAmount, booking.advanceAmount,
             booking.paidVia, booking.paidReference, booking.balanceAmount, booking.remarks,
             booking.bookingRef, booking.previousRef, booking_id),
        )
        conn.commit()
        return {"status": "success", "id": booking_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/get/advanceBooking")
async def get_advance_booking_by_ref(advance_booking_ref: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT to_regclass('public.advance_bookings') IS NOT NULL AS tbl_exists")
        row = cursor.fetchone()
        if not row or not row["tbl_exists"]:
            raise HTTPException(status_code=404, detail="No advance bookings found")
        cursor.execute("SELECT * FROM advance_bookings WHERE booking_ref = %s", (advance_booking_ref,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Advance booking not found")
        row["check_in_date"] = _date_str(row["check_in_date"])
        row["check_out_date"] = _date_str(row["check_out_date"])
        row["created_at"] = _date_str(row.get("created_at"))
        for key in ["rate_per_room", "total_amount", "discount_amt", "final_amount", "advance_amount", "balance_amount"]:
            row[key] = _decimal_str(row.get(key))
        return row
    finally:
        conn.close()


@app.get("/all/advanceBookings")
async def get_all_advance_bookings():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT to_regclass('public.advance_bookings') IS NOT NULL AS tbl_exists")
        row = cursor.fetchone()
        if not row or not row["tbl_exists"]:
            return []
        cursor.execute("SELECT * FROM advance_bookings ORDER BY id DESC")
        rows = cursor.fetchall()
        result = []
        for row in rows:
            row["check_in_date"] = _date_str(row["check_in_date"])
            row["check_out_date"] = _date_str(row["check_out_date"])
            row["created_at"] = _date_str(row.get("created_at"))
            for key in ["rate_per_room", "total_amount", "discount_amt", "final_amount", "advance_amount", "balance_amount"]:
                row[key] = _decimal_str(row.get(key))
            result.append(row)
        return result
    finally:
        conn.close()


@app.get("/advanceCalendar")
async def get_advance_calendar():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT to_regclass('public.advance_bookings') IS NOT NULL AS tbl_exists")
        row = cursor.fetchone()
        if not row or not row["tbl_exists"]:
            return []
        cursor.execute(
            "SELECT id, booking_ref, guest_name, guest_mobile, guest_type, check_in_date, check_out_date, number_of_nights, room_type, number_of_rooms, final_amount, advance_amount, balance_amount, status, remarks FROM advance_bookings ORDER BY check_in_date ASC"
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            row["check_in_date"] = _date_str(row["check_in_date"])
            row["check_out_date"] = _date_str(row["check_out_date"])
            for key in ["final_amount", "advance_amount", "balance_amount"]:
                row[key] = _decimal_str(row.get(key))
            result.append(row)
        return result
    finally:
        conn.close()


@app.get("/bookings/guest/{guest_id}")
async def get_bookings_by_guest_id(guest_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT DISTINCT b.id FROM bookings b JOIN guests g ON b.id = g.booking_id WHERE g.guest_id = %s",
            (guest_id,),
        )
        booking_ids = [row["id"] for row in cursor.fetchall()]
        if not booking_ids:
            raise HTTPException(status_code=404, detail="No bookings found for this guest")
        result = []
        for bid in booking_ids:
            data = _fetch_booking_full(cursor, bid)
            if data:
                result.append(data)
        return result
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Extra Charges
# ---------------------------------------------------------------------------

@app.post("/bookings/{bookingId}/extraCharges")
async def add_extra_charge(bookingId: int, charge: ExtraChargeCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (bookingId,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")
        cursor.execute(
            "INSERT INTO extra_charges (booking_id, amount, reason) VALUES (%s, %s, %s) RETURNING id",
            (bookingId, charge.amount, charge.reason)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "booking_id": bookingId, "amount": charge.amount, "reason": charge.reason}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/bookings/{bookingId}/extraCharges")
async def get_extra_charges(bookingId: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (bookingId,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")
        cursor.execute("SELECT * FROM extra_charges WHERE booking_id = %s ORDER BY created_at", (bookingId,))
        return cursor.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Money Entries
# ---------------------------------------------------------------------------

@app.post("/bookings/{bookingId}/moneyEntries")
async def add_money_entry(bookingId: int, entry: MoneyEntryCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (bookingId,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")
        cursor.execute(
            "INSERT INTO money_entries (booking_id, amount, payment_method, reference_number) VALUES (%s, %s, %s, %s) RETURNING id",
            (bookingId, entry.amount, entry.payment_method, entry.reference_number)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "booking_id": bookingId, "amount": entry.amount,
                "payment_method": entry.payment_method, "reference_number": entry.reference_number}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/bookings/{bookingId}/moneyEntries")
async def get_money_entries(bookingId: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (bookingId,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")
        cursor.execute("SELECT * FROM money_entries WHERE booking_id = %s ORDER BY created_at", (bookingId,))
        return cursor.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Extension
# ---------------------------------------------------------------------------

@app.patch("/bookings/{bookingId}/extend")
async def extend_booking(bookingId: int, body: ExtendBooking):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, check_in_date FROM bookings WHERE id = %s", (bookingId,))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        from datetime import datetime
        new_checkout = datetime.strptime(body.newCheckOutDate, "%Y-%m-%d").date()
        check_in = booking["check_in_date"]
        if hasattr(check_in, "date"):
            check_in = check_in.date()
        number_of_days = (new_checkout - check_in).days
        cursor.execute(
            "UPDATE bookings SET check_out_date = %s, number_of_days = %s WHERE id = %s",
            (new_checkout, number_of_days, bookingId)
        )
        conn.commit()
        return {"bookingId": bookingId, "check_out_date": str(new_checkout), "number_of_days": number_of_days}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Room Shift
# ---------------------------------------------------------------------------

@app.post("/bookings/{bookingId}/roomShift")
async def room_shift(bookingId: int, body: RoomShiftCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Validate booking exists and get check_in_time
        cursor.execute("SELECT id, check_in_time FROM bookings WHERE id = %s", (bookingId,))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Get old room number from selected_rooms
        cursor.execute("SELECT room_number FROM selected_rooms WHERE booking_id = %s LIMIT 1", (bookingId,))
        sr = cursor.fetchone()
        old_room = sr["room_number"] if sr else None

        # Compute duration_hours from check_in_time to now
        from datetime import datetime
        now = datetime.now()
        check_in = booking["check_in_time"]
        if check_in:
            if not hasattr(check_in, 'hour'):
                # It's a date, convert to datetime at midnight
                check_in = datetime.combine(check_in, datetime.min.time())
            duration_hours = round((now - check_in).total_seconds() / 3600, 2)
        else:
            duration_hours = None

        # Insert shift history
        cursor.execute(
            "INSERT INTO room_shift_history (booking_id, old_room_number, new_room_number, reason, old_room_status, duration_hours) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (bookingId, old_room, body.newRoomNumber, body.reason, body.oldRoomStatus, duration_hours)
        )

        # Update old room status to the selected post-shift status
        if old_room:
            cursor.execute("UPDATE rooms SET status = %s WHERE room_number = %s", (body.oldRoomStatus, old_room))

        # Update new room status to "Just Occupied"
        cursor.execute("UPDATE rooms SET status = %s WHERE room_number = %s", ("Just Occupied", body.newRoomNumber))

        # Update selected_rooms to point to new room
        cursor.execute(
            "UPDATE selected_rooms SET room_number = %s WHERE booking_id = %s",
            (body.newRoomNumber, bookingId)
        )

        conn.commit()
        cache_clear("rooms")
        return {
            "bookingId": bookingId,
            "oldRoom": old_room,
            "newRoom": body.newRoomNumber,
            "duration_hours": duration_hours
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Add Guest
# ---------------------------------------------------------------------------

@app.post("/bookings/{bookingId}/addGuest")
async def add_guest(bookingId: int, body: AddGuestCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Validate booking exists
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (bookingId,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")

        # Insert new guest row linked to this booking
        cursor.execute(
            "INSERT INTO guests (booking_id, name, mobile_no, id_type, id_no, whatsapp_no, email_id, id_photo_url) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                bookingId,
                body.name,
                body.mobileNo,
                body.idType,
                body.idNo,
                body.whatsappNo,
                body.emailID,
                body.idPhotoUrl,
            ),
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "booking_id": bookingId}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Account Module — Table creation helper (called once)
# ---------------------------------------------------------------------------

def _ensure_account_tables(cursor, conn):
    cursor.execute("""CREATE TABLE IF NOT EXISTS expense_entries (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reference_number VARCHAR(255),
        attachment_url VARCHAR(500),
        notes TEXT,
        entry_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS account_balances (
        id SERIAL PRIMARY KEY,
        bank_name VARCHAR(100) NOT NULL,
        entry_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS credit_card_entries (
        id SERIAL PRIMARY KEY,
        card_name VARCHAR(100) NOT NULL,
        entry_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS guest_return_entries (
        id SERIAL PRIMARY KEY,
        return_type VARCHAR(50) NOT NULL,
        booking_id INT,
        return_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()

# ---------------------------------------------------------------------------
# 5. Expense Entry
# ---------------------------------------------------------------------------

@app.post("/account/expenses")
async def add_expense(entry: ExpenseEntryCreate):
    from datetime import date as dt_date
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        entry_date = entry.entry_date or str(dt_date.today())
        cursor.execute(
            "INSERT INTO expense_entries (category, amount, reference_number, attachment_url, notes, entry_date) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
            (entry.category, entry.amount, entry.reference_number, entry.attachment_url, entry.notes, entry_date)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/account/expenses")
async def get_expenses(start_date: Optional[str] = None, end_date: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        if start_date and end_date:
            cursor.execute("SELECT * FROM expense_entries WHERE entry_date BETWEEN %s AND %s ORDER BY entry_date DESC", (start_date, end_date))
        else:
            cursor.execute("SELECT * FROM expense_entries ORDER BY entry_date DESC")
        rows = cursor.fetchall()
        for r in rows:
            r["entry_date"] = _date_str(r["entry_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        return rows
    finally:
        conn.close()

@app.delete("/account/expenses/{expense_id}")
async def delete_expense(expense_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM expense_entries WHERE id = %s", (expense_id,))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# 2. Pending Payments
# ---------------------------------------------------------------------------

@app.get("/account/pendingPayments")
async def get_pending_payments():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT b.id, b.booking_ref, b.check_in_date, b.check_out_date,
                   b.net_payable, b.advance_amount, b.balance_amount,
                   g.name AS guest_name, g.mobile_no,
                   COALESCE((SELECT SUM(ec.amount) FROM extra_charges ec WHERE ec.booking_id = b.id), 0) AS total_extra,
                   COALESCE((SELECT SUM(me.amount) FROM money_entries me WHERE me.booking_id = b.id), 0) AS total_paid
            FROM bookings b
            LEFT JOIN guests g ON b.id = g.booking_id
            GROUP BY b.id, b.booking_ref, b.check_in_date, b.check_out_date, b.net_payable, b.advance_amount, b.balance_amount, g.name, g.mobile_no
            HAVING (CAST(b.net_payable AS DECIMAL(10,2)) + COALESCE((SELECT SUM(ec2.amount) FROM extra_charges ec2 WHERE ec2.booking_id = b.id),0)
                    - COALESCE((SELECT SUM(me2.amount) FROM money_entries me2 WHERE me2.booking_id = b.id),0)
                    - CAST(b.advance_amount AS DECIMAL(10,2))) > 0
            ORDER BY b.check_in_date DESC
        """)
        rows = cursor.fetchall()
        for r in rows:
            r["check_in_date"] = _date_str(r["check_in_date"])
            r["check_out_date"] = _date_str(r["check_out_date"])
            for k in ["net_payable", "advance_amount", "balance_amount", "total_extra", "total_paid"]:
                r[k] = _decimal_str(r.get(k))
        return rows
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# 6. Account Balance Entry
# ---------------------------------------------------------------------------

@app.post("/account/balances")
async def add_balance(entry: AccountBalanceCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        cursor.execute(
            "INSERT INTO account_balances (bank_name, entry_date, amount, notes) VALUES (%s,%s,%s,%s) RETURNING id",
            (entry.bank_name, entry.entry_date, entry.amount, entry.notes)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/account/balances")
async def get_balances(bank_name: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        if bank_name:
            cursor.execute("SELECT * FROM account_balances WHERE bank_name = %s ORDER BY entry_date DESC", (bank_name,))
        else:
            cursor.execute("SELECT * FROM account_balances ORDER BY entry_date DESC")
        rows = cursor.fetchall()
        for r in rows:
            r["entry_date"] = _date_str(r["entry_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        return rows
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# 7. Credit Card Credited
# ---------------------------------------------------------------------------

@app.post("/account/creditCards")
async def add_credit_card(entry: CreditCardCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        cursor.execute(
            "INSERT INTO credit_card_entries (card_name, entry_date, amount, notes) VALUES (%s,%s,%s,%s) RETURNING id",
            (entry.card_name, entry.entry_date, entry.amount, entry.notes)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/account/creditCards")
async def get_credit_cards():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        cursor.execute("SELECT * FROM credit_card_entries ORDER BY entry_date DESC")
        rows = cursor.fetchall()
        for r in rows:
            r["entry_date"] = _date_str(r["entry_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        return rows
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# 8. Guest Return Amount Entry
# ---------------------------------------------------------------------------

@app.post("/account/guestReturns")
async def add_guest_return(entry: GuestReturnCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        cursor.execute(
            "INSERT INTO guest_return_entries (return_type, booking_id, return_date, amount, reason) VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (entry.return_type, entry.booking_id, entry.return_date, entry.amount, entry.reason)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/account/guestReturns")
async def get_guest_returns():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        cursor.execute("SELECT * FROM guest_return_entries ORDER BY return_date DESC")
        rows = cursor.fetchall()
        for r in rows:
            r["return_date"] = _date_str(r["return_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        return rows
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# 9. Full Transaction Report
# ---------------------------------------------------------------------------

@app.get("/account/transactionReport")
async def get_transaction_report(start_date: str, end_date: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_account_tables(cursor, conn)
        report = {}

        # Money entries from bookings
        cursor.execute("""
            SELECT me.id, me.booking_id, me.amount, me.payment_method, me.reference_number, me.created_at,
                   b.booking_ref, g.name AS guest_name
            FROM money_entries me
            LEFT JOIN bookings b ON me.booking_id = b.id
            LEFT JOIN guests g ON b.id = g.booking_id AND g.id = (SELECT MIN(id) FROM guests WHERE booking_id = b.id)
            WHERE me.created_at::date BETWEEN %s AND %s
            ORDER BY me.created_at DESC
        """, (start_date, end_date))
        money_entries = cursor.fetchall()
        for r in money_entries:
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        report["money_entries"] = money_entries

        # Expense entries
        cursor.execute("SELECT * FROM expense_entries WHERE entry_date BETWEEN %s AND %s ORDER BY entry_date DESC", (start_date, end_date))
        expenses = cursor.fetchall()
        for r in expenses:
            r["entry_date"] = _date_str(r["entry_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        report["expense_entries"] = expenses

        # Account balances
        cursor.execute("SELECT * FROM account_balances WHERE entry_date BETWEEN %s AND %s ORDER BY entry_date DESC", (start_date, end_date))
        balances = cursor.fetchall()
        for r in balances:
            r["entry_date"] = _date_str(r["entry_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        report["account_balances"] = balances

        # Credit card entries
        cursor.execute("SELECT * FROM credit_card_entries WHERE entry_date BETWEEN %s AND %s ORDER BY entry_date DESC", (start_date, end_date))
        cc = cursor.fetchall()
        for r in cc:
            r["entry_date"] = _date_str(r["entry_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        report["credit_card_entries"] = cc

        # Guest returns
        cursor.execute("SELECT * FROM guest_return_entries WHERE return_date BETWEEN %s AND %s ORDER BY return_date DESC", (start_date, end_date))
        returns = cursor.fetchall()
        for r in returns:
            r["return_date"] = _date_str(r["return_date"])
            r["created_at"] = _date_str(r["created_at"])
            r["amount"] = _decimal_str(r["amount"])
        report["guest_returns"] = returns

        # Totals
        total_income = sum(float(r["amount"]) for r in money_entries)
        total_expenses = sum(float(r["amount"]) for r in expenses)
        total_returns = sum(float(r["amount"]) for r in returns)
        report["summary"] = {
            "total_income": str(round(total_income, 2)),
            "total_expenses": str(round(total_expenses, 2)),
            "total_returns": str(round(total_returns, 2)),
            "net": str(round(total_income - total_expenses - total_returns, 2)),
        }
        return report
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Staff Module — Pydantic Models
# ---------------------------------------------------------------------------

class StaffCreate(BaseModel):
    name: str
    role: str
    mobile: str
    email: Optional[str] = None
    address: Optional[str] = None
    join_date: Optional[str] = None
    salary: Optional[float] = None
    bank_account: Optional[str] = None
    id_proof: Optional[str] = None
    staff_type: str = "staff"  # staff | cleaner

class DutyScheduleCreate(BaseModel):
    staff_id: int
    schedule_date: str
    shift: str  # morning | evening | night | off
    notes: Optional[str] = None

class SalaryCreate(BaseModel):
    staff_id: int
    month: str       # YYYY-MM
    basic_salary: float
    bonus: Optional[float] = 0
    deductions: Optional[float] = 0
    net_salary: Optional[float] = None
    paid_date: Optional[str] = None
    paid_via: Optional[str] = None
    notes: Optional[str] = None

class CleanerSalaryCreate(BaseModel):
    staff_id: int
    week_start: str
    week_end: str
    amount: float
    paid_date: Optional[str] = None
    notes: Optional[str] = None

# ---------------------------------------------------------------------------
# Staff Module — Table helper
# ---------------------------------------------------------------------------

def _ensure_staff_tables(cursor, conn):
    cursor.execute("""CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        join_date DATE,
        salary DECIMAL(10,2),
        bank_account VARCHAR(100),
        id_proof VARCHAR(500),
        staff_type VARCHAR(20) DEFAULT 'staff',
        is_active SMALLINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS duty_schedules (
        id SERIAL PRIMARY KEY,
        staff_id INT NOT NULL,
        schedule_date DATE NOT NULL,
        shift VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id)
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS staff_salaries (
        id SERIAL PRIMARY KEY,
        staff_id INT NOT NULL,
        month VARCHAR(7) NOT NULL,
        basic_salary DECIMAL(10,2) NOT NULL,
        bonus DECIMAL(10,2) DEFAULT 0,
        deductions DECIMAL(10,2) DEFAULT 0,
        net_salary DECIMAL(10,2),
        paid_date DATE,
        paid_via VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id)
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS cleaner_salaries (
        id SERIAL PRIMARY KEY,
        staff_id INT NOT NULL,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id)
    )""")
    conn.commit()

# ---------------------------------------------------------------------------
# Staff CRUD
# ---------------------------------------------------------------------------

@app.post("/staff")
async def add_staff(s: StaffCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        cursor.execute(
            "INSERT INTO staff (name, role, mobile, email, address, join_date, salary, bank_account, id_proof, staff_type) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (s.name, s.role, s.mobile, s.email, s.address, s.join_date, s.salary, s.bank_account, s.id_proof, s.staff_type)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/staff")
async def get_all_staff(staff_type: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        if staff_type:
            cursor.execute("SELECT * FROM staff WHERE staff_type = %s AND is_active = 1 ORDER BY name", (staff_type,))
        else:
            cursor.execute("SELECT * FROM staff WHERE is_active = 1 ORDER BY name")
        rows = cursor.fetchall()
        for r in rows:
            r["join_date"] = _date_str(r["join_date"])
            r["salary"] = _decimal_str(r["salary"])
            r["created_at"] = _date_str(r["created_at"])
        return rows
    finally:
        conn.close()

@app.put("/staff/{staff_id}")
async def update_staff(staff_id: int, s: StaffCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE staff SET name=%s, role=%s, mobile=%s, email=%s, address=%s, join_date=%s, salary=%s, bank_account=%s, id_proof=%s, staff_type=%s WHERE id=%s",
            (s.name, s.role, s.mobile, s.email, s.address, s.join_date, s.salary, s.bank_account, s.id_proof, s.staff_type, staff_id)
        )
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/staff/{staff_id}")
async def delete_staff(staff_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE staff SET is_active = 0 WHERE id = %s", (staff_id,))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Duty Schedule
# ---------------------------------------------------------------------------

@app.post("/staff/duty")
async def add_duty(d: DutyScheduleCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        cursor.execute(
            "INSERT INTO duty_schedules (staff_id, schedule_date, shift, notes) VALUES (%s,%s,%s,%s) RETURNING id",
            (d.staff_id, d.schedule_date, d.shift, d.notes)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/staff/duty")
async def get_duties(month: Optional[str] = None, staff_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        q = "SELECT ds.*, s.name AS staff_name, s.role FROM duty_schedules ds JOIN staff s ON ds.staff_id = s.id WHERE 1=1"
        params = []
        if month:
            q += " AND TO_CHAR(, 'YYYY-MM') = %s"; params.append(month)
        if staff_id:
            q += " AND ds.staff_id = %s"; params.append(staff_id)
        q += " ORDER BY ds.schedule_date, s.name"
        cursor.execute(q, params)
        rows = cursor.fetchall()
        for r in rows:
            r["schedule_date"] = _date_str(r["schedule_date"])
        return rows
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Staff Salary
# ---------------------------------------------------------------------------

@app.post("/staff/salary")
async def add_salary(sal: SalaryCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        net = sal.net_salary if sal.net_salary is not None else (sal.basic_salary + (sal.bonus or 0) - (sal.deductions or 0))
        cursor.execute(
            "INSERT INTO staff_salaries (staff_id, month, basic_salary, bonus, deductions, net_salary, paid_date, paid_via, notes) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (sal.staff_id, sal.month, sal.basic_salary, sal.bonus or 0, sal.deductions or 0, net, sal.paid_date, sal.paid_via, sal.notes)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/staff/salary")
async def get_salaries(month: Optional[str] = None, staff_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        q = "SELECT ss.*, s.name AS staff_name, s.role FROM staff_salaries ss JOIN staff s ON ss.staff_id = s.id WHERE 1=1"
        params = []
        if month:
            q += " AND ss.month = %s"; params.append(month)
        if staff_id:
            q += " AND ss.staff_id = %s"; params.append(staff_id)
        q += " ORDER BY ss.month DESC, s.name"
        cursor.execute(q, params)
        rows = cursor.fetchall()
        for r in rows:
            r["paid_date"] = _date_str(r["paid_date"])
            for k in ["basic_salary", "bonus", "deductions", "net_salary"]:
                r[k] = _decimal_str(r.get(k))
        return rows
    finally:
        conn.close()

@app.get("/staff/payslipAlert")
async def payslip_alert():
    """Return months (last 3) where any active staff member has no salary record."""
    from datetime import datetime, date
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        cursor.execute("SELECT id, name FROM staff WHERE is_active = 1 AND staff_type = 'staff'")
        staff_list = cursor.fetchall()
        today_d = date.today()
        missing = []
        for i in range(3):
            if today_d.month - i <= 0:
                m = today_d.month - i + 12
                y = today_d.year - 1
            else:
                m = today_d.month - i
                y = today_d.year
            month_str = f"{y}-{str(m).zfill(2)}"
            for staff in staff_list:
                cursor.execute("SELECT id FROM staff_salaries WHERE staff_id = %s AND month = %s", (staff["id"], month_str))
                if not cursor.fetchone():
                    missing.append({"staff_id": staff["id"], "staff_name": staff["name"], "month": month_str})
        return {"missing_payslips": missing, "count": len(missing)}
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Cleaner Weekly Salary
# ---------------------------------------------------------------------------

@app.post("/staff/cleanerSalary")
async def add_cleaner_salary(cs: CleanerSalaryCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        cursor.execute(
            "INSERT INTO cleaner_salaries (staff_id, week_start, week_end, amount, paid_date, notes) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
            (cs.staff_id, cs.week_start, cs.week_end, cs.amount, cs.paid_date, cs.notes)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/staff/cleanerSalary")
async def get_cleaner_salaries():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_staff_tables(cursor, conn)
        cursor.execute("SELECT cs.*, s.name AS staff_name FROM cleaner_salaries cs JOIN staff s ON cs.staff_id = s.id ORDER BY cs.week_start DESC")
        rows = cursor.fetchall()
        for r in rows:
            r["week_start"] = _date_str(r["week_start"])
            r["week_end"] = _date_str(r["week_end"])
            r["paid_date"] = _date_str(r["paid_date"])
            r["amount"] = _decimal_str(r["amount"])
        return rows
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Settings Module
# ---------------------------------------------------------------------------

class SettingItemCreate(BaseModel):
    category: str   # booking_ref | expense_category | alert_type
    value: str
    label: Optional[str] = None

def _ensure_settings_tables(cursor, conn):
    cursor.execute("""CREATE TABLE IF NOT EXISTS settings_items (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        value VARCHAR(255) NOT NULL,
        label VARCHAR(255),
        is_active SMALLINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()

@app.get("/settings/{category}")
async def get_settings(category: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_settings_tables(cursor, conn)
        cursor.execute("SELECT * FROM settings_items WHERE category = %s AND is_active = 1 ORDER BY value", (category,))
        rows = cursor.fetchall()
        for r in rows:
            r["created_at"] = _date_str(r.get("created_at"))
        return rows
    finally:
        conn.close()

@app.post("/settings")
async def add_setting(item: SettingItemCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _ensure_settings_tables(cursor, conn)
        cursor.execute(
            "INSERT INTO settings_items (category, value, label) VALUES (%s,%s,%s) RETURNING id",
            (item.category, item.value, item.label or item.value)
        )
        conn.commit()
        return {"id": cursor.fetchone()["id"], "status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/settings/{item_id}")
async def delete_setting(item_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE settings_items SET is_active = 0 WHERE id = %s", (item_id,))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# User Management (Admin only — enforced on frontend via role guard)
# ---------------------------------------------------------------------------

@app.get("/users")
async def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, role FROM users ORDER BY role, username")
        return cursor.fetchall()
    finally:
        conn.close()

@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Dashboard combined endpoint — single call returns all dashboard data
# ---------------------------------------------------------------------------

@app.get("/dashboard")
async def get_dashboard_data():
    """Returns rooms, booking counts in a single DB round trip."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM floors")
        floors = cursor.fetchall()
        cursor.execute("SELECT * FROM rooms")
        rooms = cursor.fetchall()
        result = {}
        for floor in floors:
            result[floor["name"]] = [r for r in rooms if r["floor_id"] == floor["id"]]
        return {"rooms": result}
    finally:
        conn.close()
