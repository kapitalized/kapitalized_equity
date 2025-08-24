# Kapitalized Equity Tracking App

**Project Overview**
The Kapitalized Equity Management app is a web application designed to help companies track equity, manage cap tables, and perform scenario planning. It's built as a full-stack application with a React frontend and a Python FastAPI backend hosted on Vercel. The data is stored in a Supabase database.

**Frontend (React)**
The frontend is a single-page application built with React, as indicated by package.json. The core logic is in src/App.js.

Core Functionality: The application handles user authentication (login, sign up, logout) via Supabase. It allows users to manage multiple companies, and for each company, they can track:

Shareholders: Create and edit shareholder profiles, including name, email, and type.

Share Classes: Share types such as 'Common', 'Preference', 'Convertible', and 'Options'.

Share Issuances: Record individual share issuances, specifying the shareholder, share class, number of shares, price, and issue date.

Data Management: Data is fetched and updated using a REST API provided by the Python backend. The app also includes functionality for bulk-adding shareholders and issuances via manual forms or CSV uploads.

Equity Calculations and Reporting: The app can calculate the total shares and value of a company and presents this information on a dashboard. It generates reports, including a breakdown of share distribution by class and shareholder. It can also generate and download PDF and CSV reports.

Future Scenario Planning: A key feature is the "Future Scenario" tab, which allows users to model a hypothetical future share issuance and see its impact on the cap table without altering the live data. This calculation is handled by the Python backend.

Admin Interface: There's a separate admin panel at /adminhq. This section allows administrators to view all users, companies, and issuances and perform delete operations.

Hosted at Vercel with build from this Github repo, current live version is at Python-App branch, https://kapitalized-equity-git-python-app-kapitalizeds-projects.vercel.app/

The admin function is at https://kapitalized-equity-git-python-app-kapitalizeds-projects.vercel.app/adminhq

There's a supabase setup to manage data and user auth and emails.

**Backend (Python)**
The backend is an API built with the FastAPI framework, as specified in api/requirements.txt and implemented in api/equity-calculator.py. It is designed to be hosted on Vercel.

**API Endpoints: The backend has endpoints:**

/api/equity-calculator (POST): This is the main endpoint for the equity calculation logic. It takes a payload of current company data and, optionally, a future issuance, and returns the calculated current and future equity states.

/api/admin/{entity} (GET): Fetches all data for a specified entity (e.g., 'users', 'companies', 'issuances') for the admin panel.

/api/admin/{entity}/{item_id} (DELETE): Deletes a specific item by ID, with special logic to handle cascading deletions for a company.

Dependencies: The primary dependencies are supabase for database interaction, pandas for data manipulation, and fastapi for the web server.


