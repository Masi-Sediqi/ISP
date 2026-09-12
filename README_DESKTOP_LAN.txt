Afghan Power - Electron LAN/PostgreSQL patch

Changed files:
1) electron/main.cjs
2) package.json

What this patch fixes:
- Packaged Electron no longer disables transport-backend/.env.
- Packaged Electron no longer deletes ISP_DATABASE_URL / DATABASE_URL.
- Packaged Electron requires PostgreSQL just like npm run start:lan.
- Backend still listens on 0.0.0.0:5050 so employees on the same router/LAN can access it.
- Electron itself uses 127.0.0.1:5050 on the host computer.
- Browser clients use http://SERVER_IP:5050 and therefore share the same API, PostgreSQL data and Socket.IO server.

How to use:
- Replace the two files in your original project, preserving the same paths.
- Make sure PostgreSQL is installed/running on the MAIN/SERVER computer.
- Keep transport-backend/.env configured correctly.
- On the MAIN/SERVER computer run:
    npm install
    npm run build:desktop
- Install the generated Windows installer from release/ on the MAIN/SERVER computer.
- Employees on the same router can continue opening:
    http://SERVER_IP:5050

Important architecture note:
Do NOT install the server-mode Electron build on every employee computer while pointing each one to its own local backend. There should be one central server/database instance for shared realtime data.
