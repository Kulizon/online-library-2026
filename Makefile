.PHONY: install env dev auth books rentals frontend test clean

# Install all dependencies
install:
	cd services/auth && npm install
	cd services/books && npm install
	cd services/rentals && npm install
	cd frontend && npm install

# Copy .env.example -> .env for every service and the frontend (safe, never overwrites)
env:
	cd services/auth && cp -n .env.example .env 2>/dev/null || true
	cd services/books && cp -n .env.example .env 2>/dev/null || true
	cd services/rentals && cp -n .env.example .env 2>/dev/null || true
	cd frontend && cp -n .env.example .env 2>/dev/null || true

# Start AuthService
auth: env
	cd services/auth && npm start

# Start BookService
books: env
	cd services/books && npm start

# Start RentalService
rentals: env
	cd services/rentals && npm start

# Start frontend dev server
frontend: env
	cd frontend && npm run dev

# Start everything (services in background, frontend in foreground)
dev: env
	cd services/auth && npm start &
	cd services/books && npm start &
	cd services/rentals && npm start &
	cd frontend && npm run dev

# Run integration tests (starts services, waits for them to be ready, then runs Jest)
test: env
	(cd services/auth && npm start) & AUTH_PID=$$!; \
	(cd services/books && npm start) & BOOKS_PID=$$!; \
	(cd services/rentals && npm start) & RENTALS_PID=$$!; \
	sleep 8; \
	(cd integration-tests && npm install --silent && npm test); \
	STATUS=$$?; kill $$AUTH_PID $$BOOKS_PID $$RENTALS_PID 2>/dev/null || true; exit $$STATUS

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
