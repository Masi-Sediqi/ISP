ISP SMART - LAN PRODUCTION + POSTGRESQL (STEP 1)
================================================

1) PostgreSQL must be installed and the PostgreSQL service must be running on the SERVER computer.

2) Check this file and make sure the username/password are correct:
   transport-backend/.env

   Default in this project:
   ISP_DATABASE_URL=postgres://postgres:root@localhost:5432/afghanpower_db1

   The new setup script will create the database "afghanpower_db1" automatically if it does not exist
   (as long as the PostgreSQL user has permission to create databases).

3) In the project root run ONCE if dependencies are not installed:
   npm install

4) Start the real LAN production server with:
   npm run start:lan

   This command automatically:
   - builds React with Vite production mode
   - checks PostgreSQL
   - creates the target database when missing
   - creates the isp_collections table when missing
   - imports existing C:\ISP Smart\*.json data ONLY when PostgreSQL is empty
   - starts Express on port 5050
   - serves the React production build from the same Express server

5) Employees should NOT use port 5173 anymore.
   They should open:
   http://SERVER-IP:5050

   Example:
   http://192.168.1.10:5050

6) Keep the command window running on the server PC while employees use the system.

7) Recommended physical network:
   SERVER PC --LAN CABLE--> ROUTER/SWITCH --> employee computers

Useful commands
---------------
npm run postgres:prepare
  Checks PostgreSQL, creates the database/table if needed, and safely imports JSON only if DB is empty.

npm run dev
  Development mode. It now reads transport-backend/.env too, so PostgreSQL is available during development.

npm run start:lan
  Production LAN mode for employees. This is the recommended command for daily office use.

IMPORTANT
---------
This is STEP 1 of the performance work. The current data model is kept compatible so existing pages do not break.
The next performance step should reduce duplicate/full-collection API requests and later move large collections to
proper relational PostgreSQL tables with pagination/record-level CRUD.
