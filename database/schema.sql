CREATE DATABASE IF NOT EXISTS college_lab_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE college_lab_management;

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 0,
  status ENUM('Available','Out of Stock') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (equipment_id),
  CHECK (quantity >= 0),
  CHECK (available_quantity >= 0),
  CHECK (available_quantity <= quantity)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  role ENUM('Student','Staff','Faculty','Admin') NOT NULL DEFAULT 'Student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issue_records (
  issue_id INT NOT NULL AUTO_INCREMENT,
  equipment_id INT NOT NULL,
  user_id INT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NULL,
  return_date DATE NULL,
  quantity INT NOT NULL DEFAULT 1,
  status ENUM('Issued','Returned') NOT NULL DEFAULT 'Issued',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (issue_id),
  CONSTRAINT fk_issue_equipment FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_issue_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (quantity > 0)
) ENGINE=InnoDB;

-- Optional starter equipment. Run this script once on a new database.
INSERT INTO equipment (name, category, quantity, available_quantity, status) VALUES
('Desktop Computer', 'Computer', 30, 30, 'Available'),
('Laptop', 'Computer', 15, 15, 'Available'),
('Projector', 'Presentation', 5, 5, 'Available'),
('Digital Multimeter', 'Electronics', 10, 10, 'Available'),
('Oscilloscope', 'Electronics', 4, 4, 'Available'),
('Arduino Kit', 'Embedded Systems', 12, 12, 'Available'),
('Raspberry Pi', 'Embedded Systems', 8, 8, 'Available');
