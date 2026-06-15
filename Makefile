.PHONY: install dev auth books rentals frontend clean

# Install all dependencies
install:
	cd services/auth && npm install
	cd services/books && npm install
	cd services/rentals && npm install
	cd frontend && npm install

# Start AuthService
auth:
	cd services/auth && cp -n .env.example .env 2>/dev/null || true
	cd services/auth && npm start

# Start BookService
books:
	cd services/books && cp -n .env.example .env 2>/dev/null || true
	cd services/books && npm start

# Start RentalService
rentals:
	cd services/rentals && cp -n .env.example .env 2>/dev/null || true
	cd services/rentals && npm start

# Start frontend dev server
frontend:
	cd frontend && cp -n .env.example .env 2>/dev/null || true
	cd frontend && npm run dev

# Start everything (auth in background, frontend in foreground)
dev:
	cd services/auth && cp -n .env.example .env 2>/dev/null || true
	cd services/books && cp -n .env.example .env 2>/dev/null || true
	cd services/rentals && cp -n .env.example .env 2>/dev/null || true
	cd frontend && cp -n .env.example .env 2>/dev/null || true
	cd services/auth && npm start & 
	cd services/books && npm start &
	cd services/rentals && npm start &
	cd frontend && npm run dev

# Remove generated files
clean:
	rm -f services/auth/auth.sqlite
	rm -f services/books/books.sqlite
	rm -f services/rentals/rentals.sqlite
	rm -rf services/auth/node_modules
	rm -rf services/books/node_modules
	rm -rf services/rentals/node_modules
	rm -rf frontend/node_modules
	rm -rf frontend/dist
