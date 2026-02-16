# Antalya Real Estate Platform (AREP) - Product Requirements Document

## 1. Project Overview
**Objective:** To develop a specialized real estate platform for the Antalya region that ensures high data quality through a strict moderation workflow. The system connects authorized Real Estate Consultants with visitors via Web and Mobile interfaces, governed by an Administrative approval process.

---

## 2. User Roles & Permissions (RBAC)

### 👤 Consultant (Agent)
* **Access:** Restricted Dashboard.
* **Capabilities:**
    * Create and manage property listings.
    * Upload, reorder, and delete property photos.
    * Save listings as `Draft` to resume editing later.
    * Submit listings for `Admin Approval`.
    * Revise listings based on Admin rejection feedback.

### 🛡️ Administrator (Admin)
* **Access:** Full Admin Panel.
* **Capabilities:**
    * **Moderation Queue:** Review listings waiting for approval.
    * **Actions:**
        * `Approve`: Publish to live site.
        * `Request Changes`: Send back to Consultant with mandatory feedback notes.
        * `Reject`: Permanently archive/deny.
    * User Management (Onboard/Suspend Consultants).

### 🌍 Visitor (End-User)
* **Access:** Public Web/Mobile Interface (No Login Required).
* **Capabilities:**
    * Search and filter properties (Price, Location, Type).
    * View property details and high-res image galleries.
    * **Map Interaction:** Filter by neighborhood or view properties within the visible map area (Bounding Box).

---

## 3. MVP Specifications (Phase 1)

### 3.1 Authentication & Authorization
- [ ] Secure Login/Logout for Consultants and Admins.
- [ ] **Role-Based Access Control (RBAC):** Middleware to protect admin routes and separate user privileges.
- [ ] JWT implementation for cross-platform session management (Web + Mobile).

### 3.2 Listing Management Module
- [ ] **Form Fields:** Title, Description, Price, Currency, Category (Rent/Sale), Sq Meters, Room Count.
- [ ] **Location Services:**
    - Address selection (City > District > Neighborhood).
    - Pin placement on map (Lat/Long storage).
- [ ] **Media Handling:** Image upload with client-side resizing and server-side compression.

### 3.3 Listing Lifecycle (State Machine)
The database must support the following states for a listing:
1. `DRAFT`: Visible only to the Consultant.
2. `PENDING_REVIEW`: Locked for Consultant, visible to Admin.
3. `NEEDS_CHANGES`: Returned to Consultant with admin notes.
4. `PUBLISHED`: Publicly visible to Visitors.
5. `ARCHIVED`: Removed from public view (Sold/Rented).

### 3.4 Search & Discovery Engine
- [ ] **Filtering:** Price range, Property Type, Room count.
- [ ] **Geospatial Search:**
    - "Search in this area" button (Bounding Box query).
    - Neighborhood (Mahalle) based filtering.

---

## 4. Roadmap & Future Features (Phase 2+)

### Engagement & Social
- [ ] **Favorites:** Allow visitors to save listings (requires User Auth).
- [ ] **Comments/Q&A:** Moderated public questions on listing pages.

### Notifications
- [ ] **Transactional Emails:** "Your listing was approved", "New listing for review".
- [ ] **Push Notifications:** Mobile alerts for status changes.

### AI & Automation
- [ ] **Content Moderation:** Auto-detect inappropriate images.
- [ ] **Smart Tagging:** AI analysis of photos to auto-fill tags (e.g., "Pool", "Sea View").
- [ ] **Copywriting Assistant:** Generative AI to improve listing descriptions.

---

## 5. Technical Stack Recommendations (Suggestion)
* **Backend:** Node.js (NestJS) or Go / Python (Django/FastAPI)
* **Frontend:** React / Next.js (Web), Flutter or React Native (Mobile)
* **Database:** PostgreSQL (with PostGIS extension for map features)
* **Storage:** AWS S3 or MinIO