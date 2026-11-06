# College Lab Equipment Management System

A local HTML/CSS/JavaScript + Node.js/Express + MySQL starter project.

## 1. Create the database in MySQL Workbench
1. Open MySQL Workbench and connect to your local MySQL server.
2. Choose **File > Open SQL Script** and open `database/schema.sql` from this project.
3. Click the lightning bolt (Execute) to run the entire script.
4. Confirm the `college_lab_management` schema and its three tables appear under SCHEMAS.

> This script creates a fresh schema if it does not exist and inserts seven starter equipment records. If you already have a database with this name and want to preserve it, back it up first and do not run destructive DROP commands.

## 2. Configure the backend
1. Open the `backend` folder in VS Code terminal.
2. Copy `.env.example` to a new file named `.env`.
3. Edit `.env` and enter your local MySQL username and password. Keep `.env` private; do not upload it or share it.
4. In the backend terminal run:
   `npm.cmd install`
   `npm.cmd run dev`

## 3. Open the website
Open `http://localhost:3000`.

Pages:
- `/` Dashboard
- `/equipment.html` Equipment
- `/users.html` Users
- `/issue.html` Issue equipment
- `/history.html` Issue history and returns

## Notes
- Run the SQL script before starting the backend.
- The MySQL service must be running.
- This starter app is intended for a local academic project/demo. It does not include login/authentication or production security hardening.
- The users table stores contact/role information only; it does not store passwords.
