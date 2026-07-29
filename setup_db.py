import mysql.connector
from werkzeug.security import generate_password_hash

conn = mysql.connector.connect(user='BnbUser', password='BnbUser@123', host='68.178.152.158', database='bnbtest')
cursor = conn.cursor()

cursor.execute("CREATE TABLE IF NOT EXISTS floors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL)")
cursor.execute("CREATE TABLE IF NOT EXISTS rooms (id INT AUTO_INCREMENT PRIMARY KEY, floor_id INT, room_number VARCHAR(255) NOT NULL, room_type VARCHAR(255) NOT NULL, status VARCHAR(255) NOT NULL DEFAULT 'Vacant', selected BOOLEAN NOT NULL DEFAULT FALSE, FOREIGN KEY(floor_id) REFERENCES floors(id))")
cursor.execute("CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(512) NOT NULL, role VARCHAR(50) NOT NULL)")
cursor.execute("CREATE TABLE IF NOT EXISTS bookings (id INT AUTO_INCREMENT PRIMARY KEY, check_in_date DATE NOT NULL, check_out_date DATE NOT NULL, number_of_days INT NOT NULL, booking_ref VARCHAR(255), num_of_rooms INT, guest_type VARCHAR(100), corporate_name VARCHAR(255), breakfast VARCHAR(50), any_discount_amt DECIMAL(10,2) DEFAULT 0, any_discount_cmt TEXT, room_amount DECIMAL(10,2), gst DECIMAL(10,2), advance_amount DECIMAL(10,2), net_payable DECIMAL(10,2), payment_amount DECIMAL(10,2), payment_method VARCHAR(100), balance_amount DECIMAL(10,2), check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP, check_out_time DATETIME)")
cursor.execute("CREATE TABLE IF NOT EXISTS guests (id INT AUTO_INCREMENT PRIMARY KEY, booking_id INT, guest_id VARCHAR(255), name VARCHAR(255), mobile_no VARCHAR(20), whatsapp_no VARCHAR(20), email_id VARCHAR(255), id_type VARCHAR(100), other_id_name VARCHAR(255), id_no VARCHAR(255), id_photo_url TEXT, user_photo_url TEXT, vehicle_type VARCHAR(50), vehicle_no VARCHAR(50), FOREIGN KEY(booking_id) REFERENCES bookings(id))")
cursor.execute("CREATE TABLE IF NOT EXISTS selected_rooms (id INT AUTO_INCREMENT PRIMARY KEY, booking_id INT, room_number VARCHAR(255), FOREIGN KEY(booking_id) REFERENCES bookings(id))")
cursor.execute("CREATE TABLE IF NOT EXISTS room_bed_types (id INT AUTO_INCREMENT PRIMARY KEY, booking_id INT, room_number VARCHAR(255), bed_type VARCHAR(100), FOREIGN KEY(booking_id) REFERENCES bookings(id))")
cursor.execute("CREATE TABLE IF NOT EXISTS guest_occupancy (id INT AUTO_INCREMENT PRIMARY KEY, booking_id INT, room_number VARCHAR(255), num_of_adults INT DEFAULT 1, num_of_children INT DEFAULT 0, FOREIGN KEY(booking_id) REFERENCES bookings(id))")
conn.commit()
print("Tables created.")

floors = ['ground_floor', 'first_floor', 'second_floor', 'third_floor', 'fourth_floor', 'fifth_floor']
for f in floors:
    cursor.execute("INSERT IGNORE INTO floors (name) VALUES (%s)", (f,))
conn.commit()
print("Floors seeded.")

cursor.execute("SELECT id, name FROM floors")
floor_map = {name: fid for fid, name in cursor.fetchall()}

rooms_data = {
    'ground_floor': [('G01','Studio King'), ('G02','Studio King')],
    'first_floor':  [('101','Studio King'), ('102','Studio Large'), ('103','Studio Large'), ('104','Studio King'), ('105','Suite Room'), ('106','Family Room')],
    'second_floor': [('201','Studio King'), ('202','Studio Large'), ('203','Studio Large'), ('204','Studio King'), ('205','Suite Room'), ('206','Family Room')],
    'third_floor':  [('301','Studio King'), ('302','Studio Twin'), ('303','Studio Twin'), ('304','Studio King'), ('305','Suite Room'), ('306','Family Room')],
    'fourth_floor': [('401','Studio King'), ('402','Studio Twin'), ('403','Studio Twin'), ('404','Studio King'), ('405','Suite Room'), ('406','Family Room')],
    'fifth_floor':  [('501','VIP'), ('502','Single Bed'), ('503','Single Bed'), ('504','Single Bed'), ('505','Single Bed')],
}

for floor_name, rlist in rooms_data.items():
    fid = floor_map[floor_name]
    for rnum, rtype in rlist:
        cursor.execute("INSERT INTO rooms (floor_id, room_number, room_type, status, selected) VALUES (%s,%s,%s,'Vacant',FALSE)", (fid, rnum, rtype))
conn.commit()
print("Rooms seeded.")

users = [
    ('admin',    'Admin@123',    'admin'),
    ('account',  'Account@123',  'account'),
    ('employee', 'Employee@123', 'employee'),
    ('audit',    'Audit@123',    'audit'),
]
for uname, pwd, role in users:
    h = generate_password_hash(pwd)
    cursor.execute("INSERT IGNORE INTO users (username, password_hash, role) VALUES (%s,%s,%s)", (uname, h, role))
conn.commit()
print("Users created.")
conn.close()
print("Done.")
