# Site Survey Tool - Administrator Guide

Welcome to the Site Survey Tool! As an administrator, you have full control over Organizations, Properties, System Settings, and User Management.

## Dashboard
Upon logging in, you will be presented with a high-level summary overviewing the overall progress of surveys across properties you manage.

## Managing Organizations
1. Navigate to **Organizations** from the main sidebar.
2. Click **Create Organization**.
3. Fill in the organization name and necessary details.
4. Organizations are the top-level container for all surveyed properties.

## Property Pipeline & Hierarchy
To prepare a survey for a Field Engineer, you must build the spatial hierarchy:
1. **Properties**: Go to Properties -> Add New Property (e.g., 'Downtown Campus'). Assign it to an Organization.
2. **Buildings**: Select the newly created Property and add Buildings (e.g., 'Tower A').
3. **Floors**: Enter the Building and create Floor records (e.g., 'Floor 1', 'Basement').

## User Assignment
To ensure field engineers can see the correct surveys and upload floor plans:
1. Navigate to **Users** management.
2. Invite or create a new user with the `ROLE_ENGINEER` profile.
3. Use the **Memberships** or **Assign Property** panels to link the engineer to the specific Property or Organization they need to access.

## Reporting & Exports
After an engineer has uploaded floor plans and completed their physical checklists, an Administrator can generate comprehensive PDF reports:
1. Navigate to the **Reports** tab.
2. Select a target **Property**.
3. Click "Generate Blueprint PDF".
4. The system will asynchronously gather data across floors, canvas interactions, and checklists, placing them into a finalized printable PDF.
