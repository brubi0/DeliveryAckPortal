Understood. Here is the updated `README.md` file with the author corrected.

***

# NetSuite Delivery Acknowledgment Portal

**Author:** Bruno Rubio, Urku Consulting, LLC
**Version:** 1.0.0

## Overview

This NetSuite application provides a streamlined, paperless solution for customers to acknowledge receipt of goods. It adds a "Send Acknowledgment Email" button to Item Fulfillment records, which initiates a process allowing an external user to provide their name, title, and a captured digital signature on a secure, external page. All acknowledgment data is automatically saved back to the corresponding Item Fulfillment record in NetSuite.

## Features

* **Custom Button:** Adds a button to the Item Fulfillment form to trigger the process on demand.
* **External Signature Page:** Generates a secure, external webpage accessible to customers without a NetSuite login. The page is designed to emulate a standard proof-of-delivery form.
* **Digital Signature Capture:** Utilizes a JavaScript library to capture a user's signature as a PNG image.
* **Automated Data Capture:** Automatically saves the signature image, printed name, title/phone, acknowledgment date, and a confirmation checkbox back to the transaction record.
* **Automated Email Logging:** The acknowledgment email sent to the customer is automatically attached to the Communication subtab of the Item Fulfillment record.

---

## NetSuite Components

### Custom Fields

The following five **Transaction Body Fields** must be created and applied to the **Item Fulfillment** record.

| Label                        | ID                                     | Type      | Description                                                    |
| :--------------------------- | :------------------------------------- | :-------- | :------------------------------------------------------------- |
| Customer Acknowledgement     | `custbody_urku_delivery_acknowledged`  | Check Box | Automatically checked when the customer submits the acknowledgment form. |
| Acknowledgment Date          | `custbody_urku_ack_date`               | Date      | Stores the date the customer submitted the acknowledgment.     |
| Signature File Link          | `custbody_urku_signature_file_link`    | Hyperlink | Stores the link to the signature image file in the File Cabinet. |
| Acknowledged By (Print Name) | `custbody_urku_ack_by_name`            | Text      | Stores the printed name entered by the customer.               |
| Acknowledged By (Title/Phone)| `custbody_urku_ack_by_title_phone`     | Text      | Stores the title and/or phone number entered by the customer.  |

### Saved Scripts

This application consists of three essential script files.

| File Name                         | Script Name                   | Script Type       | Deployment Type                       |
| :-------------------------------- | :---------------------------- | :---------------- | :------------------------------------ |
| `urku_ue_add_ack_button.js`       | Urku UE Add Ack Button        | User Event Script | Deployed to **Item Fulfillment** Record |
| `urku_sl_delivery_ack.js`         | urku_sl_delivery_ack          | Suitelet          | Executed as a Page/Form               |
| `urku_cs_delivery_ack_helper.js`  | urku_cs_delivery_ack_helper   | Client Script     | Not Deployed (Called by Suitelet)     |

---

## Deployment & Configuration

Follow these steps to deploy the application in a NetSuite account.

### 1. Create Custom Fields & File Cabinet Folder

1.  Create the five custom fields as detailed in the table above.
2.  In the File Cabinet (`Documents > Files > File Cabinet`), create a folder to store the signature images (e.g., "Delivery Signatures") and note its internal ID.
3.  Update the `urku_sl_delivery_ack.js` script to replace the placeholder `folder:` value with the correct folder ID.

### 2. Upload Scripts

1.  Create a folder in the File Cabinet for this project (e.g., `/SuiteScripts/DeliveryAckPortal`).
2.  Upload the three script files (`urku_ue...`, `urku_sl...`, `urku_cs...`) to this folder.

### 3. Create and Deploy Scripts

1.  **User Event Script (`urku_ue_add_ack_button.js`):**
    * Create a new Script record pointing to the file.
    * Create a Script Deployment with the following settings:
        * **Applies To:** Item Fulfillment
        * **Status:** Released
        * **Execute as Role:** Administrator

2.  **Suitelet (`urku_sl_delivery_ack.js`):**
    * Create a new Script record pointing to the file.
    * Create a Script Deployment with the following critical permission settings:
        * **Status:** Released
        * **Execute as Role:** Administrator
        * **Available without Login:** **True** (Check the box)
        * **Audience (subtab):** In the **Roles** multi-select field, add the **Online Form User** role.

3.  **Client Script (`urku_cs_delivery_ack_helper.js`):**
    * Create a new Script record pointing to the file. No deployment is necessary.

---

## Usage

1.  Navigate to an Item Fulfillment record with a **Status** of **"Shipped"**.
2.  In **View Mode**, a **"Send Acknowledgment Email"** button will be visible on the form.
3.  Click the button. A confirmation page will appear stating the email was sent, and the email will be logged on the transaction's **Communication** subtab.
4.  The customer clicks the link in the email, which opens the external signature page.
5.  The customer fills out their name, signs in the signature box, and clicks "Submit Acknowledgment".
6.  The data is saved back to the Item Fulfillment record, checking the acknowledgment box and populating the date, name, title, and signature link fields.