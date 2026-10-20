# 🍔 BiteGo — Food Delivery Web Application

BiteGo is a full-stack food delivery web application that connects customers, restaurants, delivery partners, and administrators through a single platform. Customers can explore restaurants, order food, and track deliveries, while restaurant partners manage orders and menus, delivery partners handle pickups and deliveries, and administrators manage platform operations.

## 📌 Project Overview

BiteGo aims to simplify the online food ordering and delivery process through a role-based platform with centralized order management.

**Project Name:** BiteGo  
**Project Type:** Full-Stack Web Application  
**Frontend:** React + Vite  
**Backend:** Node.js + Express.js  
**Database:** MongoDB  
**Deployment:** Vercel for frontend; a compatible Node.js hosting service for the backend

## ✨ Features

### 🛍️ Customer Portal
- Customer registration and login
- Browse restaurants and food menus
- Search and explore food items
- Add items to the cart
- Manage delivery addresses
- Place food orders
- Track order status
- View order history
- Delivery OTP verification workflow, if enabled

### 🏪 Restaurant / Merchant Portal
- Restaurant dashboard
- Manage restaurant profile
- Add, update, and remove menu items
- Receive and manage customer orders
- Accept or reject orders
- Update food preparation status
- Mark orders ready for pickup

### 🛵 Delivery / Fleet Portal
- Delivery partner dashboard
- View eligible incoming delivery requests
- Accept or decline delivery requests
- Manage assigned orders
- Pick up restaurant orders
- Update delivery status
- Complete delivery using OTP verification, if enabled
- View delivery history and earnings, where implemented

### 🛡️ Admin Portal
- Manage platform users
- Manage restaurant partners and verification
- Monitor orders and platform operations
- Review restaurant applications
- Manage platform settings and commissions, where implemented

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development and build tool |
| Tailwind CSS | UI styling, if configured |
| React Router | Frontend navigation |
| Node.js | Backend runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JWT / Cookies | Authentication, according to the existing implementation |
| Vercel | Frontend deployment |

Additional libraries depend on the packages configured in the project.

## 🏗️ Application Architecture

```text
                    BiteGo Web Application
                             |
              +--------------+--------------+
              |              |              |
          Customer       Restaurant       Fleet
           Portal          Portal         Portal
              |              |              |
              +--------------+--------------+
                             |
                       React Frontend
                             |
                        REST API
                             |
                     Node.js + Express
                             |
                         Mongoose
                             |
                       MongoDB Atlas
                             |
                       Admin Portal
```

The application uses a centralized backend and database so that customer orders, restaurant updates, and delivery status changes can be coordinated through shared order records.

## 📂 Project Structure

The exact structure may differ depending on the existing project.

```text
BiteGo/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── context/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

**Note:** Adjust the directory names and entry-point filenames to match the actual repository.

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js and npm
- Git
- MongoDB Atlas account or another supported MongoDB deployment
- Visual Studio Code or another code editor

Check the installed versions:

```bash
node --version
npm --version
git --version
```

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/BiteGo.git
cd BiteGo
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install frontend dependencies

Open a terminal in the frontend directory:

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

### 4. Configure environment variables

Create the appropriate `.env` files based on the existing `.env.example` files and backend configuration.

Example frontend configuration:

```env
VITE_API_URL=http://localhost:5000/api
```

Example backend configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
CLIENT_URL=http://localhost:5173
```

These variable names and port numbers are examples. Use the actual names, ports, and configuration expected by the project.

**Security:** Never commit real `.env` files, MongoDB credentials, JWT secrets, API keys, or passwords to GitHub.

### 5. Start the backend

From the backend directory, use the start script defined in `package.json`. For example:

```bash
npm run dev
```

If no development script exists, use the project's configured production/start script or add an appropriate script.

### 6. Start the frontend

From the frontend directory:

```bash
npm run dev
```

Open the local URL printed by Vite, commonly:

```text
http://localhost:5173
```

The frontend and backend must use matching API URLs and CORS settings.

## 🔄 Order Workflow

The intended order lifecycle is:

1. Customer selects a restaurant and places an order.
2. The backend saves the order in MongoDB.
3. The restaurant receives and accepts the order.
4. The restaurant prepares the food.
5. The restaurant marks the order ready for pickup.
6. An eligible delivery partner accepts the delivery request.
7. The delivery partner picks up the order.
8. The customer can view the updated delivery status.
9. The delivery partner completes delivery using OTP verification, if enabled.
10. The order is marked delivered.

Actual status names and available actions depend on the implementation.

## 🗄️ Database

BiteGo uses MongoDB to persist application data.

Depending on the implemented features, collections may include:

- Users
- Restaurants
- Menu items
- Orders
- Reviews
- Notifications
- Restaurant applications
- Delivery assignments

The actual collection names depend on the configured Mongoose models.

## 🌐 Deployment

### Frontend — Vercel

1. Push the project to GitHub.
2. Open [Vercel](https://vercel.com/).
3. Import the GitHub repository.
4. Configure the frontend root directory.
5. Set the build command, typically `npm run build`.
6. Set the output directory to `dist` for a standard Vite build.
7. Configure the production API URL.
8. Deploy and test the live website.

If the repository contains separate frontend and backend directories, configure Vercel's root directory and build settings appropriately.

### Backend — Node.js Hosting

Deploy the Express backend to a Node.js-compatible hosting service.

Configure:
- The backend start command
- MongoDB connection string
- JWT or other authentication secrets
- Allowed frontend origins
- Production API URL

Update the frontend API URL to point to the deployed backend.

### MongoDB Atlas

Ensure that:
- The production database connection is configured securely.
- Network access permits the deployed backend to connect.
- Database credentials are stored as environment variables.
- The deployed application uses the intended database.

## 🔐 Security Considerations

- Hash passwords before storing them.
- Validate requests on both the frontend and backend.
- Protect private routes with authentication and role-based authorization.
- Verify order ownership and delivery-agent assignment on the backend.
- Keep secrets out of source control.
- Never trust frontend-only order status changes.
- Validate delivery OTPs on the backend if OTP verification is implemented.

## 🧪 Testing Checklist

- [ ] Customer can register and log in.
- [ ] Registration data persists in MongoDB.
- [ ] Customer can browse restaurants and menus.
- [ ] Customer can place an order.
- [ ] Restaurant can receive and update the order.
- [ ] Ready-for-pickup orders become available to eligible delivery partners.
- [ ] Delivery partners can accept and pick up orders.
- [ ] Customer tracking reflects actual order status.
- [ ] Delivery completion follows the configured verification process.
- [ ] Admin functions work according to assigned permissions.
- [ ] Production frontend can communicate with the deployed backend.

## 🔮 Future Enhancements

- Real-time order tracking
- Integrated online payment gateway
- Interactive maps and route navigation
- Push notifications
- Restaurant analytics
- Delivery partner performance analytics
- Coupon and loyalty programs
- Improved accessibility and mobile responsiveness

## 👨‍💻 Development

BiteGo is a full-stack web development project designed to demonstrate restaurant management, customer ordering, role-based access, database integration, and delivery workflow coordination.

## 📄 License

Choose and add a suitable open-source license if you intend to distribute this project publicly. If no license is added, the default copyright rules apply.

---

**BiteGo — Order Fresh. Eat Happy.** 🍔
