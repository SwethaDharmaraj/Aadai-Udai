# AADAIUDAI Database Schema

## MongoDB Collections

### Users
| Field    | Type   | Description              |
|----------|--------|--------------------------|
| phone    | String | Unique, required         |
| name     | String | Optional                 |
| email    | String | Optional                 |
| role     | String | 'user' \| 'admin'        |
| addresses| Array  | Subdocument array        |
| createdAt| Date   | Auto                     |

### Address (embedded in User)
| Field       | Type   |
|-------------|--------|
| name        | String |
| phone       | String |
| addressLine1| String |
| addressLine2| String |
| city        | String |
| state       | String |
| pincode     | String |
| isDefault   | Boolean|

### Products
| Field         | Type   | Description              |
|---------------|--------|--------------------------|
| name          | String | Required                 |
| description   | String | Optional                 |
| category      | String | sarees, kurtis, western-wear, kids-wear |
| price         | Number | Required                 |
| discountedPrice| Number| Optional                 |
| images        | Array  | URLs                     |
| sizes         | Array  | String array             |
| stock         | Number | Default 0                |
| featured      | Boolean| Default false            |

### Orders
| Field          | Type   |
|----------------|--------|
| orderId        | String (unique) |
| user           | ObjectId ref User |
| items          | Array of {product, name, price, quantity, size, image} |
| subtotal       | Number |
| status         | String (pending, confirmed, shipped, delivered, cancelled) |
| shippingAddress| Object |
| createdAt      | Date   |

### Transactions
| Field         | Type   |
|---------------|--------|
| transactionId | String (unique) |
| order         | ObjectId ref Order |
| orderId       | String |
| user          | ObjectId ref User |
| amount        | Number |
| paymentMethod | String (UPI) |
| paymentStatus | String (pending, success, failed) |
| upiRefId      | String |
| createdAt     | Date   |

### Cart
| Field    | Type   |
|----------|--------|
| user     | ObjectId ref User (unique) |
| items    | Array of {product, quantity, size} |
| updatedAt| Date   |

### OTPSession (TTL index)
| Field    | Type   |
|----------|--------|
| phone    | String |
| otp      | String |
| expiresAt| Date   |
| verified | Boolean|
