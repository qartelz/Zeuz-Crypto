# User Management System

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.0-darkgreen?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.16-red?logo=django&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?logo=open-source-initiative&logoColor=white)

A Django-based user management system with JWT authentication, role-based access, and support for B2B & B2C user flows.

---

## 📁 Project Structure

myproject/
── api
│   ├── __init__.py
│   ├── __pycache__
│   ├── urls.py
│   └── v1
├── apps
│   ├── account
│   ├── accounts
│   ├── admin
│   ├── b2badmin
│   ├── client
│   └── permission
├── db.sqlite3
├── logs
│   ├── django.log
│   └── security.log
├── manage.py
├── requirements.txt
├── templates
│   └── emails
└── zeuzcryptoserver
    ├── __init__.py
    ├── __pycache__
    ├── asgi.py
    ├── db_dev.sqlite3
    ├── settings
    ├── settings.py
    ├── urls.py
    └── wsgi.py


---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt


2. Environment Setup
cp .env.example .env

3. Database Setup
python manage.py makemigrations accounts
python manage.py migrate
python manage.py createsuperuser


4. Create Required Directories
mkdir -p logs media/avatars static

5. Run Development Server
python manage.py runserver

📧 Email Configuration

For Gmail (recommended for development):

Enable 2-factor authentication

Generate an app password

Update .env with your credentials

🔐 API Authentication

All endpoints use JWT authentication:

Authorization: Bearer <access_token>


Get tokens by logging in:

curl -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

📝 API Endpoints
Authentication

POST /api/accounts/login/ – Login

POST /api/accounts/logout/ – Logout

POST /api/accounts/token/refresh/ – Refresh token

Registration

POST /api/accounts/register/ – B2C user registration

POST /api/accounts/b2b-admin/register/ – B2B admin registration (Admin only)

POST /api/accounts/b2b-user/register/ – B2B user registration (B2B Admin only)

User Management

GET /api/accounts/users/ – List users (with filters)

GET /api/accounts/me/ – Current user info

Password Management

POST /api/accounts/password-reset/ – Request reset

POST /api/accounts/password-reset/confirm/{token}/ – Confirm reset

POST /api/accounts/password-setup/{token}/ – Setup password

POST /api/accounts/change-password/ – Change password

Batch Management

POST /api/accounts/batch/create/ – Create batch

GET /api/accounts/batch/list/ – List batches

GET /api/accounts/batch/users/{batch_id}/ – List batch users

Approvals

GET /api/accounts/b2b-admin/approval-list/ – List approvals

POST /api/accounts/b2b-admin/approve/{user_id}/ – Approve

POST /api/accounts/b2b-admin/reject/{user_id}/ – Reject

Profile & Wallet

GET /api/accounts/wallet/ – User wallet

GET /api/accounts/profile/ – User profile

PUT /api/accounts/profile/ – Update profile

👥 User Roles & Permissions
Admin

Can create B2B Admins

Can approve/reject B2B Admins

Can view all users

Full system access

B2B Admin (requires approval)

Can create B2B Users

Can create batches

Can view their created users

Limited to their own data

B2B User

Standard user under B2B Admin

Can update own profile

View own wallet

B2C User

Self-registered user

Can update own profile

View own wallet

🔧 Production Deployment
Environment Variables
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_HOST=your-db-host
EMAIL_HOST_USER=your-email@company.com

Security Checklist

 Change SECRET_KEY

 Set DEBUG=False

 Configure proper ALLOWED_HOSTS

 Set up SSL/HTTPS

 Configure email backend

 Set up database backups

 Configure logging

Static Files
python manage.py collectstatic

🧪 Testing Examples
Register B2C User
curl -X POST http://localhost:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "mobile": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "password": "securepass123",
    "password_confirm": "securepass123"
  }'

Create B2B Admin (as superuser)
curl -X POST http://localhost:8000/api/accounts/b2b-admin/register/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "admin@company.com",
    "mobile": "+1234567890",
    "first_name": "Company",
    "last_name": "Admin"
  }'

