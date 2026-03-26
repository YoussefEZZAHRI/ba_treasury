# MongoDB Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
# MongoDB Connection String
# For local development, make sure MongoDB is running on your machine
MONGODB_URI=mongodb://localhost:27017/caisse

# For MongoDB Atlas (cloud), use a connection string like:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/caisse?retryWrites=true&w=majority
```

## Local MongoDB Setup

### Option 1: Install MongoDB locally
1. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. The default connection string `mongodb://localhost:27017/caisse` will work

### Option 2: Use Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option 3: Use MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Update the `MONGODB_URI` in `.env.local`

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/[id]` - Get a specific user
- `PUT /api/users/[id]` - Update a user
- `DELETE /api/users/[id]` - Delete a user

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Global Balance
- `GET /api/balances` - Get the global balance
- `GET /api/transactions` - Get all transactions with user info
- `POST /api/transactions` - Add a new transaction to the global balance

## Example Usage

### Create a user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "password": "password123"}'
```

### Add a transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "type": "credit", "reason": "Initial deposit", "userId": "USER_ID"}'
```

### Get global balance
```bash
curl http://localhost:3000/api/balances
```

### Get all transactions
```bash
curl http://localhost:3000/api/transactions
```
