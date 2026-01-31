# AADAIUDAI - Folder Structure

```
AADAIUDAI/
├── client/                     # React Frontend
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── Layout.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx / Home.css
│   │   │   ├── About.jsx / About.css
│   │   │   ├── Login.jsx / Login.css
│   │   │   ├── Profile.jsx / Profile.css
│   │   │   ├── Collections.jsx / Collections.css
│   │   │   ├── ProductDetail.jsx / ProductDetail.css
│   │   │   ├── Cart.jsx / Cart.css
│   │   │   ├── Checkout.jsx / Checkout.css
│   │   │   ├── Orders.jsx / Orders.css
│   │   │   ├── Transactions.jsx / Transactions.css
│   │   │   └── Admin.jsx / Admin.css
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express Backend
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Transaction.js
│   │   ├── Cart.js
│   │   └── OTPSession.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── admin.js
│   ├── services/
│   │   └── otpService.js
│   ├── scripts/
│   │   └── seedDatabase.js
│   ├── index.js
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── electron/
│   └── main.js
│
├── database/
│   └── SCHEMA.md
│
├── package.json
├── README.md
└── FOLDER_STRUCTURE.md
```

## MVC Mapping

- **Models**: `server/models/`
- **Views**: `client/src/pages/` + `client/src/components/`
- **Controllers**: `server/controllers/`
