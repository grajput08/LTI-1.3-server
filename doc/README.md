# Creating a LTI 1.3 Development Key

\*\*Note: The URLs mentioned in this documentation are for local development (http://localhost:3002). For different environments, use the appropriate URLs:

- Local: http://localhost:3002
- Development: https://dev-lti.yourdomain.com
- Staging: https://staging-lti.yourdomain.com
- Production: https://lti.yourdomain.com

Make sure to replace all instances of http://localhost:3002 with the appropriate environment URL when configuring the LTI tool.\*\*

This section will guide you through the steps necessary to complete the setup of this Development Key.

1. Log in to the Canvas LMS as an administrator.

2. Select the Admin option from the left menu, then select the account the LTI Developer Key will be registered with.

3. To access the Developer Keys select Developer Keys from the list of options on the left.

   ![Canvas Developer Keys](/public/images/1.png)

4. To add a new LTI Developer Key, from the top right of the list, select + Developer Key button [1], then select + LTI Key option [2].

   ![Canvas LTI Developer Key](/public/images/2.png)

## Identifying Information

Enter the following values for the LTI settings:

| Field         | Value                            |
| ------------- | -------------------------------- |
| Key Name      | {A Unique Name}                  |
| Owner Email   | {A valid email address}          |
| Redirect URIs | http://localhost:3002/lti/launch |
| Notes         | {OPTIONAL}                       |

## Configuration Methods

Configure the Developer Key using one of the following methods:

### Method 1: Manual Entry

Enter the following values:

| Field                         | Value                                                   |
| ----------------------------- | ------------------------------------------------------- |
| Title                         | {Enter a Descriptive Title}                             |
| Description                   | {Enter a general description for LTI 1.3 Developer Key} |
| Target Link URI               | http://localhost:3002/lti/launch                        |
| OpenID Connect Initiation Url | http://localhost:3002/lti/login                         |
| JWK Method                    | Public JWK URL                                          |
| Public JWK                    | http://localhost:3002/lti/keys                          |

![Canvas Developer Key base config](/public/images/3.png)

### Method 2: Paste JSON

1. Select "Paste JSON" from the Method field
2. Paste the valid JSON configuration in the LTI 1.3 Configuration field

## LTI Advantage Services Configuration

Select LTI Advantage Services and enable the following settings:

- Can create and view assignment data in the gradebook associated with the tool
- Can view assignment data in the gradebook associated with the tool
- Can view submission data for assignments associated with the tool
- Can create and update submission results for assignments associated with the tool
- Can retrieve user data associated with the context the tool is installed in
- Can register event notice handlers using the Platform Notification Service
- Can fetch assets from the platform using the Asset Service
- Can create reports using the Asset Report Service
- Can update or remove the tool's EULA accepted flag
- Can update public JWK for LTI services
- Can lookup account information
- Can view progress records associated with the context the tool is installed in
- Can view the content of a page the tool is launched from

![Canvas Developer Key LTI Advantage Services](/public/images/4.png)

## Placements Configuration

Supports the following Placements. Configure these settings:

![Canvas Developer Key Placements](/public/images/5.png)

### Assignment Selection

| Field               | Value                                   |
| ------------------- | --------------------------------------- |
| Target Link URI     | http://localhost:3002/lti/launch        |
| Select Message Type | LtiDeepLinkingRequest                   |
| Icon Url            | http://localhost:3002/lti/icon          |
| Text                | {Optional} a descriptive deep link name |
| Selection Height    | {Optional} 768                          |
| Selection Width     | {Optional} 1024                         |

### Course Navigation

| Field           | Value                               |
| --------------- | ----------------------------------- |
| Target Link URI | http://localhost:3002/lti/dashboard |
| Text            | {Optional} Course Navigation        |
| Icon Url        | http://localhost:3002/lti/icon      |

### Account Navigation

| Field           | Value                               |
| --------------- | ----------------------------------- |
| Target Link URI | http://localhost:3002/lti/dashboard |
| Text            | {Optional} Account Navigation       |
| Icon Url        | http://localhost:3002/lti/icon      |

## Finalizing Setup

1. Select Save to record the Canvas LMS LTI 1.3 Developer Key
2. On the Developer Keys list page, enable the Developer Key by changing the state to ON
3. Copy the Client ID Key from the Details column (located above the Show Key button)

![Canvas Developer Key LTI Copy Key](/public/images/6.png)

# Adding LTI Tool as an External App

1. From the Canvas Admin page [1], select Settings from the options on the left [2], then select the Apps tab [3].

   ![Canvas Settings Apps](/public/images/7.png)

2. To view the existing set of Canvas Apps select View App Configurations.

   ![Canvas Settings Apps View App Configuration](/public/images/8.png)

3. To add Skillable as a new Canvas App select + App from the top right of the list.

   ![Canvas Settings Add App](/public/images/9.png)

4. Since we have already configured the Canvas LTI 1.3 Developer Key and have the Client ID, select By Client ID from the Configuration Type field.

   ![Canvas Settings Add App By Client ID](/public/images/10.png)

5. To complete the LTI Tool App configuration:

   - Paste the Client ID copied at the end of the previous exercise into the Client ID field [1]
   - Select Submit [2]

   ![Canvas Settings Add App By Client ID](/public/images/11.png)

6. On the confirmation dialog window select Install to install LTI Tool as a new Canvas External App.

   ![Canvas Settings Add App Install](/public/images/12.png)

# Steps to Test an LTI Tool

Follow these steps to verify your LTI tool integration is working correctly:

## 1. Log in to the LMS

- Go to your LMS (Canvas)
- Log in as an instructor or administrator

## 2. Open a Course

- Select an existing course or create a new one

## 3. Add an Assignment

1. Go to the Assignments section
2. Click "+ Assignment" to create a new one

## 4. Configure External Tool

1. In the assignment settings, locate the "Submission Type" field
2. Choose "External Tool" from the dropdown
3. Click the "Find" button to locate the tool

## 5. Select the LTI Tool

1. From the list of available tools, select your configured LTI tool
2. Attach it to the assignment

## 6. Save and Open the Assignment

1. Save the assignment configuration
2. Use the "Load in a New Window" button to open the assignment

![Canvas Settings Add App Install](/public/images/13.png)
