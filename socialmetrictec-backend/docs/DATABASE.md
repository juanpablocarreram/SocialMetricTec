### Database Setup Instructions
This document outlines the procedure for initializing the MySQL database environment required for the SocialMetricTec API.

1. Database Provisioning (Private)
The initial creation of the database and the dedicated system user is handled via a private configuration.

Automated Script: The project maintainer utilizes a script located in the setup_sql/ directory to automatically provision the database and user credentials.

Access: This directory is excluded from version control for security purposes. If you are a project collaborator, you must request this script from the project owner.

Manual Setup: If you are deploying this independently, you must manually execute the following operations in your MySQL instance before proceeding:

Create a database named socialmetrictec.

Create a local user and assign a secure password.

Grant the user all privileges on the socialmetrictec schema.

2. Schema Migration (Public)
Once the database and user have been provisioned, you must apply the table structures and relationships. The public schema script includes logic for projects, metrics, and user management.

Execute the following command from the project root:

Bash
mysql -u [your_user] -p
(Insert your user password)
source ./db/database_setup.sql

3. Root User Creation
In order to create the root user on the database, you must define its credentials on your .env on the variables ROOT_USERNAME, ROOT_EMAIL and ROOT_PASSWORD once you have defined them you must execute the Python Script on db/admin_creation.py

4. Schema Architecture Overview
The database is designed with the following constraints and features:

Engine: All tables use the InnoDB engine for ACID compliance and foreign key support.

Character Set: utf8mb4 is used throughout to ensure full Unicode support.

Data Integrity: * Cascade Deletes: Foreign key relationships for metrics, sub_metrics, and beneficiaries include ON DELETE CASCADE to maintain referential integrity automatically.

JSON Support: The project table utilizes a native JSON column for dynamic content storage (requires MySQL 5.7.8+).

Numeric Precision: sub_metric_value uses DECIMAL(18,4) to prevent rounding errors common with floating-point types.

5. Application Configuration
After the database is initialized, update your local .env file with the corresponding connection string to allow the FastAPI application to establish a session:
For testing the connection, simply run the file on db/database.py

Example of .env database URL variable
DATABASE_URL=mysql+pymysql://[user]:[password]@localhost/socialmetrictec