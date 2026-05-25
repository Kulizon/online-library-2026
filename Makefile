.PHONY: install dev auth frontend clean

# Install all dependencies
install:
	cd services/auth && npm install
	cd frontend && npm install

# Start AuthService
auth:
	cd services/auth && cp -n .env.example .env 2>/dev/null || true
	cd services/auth && npm start

# Start frontend dev server
frontend:
	cd frontend && cp -n .env.example .env 2>/dev/null || true
	cd frontend && npm run dev

# Start everything (auth in background, frontend in foreground)
dev:
	cd services/auth && cp -n .env.example .env 2>/dev/null || true
	cd frontend && cp -n .env.example .env 2>/dev/null || true
	cd services/auth && npm start & 
	cd frontend && npm run dev

# Remove generated files
clean:
	rm -f services/auth/auth.sqlite
	rm -rf services/auth/node_modules
	rm -rf frontend/node_modules
	rm -rf frontend/dist
